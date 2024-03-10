// Code to take a set of typescript files and parse them into our (simplified) representation of the
// TS type system.

// Most of the code is based on examples from https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API.

import * as ts from 'typescript';
import { SPECIAL_TYPES } from '../../shared/check-type';
import { assertNonNull } from '../../shared/language';
import {
  Field,
  ReferenceType,
  resolveType,
  Type,
  Schema,
  typeToString,
  isEnum,
} from '../../shared/type-definitions';
import { allTypes } from './generate-schema';

function compareTypes(a: Type, b: Type): number {
  return typeToString(a).localeCompare(typeToString(b));
}

// Recursively visits all types in the given set of type definitions.
// Stops recursing if the visitor returned false.
export function visitAllTypes(
  schema: Schema,
  visitor: (type: Type) => boolean | void,
  startType?: Type
) {
  function recurseOnType(type: Type) {
    if (visitor(type) === false) return;
    switch (type.kind) {
      case 'array':
      case 'partial':
        recurseOnType(type.elementType);
        break;
      case 'mapped':
        recurseOnType(type.mapFrom);
        recurseOnType(type.mapTo);
        break;
      case 'union':
        for (const member of type.unionMembers) {
          recurseOnType(member);
        }
        break;
      case 'intersection':
        for (const member of type.intersectionMembers) {
          recurseOnType(member);
        }
        break;
      case 'interface':
        for (const field of type.fields) {
          recurseOnType(field.type);
        }
        for (const heritage of type.heritage) {
          recurseOnType(heritage);
        }
        break;
      // Non-recursive cases:
      case 'reference-type':
      case 'boolean':
      case 'number':
      case 'null':
      case 'unknown':
      case 'undefined':
      case 'string':
      case 'string-literal':
      case 'boolean-literal':
      case 'number-literal':
        break;
    }
  }
  if (startType !== undefined) {
    recurseOnType(startType);
  } else {
    for (const type of allTypes(schema)) {
      recurseOnType(type);
    }
  }
}

function unionKinds(types: Schema, members: Type[]): string[] | undefined {
  const result: string[] = [];
  for (const member of members) {
    const resolvedMember = resolveType(types, member);
    if (resolvedMember.kind === 'interface') {
      const kindField = resolvedMember.fields.find(
        field =>
          field.name === 'kind' &&
          !field.optional &&
          field.type.kind == 'string-literal'
      );
      if (kindField !== undefined && kindField.type.kind == 'string-literal') {
        result.push(kindField.type.value);
        continue;
      }
    }
    return undefined;
  }
  return result;
}

function nodeToType(
  checker: ts.TypeChecker,
  node: ts.Node,
  name?: string,
  filename?: string
): Type {
  const kind = node.kind;
  if (kind == ts.SyntaxKind.StringKeyword) {
    return { kind: 'string', name, filename };
  }
  if (kind == ts.SyntaxKind.NumberKeyword) {
    return { kind: 'number', name, filename };
  }
  if (kind == ts.SyntaxKind.BooleanKeyword) {
    return { kind: 'boolean', name, filename };
  }
  if (ts.isArrayTypeNode(node)) {
    return {
      kind: 'array',
      elementType: nodeToType(checker, node.elementType),
      name,
      filename,
    };
  }
  if (ts.isUnionTypeNode(node)) {
    const members = node.types.map(value => nodeToType(checker, value));
    return {
      kind: 'union',
      unionMembers: members.sort(compareTypes),
      name,
      filename,
    };
  }
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) {
    return {
      kind: 'string-literal',
      value: node.literal.text,
      name,
      filename,
    };
  }
  if (ts.isLiteralTypeNode(node) && ts.isNumericLiteral(node.literal)) {
    return {
      kind: 'number-literal',
      value: parseFloat(node.literal.text),
      name,
      filename,
    };
  }
  if (ts.isIndexedAccessTypeNode(node)) {
    return tsTypeToType(
      checker,
      checker.getTypeFromTypeNode(node),
      name,
      filename
    );
  }
  if (ts.isTypeReferenceNode(node)) {
    if (
      node.typeName.getText() === 'Array' &&
      node.typeArguments?.length == 1
    ) {
      return {
        kind: 'array',
        elementType: nodeToType(checker, node.typeArguments[0]),
        name,
        filename,
      };
    }
    if (
      node.typeName.getText() === 'Partial' &&
      node.typeArguments?.length == 1
    ) {
      return {
        kind: 'partial',
        elementType: nodeToType(checker, node.typeArguments[0]),
        name,
        filename,
      };
    }
    if (
      node.typeName.getText() === 'Record' &&
      node.typeArguments?.length == 2
    ) {
      return {
        kind: 'mapped',
        mapFrom: nodeToType(checker, node.typeArguments[0]),
        optional: false,
        mapTo: nodeToType(checker, node.typeArguments[1]),
        name,
        filename,
      };
    }
    if (
      node.typeName.getText() === 'Omit' &&
      node.typeArguments?.length == 2
    ) {
      const base = nodeToType(checker, node.typeArguments[0]);
      const omit = nodeToType(checker, node.typeArguments[1]);
      const fields = isEnum(omit);
      if (!fields) {
        throw new Error(`Only Omit<T, K> is supported where K is a string literal or union of string literals.`);
      }
      return {
        kind: 'omit',
        base,
        omittedFields: fields,
        name,
        filename,
      };
    }
    if (node.typeArguments) {
      throw new Error(
        `Type arguments are not yet supported: ${node.getText()} / kind = ${
          node.kind
        }`
      );
    }
    if (SPECIAL_TYPES.includes(node.typeName.getText())) {
      return {
        kind: 'string',
        specialName: node.typeName.getText(),
        name,
        filename,
      };
    }
    return {
      kind: 'reference-type',
      referencedTypeName: node.typeName.getText(),
      name,
      filename,
    };
  }
  if (ts.isTypeOperatorNode(node) && node.operator == ts.SyntaxKind.KeyOfKeyword) {
    return {
      kind: 'keyof',
      base: nodeToType(checker, node.type),
      name,
      filename,
    };
  }
  if (ts.isTypeOperatorNode(node) && node.operator == ts.SyntaxKind.ReadonlyKeyword) {
    return nodeToType(checker, node.type, name, filename);
  }
  if (ts.isParenthesizedTypeNode(node)) {
    return nodeToType(checker, node.type, name, filename);
  }
  if (
    ts.isLiteralTypeNode(node) &&
    node.literal.kind == ts.SyntaxKind.NullKeyword
  ) {
    return {
      kind: 'null',
      name,
      filename,
    };
  }
  if (node.kind == ts.SyntaxKind.UndefinedKeyword) {
    return {
      kind: 'undefined',
      name,
      filename,
    };
  }
  if (ts.isTypeLiteralNode(node) || ts.isInterfaceDeclaration(node)) {
    if (ts.isInterfaceDeclaration(node) && Boolean(node.typeParameters)) {
      throw new Error(
        `Type arguments are not yet supported: ${node.getText()} / kind = ${
          node.kind
        }`
      );
    }
    const heritage: ReferenceType[] = [];
    if (
      ts.isInterfaceDeclaration(node) &&
      node.heritageClauses !== undefined &&
      node.heritageClauses.length > 0
    ) {
      for (const heritageClause of node.heritageClauses) {
        for (const heritageClauseType of heritageClause.types) {
          const h = heritageClauseType.expression;
          if (!ts.isIdentifier(h)) {
            console.log(node.getFullText());
            throw new Error(
              `heritage clause can only be an identifier for now, found kind = ${h.kind}`
            );
          }
          heritage.push({
            kind: 'reference-type',
            referencedTypeName: h.text,
            filename,
          });
        }
      }
    }
    // Is this index signature?
    if (node.members.length === 1 && ts.isIndexSignatureDeclaration(node.members[0])) {
      if (heritage.length > 0) {
        throw new Error(`Index signature cannot have heritage.`);
      }
      return {
        kind: 'index-signature',
        keyType: nodeToType(checker, assertNonNull(node.members[0].parameters[0].type)),
        valueType: nodeToType(checker, assertNonNull(node.members[0].type)),
        name,
        filename,
      }
    }
    return {
      kind: 'interface',
      fields: node.members.map(member => tsMemberToField(checker, member)),
      heritage,
      name,
      filename,
    };
  }
  if (ts.isIntersectionTypeNode(node)) {
    // Is this a 'branded primitive' (https://github.com/Microsoft/TypeScript/wiki/FAQ#can-i-make-a-type-alias-nominal)?
    if (node.types.length == 2) {
      const a = node.types[0];
      const b = node.types[1];
      // First type should be a string.
      if (a.kind == ts.SyntaxKind.StringKeyword) {
        // Second type should be a type literal with one unique member.
        if (
          ts.isTypeLiteralNode(b) &&
          b.members.length === 1 &&
          assertNonNull(b.members[0].name).getText().startsWith('_')
        ) {
          return {
            kind: 'string',
            name,
            filename,
          };
        }
      }
    }
  }
  if (ts.isIntersectionTypeNode(node)) {
    return {
      kind: 'intersection',
      intersectionMembers: node.types.map(value => nodeToType(checker, value)),
      name,
      filename,
    };
  }
  if (
    ts.isLiteralTypeNode(node) &&
    (node.literal.kind === ts.SyntaxKind.FalseKeyword ||
      node.literal.kind === ts.SyntaxKind.TrueKeyword)
  ) {
    return {
      kind: 'boolean-literal',
      value: node.literal.kind === ts.SyntaxKind.TrueKeyword,
      name,
      filename,
    };
  }
  if (node.kind == ts.SyntaxKind.UnknownKeyword) {
    return {
      kind: 'unknown',
      name,
      filename,
    };
  }
  if (ts.isMappedTypeNode(node)) {
    if (node.members?.length !== 0) {
      throw new Error(`Unsupported mapped type with members.`);
    }
    if (node.type === undefined) {
      throw new Error(`Unsupported mapped type with missing type.`);
    }
    if (node.typeParameter.constraint === undefined) {
      throw new Error(`Unsupported mapped type with missing constraint.`);
    }
    return {
      kind: 'mapped',
      name,
      filename,
      mapTo: nodeToType(checker, node.type),
      optional: node.questionToken?.kind === ts.SyntaxKind.QuestionToken,
      mapFrom: nodeToType(checker, node.typeParameter.constraint),
    };
  }
  throw Error(`Unsupported node: ${node.getText()} / kind = ${node.kind}`);
}

// We generally operate on the syntax nodes directly, but for index access types,
// we want the type-checkers help to resolve that first.
// We don't always use the type-checker, because walking the nodes is easier, e.g.
// there doesn't seem to be a type for arrays, but node's have ArrayTypeNode.
function tsTypeToType(
  checker: ts.TypeChecker,
  tsType: ts.Type,
  name: string | undefined,
  filename: string | undefined
): Type {
  if (tsType.isUnion()) {
    const members = tsType.types.map(t =>
      tsTypeToType(checker, t, undefined, filename)
    );
    return {
      kind: 'union',
      unionMembers: members.sort(compareTypes),
      name,
      filename,
    };
  }
  if (tsType.isStringLiteral()) {
    return {
      kind: 'string-literal',
      value: tsType.value,
      name,
      filename,
    };
  }
  if (tsType.isNumberLiteral()) {
    return {
      kind: 'number-literal',
      value: tsType.value,
      name,
      filename,
    };
  }
  throw new Error(
    `Type not supported: ${checker.typeToString(tsType)} in ${filename}`
  );
}

function tsMemberToField(checker: ts.TypeChecker, member: ts.Node): Field {
  if (ts.isPropertySignature(member)) {
    return {
      name: member.name.getText(),
      type: nodeToType(checker, assertNonNull(member.type)),
      optional: member.questionToken !== undefined,
    };
  }
  throw new Error(
    `Unsupported property declaration: ${member.getText()} / ${member.kind}`
  );
}

// Visit all relevant nodes to collect the information we need.
function visit(
  result: Schema,
  assertedTypes: string[],
  checker: ts.TypeChecker,
  node: ts.Node,
  root: string
) {
  if (ts.isModuleDeclaration(node)) {
    // This is a namespace, visit its children
    ts.forEachChild(node, node =>
      visit(result, assertedTypes, checker, node, root)
    );
    return;
  }

  // Handle asserted types (by checking import of assertX functions).
  if (
    ts.isImportDeclaration(node) &&
    node.importClause?.namedBindings?.kind === ts.SyntaxKind.NamedImports
  ) {
    const path = node.moduleSpecifier.getText();
    if (path.endsWith(`/check-type.generated'`)) {
      for (const element of node.importClause.namedBindings.elements) {
        const name = element.name.getText();
        if (name.startsWith('assert')) {
          assertedTypes.push(name.slice('assert'.length));
        }
      }
    }
  }

  // Handle type declarations.
  const sourceFile = node.getSourceFile().getFullText();
  const commentRanges = ts.getLeadingCommentRanges(
    sourceFile,
    node.getFullStart()
  );
  let comments = '';
  if (commentRanges && commentRanges.length > 0) {
    comments += `${commentRanges.map(r => sourceFile.slice(r.pos, r.end))}\n`;
  }
  const fileAnnotation = '// @check-type:entire-file\n';
  const nodeAnnotation = '// @check-type\n';
  const ignoreChangesAnnotation = '// @check-type:ignore-changes\n';
  const nodeHasAnnotation = comments.includes(nodeAnnotation);
  const nodeHasIgnoreChangesAnnotation = comments.includes(
    ignoreChangesAnnotation
  );
  const fileHasAnnotation = sourceFile.includes(fileAnnotation);
  // Should we consider this node?
  if (!fileHasAnnotation && !nodeHasAnnotation) {
    if (nodeHasIgnoreChangesAnnotation) {
      throw new Error(
        `The following node has a @check-type:ignore-changes annotation, but not $check-type. Node = ${node.getFullText()}`
      );
    }
    return;
  }
  // There are two supported ways to define a type: via an interface, or a type alias.
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
    if (node.typeParameters) {
      throw new Error('Generic interfaces are not supported.');
    }
    const symbol = assertNonNull(checker.getSymbolAtLocation(node.name));
    const name = checker.symbolToString(symbol);

    if (name in result) {
      throw new Error(
        `Duplicate definition for type with ${name}. Namespaces/modules are not currently supported.`
      );
    }
    const filename = node.getSourceFile().fileName.substring(root.length + 1);
    result.types[name] = nodeToType(
      checker,
      ts.isTypeAliasDeclaration(node) ? node.type : node,
      name,
      filename
    );
    if (nodeHasIgnoreChangesAnnotation) {
      result.types[name].ignoreChanges = true;
    }
  } else if (!fileHasAnnotation) {
    throw new Error(
      `The following node has a @check-type annotation, but is not a type definition, so the annotation has no effect. Node = ${node.getFullText()}`
    );
  }
}

function compilerOptions(): ts.CompilerOptions {
  // TODO: load the real tsconfig.
  return {
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    resolveJsonModule: true,
    esModuleInterop: true,
    noEmit: true,
    allowSyntheticDefaultImports: true,
    isolatedModules: true,
    rootDir: '',
  };
}

export function tsProgramFromFiles(files: string[]): ts.Program {
  // Build a program using the set of root file names in fileNames
  return ts.createProgram(files, compilerOptions());
}

export function parseTypes(root: string, program: ts.Program): Schema {
  // Get the checker, we will use it to find more about classes
  const checker = program.getTypeChecker();

  const result: Schema = {
    types: {},
    assertedTypes: [],
  };

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      // Walk the tree to search for classes
      try {
        ts.forEachChild(sourceFile, node =>
          visit(result, result.assertedTypes, checker, node, root)
        );
      } catch (e) {
        console.log(`Failed while processing ${sourceFile.fileName}.`);
        throw e;
      }
    }
  }

  // Sort assertedTypes.
  result.assertedTypes.sort();

  // Fill in kinds information (we do this now to be able to resolve types)
  visitAllTypes(result, type => {
    if (type.kind == 'union') {
      type.kinds = unionKinds(result, type.unionMembers);
    }
  });

  // Check consistency:
  // - All type uses must be defined (code throws an exception if not).
  visitAllTypes(result, type => {
    resolveType(result, type);
  });

  return result;
}

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: path => path,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

function reportDiagnostic(diagnostic: ts.Diagnostic) {
  // Too noisy.
  return;
  console.error(
    'Error',
    diagnostic.code,
    'in',
    diagnostic.file?.fileName,
    ':',
    ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      formatHost.getNewLine()
    )
  );
}

function arrayEquals(a: string[], b: string[]) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
}

// Watch a set of typescript files, and run callback whenever they change.
export function watchTsFiles(
  files: () => string[],
  callback: (program: ts.Program) => void
) {
  let currentFiles = files();

  // Note that there is another overload for `createWatchCompilerHost` that takes
  // a set of root files.
  const host = ts.createWatchCompilerHost(
    currentFiles,
    compilerOptions(),
    ts.sys,
    ts.createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    () => {}
  );

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const origPostProgramCreate = assertNonNull(host.afterProgramCreate);

  host.afterProgramCreate = program => {
    origPostProgramCreate(program);
    callback(program.getProgram());
  };

  // `createWatchProgram` creates an initial program, watches files, and updates
  // the program over time.
  const watcher = ts.createWatchProgram(host);

  // Re-scan the set of files every 10 seconds.
  setInterval(() => {
    const newFiles = files();
    if (!arrayEquals(newFiles, currentFiles)) {
      console.log(`List of TS files has changed, updating the watcher...`);
      watcher.updateRootFileNames(newFiles);
      currentFiles = newFiles;
    }
  }, 10000);
}
