import * as uuidBase from 'uuid';
import { capitalizeFirstLetter } from '../language';

// A ZIP code, e.g. 94040 or 99750-0077
export type PostalCode = string & { _PostalCode: unknown };

// An email in the standard email format.
export type Email = string & { _Email: unknown };

// A phone number, consisting of a '+' followed by any number, e.g.
// +12063217869.
export type PhoneNumber = string & { _PhoneNumber: unknown };

// A non-empty, trimmed string, with <= 100 characters.
export type TrimmedString = string & { _TrimmedString: unknown };

// ISO 8601 date, e.g. 2021-12-05
export type IsoDate = string & { _IsoDate: unknown };

// ISO 8601 timestamp, e.g. 2021-12-05T18:44:38Z
export type IsoDatetime = string & { _IsoDatetime: unknown };

// Social security number, in the format XXX-XX-XXXX
export type SocialSecurityNumber = string & { _SocialSecurityNumber: unknown };

// UUID, e.g. 8909ae68-a707-4bdf-890f-dbc97e49d80a
export type Uuid = string & { _Uuid: unknown };

export function uuid(): Uuid {
  return uuidBase.v4() as Uuid;
}

// A string representing a number, e.g. 1.3872674 (used to avoid precision-problems of number)
export type NumericString = string & { _NumericString: unknown };

// A string representing a dollar amount, e.g. 1.38 (same as NumericString, but at most two decimal digits)
export type DollarAmount = string & { _NumericString: unknown };

// A Temporal.PlainDateTime object's string representation
export type TemporalPlainDateTime = string & { _TemporalPlainDateTime: unknown };

// A Temporal.PlainDate object's string representation
export type TemporalPlainDate = string & { _TemporalPlainDate: unknown };

// A Temporal.PlainTime object's string representation
export type TemporalPlainTime = string & { _TemporalPlainTime: unknown };

// A Temporal.PlainYearMonth object's string representation
export type TemporalPlainYearMonth = string & { _TemporalPlainYearMonth: unknown };

// A Temporal.PlainMonthDay object's string representation
export type TemporalPlainMonthDay = string & { _TemporalPlainMonthDay: unknown };

// A Temporal.ZonedDateTime object's string representation
export type TemporalZonedDateTime = string & { _TemporalZonedDateTime: unknown };

export function formatEmail(email: string): TrimmedString {
  return email.trim().toLocaleLowerCase() as TrimmedString;
}

export function formatNamePart(part: string): TrimmedString {
  const formatPartPart = (part: string): string => {
    let result = capitalizeFirstLetter(part.trim());
    if (result.startsWith('Mc')) {
      result = `Mc${capitalizeFirstLetter(result.slice(2))}`;
    }
    if (result.startsWith('Mac')) {
      result = `Mac${capitalizeFirstLetter(result.slice(3))}`;
    }
    return result;
  };
  const separators = [' ', '-', `'`];
  let result = part.trim().toLocaleLowerCase();
  for (const separator of separators) {
    result = result
      .split(separator)
      .map(name => formatPartPart(name))
      .join(separator);
  }
  return result as TrimmedString;
}

let _COUNTRY_OPTIONS: Record<CountryCode, string> | undefined = undefined;
export function computeCountryOptions() {
  if (_COUNTRY_OPTIONS === undefined) {
    _COUNTRY_OPTIONS = {} as Record<CountryCode, string>;
    const sortedCountries = [...COUNTRIES];
    sortedCountries.sort((a, b) => a.name.localeCompare(b.name));
    for (const country of sortedCountries) {
      _COUNTRY_OPTIONS[country.code] = country.name;
    }
  }
  return _COUNTRY_OPTIONS;
}

let _STATE_OPTIONS: Record<UsState, string> | undefined = undefined;
export function computeStateOptions() {
  if (_STATE_OPTIONS === undefined) {
    _STATE_OPTIONS = {} as Record<UsState, string>;
    const sortedStates = [...US_STATES];
    sortedStates.sort((a, b) => a.name.localeCompare(b.name));
    for (const state of sortedStates) {
      _STATE_OPTIONS[state.code] = state.name;
    }
  }
  return _STATE_OPTIONS;
}

// USPS state abbreviations from
// https://en.wikipedia.org/wiki/List_of_U.S._state_and_territory_abbreviations
export type UsState = typeof US_STATES[number]['code'];
export const US_STATES = [
  { name: 'Alabama', code: 'AL' },
  { name: 'Alaska', code: 'AK' },
  { name: 'Arizona', code: 'AZ' },
  { name: 'Arkansas', code: 'AR' },
  { name: 'California', code: 'CA' },
  { name: 'Colorado', code: 'CO' },
  { name: 'Connecticut', code: 'CT' },
  { name: 'Delaware', code: 'DE' },
  { name: 'District of Columbia', code: 'DC' },
  { name: 'Florida', code: 'FL' },
  { name: 'Georgia', code: 'GA' },
  { name: 'Hawaii', code: 'HI' },
  { name: 'Idaho', code: 'ID' },
  { name: 'Illinois', code: 'IL' },
  { name: 'Indiana', code: 'IN' },
  { name: 'Iowa', code: 'IA' },
  { name: 'Kansas', code: 'KS' },
  { name: 'Kentucky', code: 'KY' },
  { name: 'Louisiana', code: 'LA' },
  { name: 'Maine', code: 'ME' },
  { name: 'Maryland', code: 'MD' },
  { name: 'Massachusetts', code: 'MA' },
  { name: 'Michigan', code: 'MI' },
  { name: 'Minnesota', code: 'MN' },
  { name: 'Mississippi', code: 'MS' },
  { name: 'Missouri', code: 'MO' },
  { name: 'Montana', code: 'MT' },
  { name: 'Nebraska', code: 'NE' },
  { name: 'Nevada', code: 'NV' },
  { name: 'New Hampshire', code: 'NH' },
  { name: 'New Jersey', code: 'NJ' },
  { name: 'New Mexico', code: 'NM' },
  { name: 'New York', code: 'NY' },
  { name: 'North Carolina', code: 'NC' },
  { name: 'North Dakota', code: 'ND' },
  { name: 'Ohio', code: 'OH' },
  { name: 'Oklahoma', code: 'OK' },
  { name: 'Oregon', code: 'OR' },
  { name: 'Pennsylvania', code: 'PA' },
  { name: 'Rhode Island', code: 'RI' },
  { name: 'South Carolina', code: 'SC' },
  { name: 'South Dakota', code: 'SD' },
  { name: 'Tennessee', code: 'TN' },
  { name: 'Texas', code: 'TX' },
  { name: 'Utah', code: 'UT' },
  { name: 'Vermont', code: 'VT' },
  { name: 'Virginia', code: 'VA' },
  { name: 'Washington', code: 'WA' },
  { name: 'West Virginia', code: 'WV' },
  { name: 'Wisconsin', code: 'WI' },
  { name: 'Wyoming', code: 'WY' },
  { name: 'American Samoa', code: 'AS' },
  { name: 'Guam', code: 'GU' },
  { name: 'Northern Mariana Islands', code: 'MP' },
  { name: 'Puerto Rico', code: 'PR' },
  { name: 'U.S. Virgin Islands', code: 'VI' },
] as const;

// https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
export const COUNTRIES = [
  { code: 'ABW', name: 'Aruba' },
  { code: 'AFG', name: 'Afghanistan' },
  { code: 'AGO', name: 'Angola' },
  { code: 'AIA', name: 'Anguilla' },
  { code: 'ALA', name: 'Åland Islands' },
  { code: 'ALB', name: 'Albania' },
  { code: 'AND', name: 'Andorra' },
  { code: 'ARE', name: 'United Arab Emirates' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'ARM', name: 'Armenia' },
  { code: 'ASM', name: 'American Samoa' },
  { code: 'ATA', name: 'Antarctica' },
  { code: 'ATF', name: 'French Southern Territories' },
  { code: 'ATG', name: 'Antigua and Barbuda' },
  { code: 'AUS', name: 'Australia' },
  { code: 'AUT', name: 'Austria' },
  { code: 'AZE', name: 'Azerbaijan' },
  { code: 'BDI', name: 'Burundi' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'BEN', name: 'Benin' },
  { code: 'BES', name: 'Bonaire, Sint Eustatius and Saba' },
  { code: 'BFA', name: 'Burkina Faso' },
  { code: 'BGD', name: 'Bangladesh' },
  { code: 'BGR', name: 'Bulgaria' },
  { code: 'BHR', name: 'Bahrain' },
  { code: 'BHS', name: 'Bahamas' },
  { code: 'BIH', name: 'Bosnia and Herzegovina' },
  { code: 'BLM', name: 'Saint Barthélemy' },
  { code: 'BLR', name: 'Belarus' },
  { code: 'BLZ', name: 'Belize' },
  { code: 'BMU', name: 'Bermuda' },
  { code: 'BOL', name: 'Bolivia (Plurinational State of)' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'BRB', name: 'Barbados' },
  { code: 'BRN', name: 'Brunei Darussalam' },
  { code: 'BTN', name: 'Bhutan' },
  { code: 'BVT', name: 'Bouvet Island' },
  { code: 'BWA', name: 'Botswana' },
  { code: 'CAF', name: 'Central African Republic' },
  { code: 'CAN', name: 'Canada' },
  { code: 'CCK', name: 'Cocos (Keeling) Islands' },
  { code: 'CHE', name: 'Switzerland' },
  { code: 'CHL', name: 'Chile' },
  { code: 'CHN', name: 'China' },
  { code: 'CIV', name: "Côte d'Ivoire" },
  { code: 'CMR', name: 'Cameroon' },
  { code: 'COD', name: 'Congo, Democratic Republic of the' },
  { code: 'COG', name: 'Congo' },
  { code: 'COK', name: 'Cook Islands' },
  { code: 'COL', name: 'Colombia' },
  { code: 'COM', name: 'Comoros' },
  { code: 'CPV', name: 'Cabo Verde' },
  { code: 'CRI', name: 'Costa Rica' },
  { code: 'CUB', name: 'Cuba' },
  { code: 'CUW', name: 'Curaçao' },
  { code: 'CXR', name: 'Christmas Island' },
  { code: 'CYM', name: 'Cayman Islands' },
  { code: 'CYP', name: 'Cyprus' },
  { code: 'CZE', name: 'Czechia' },
  { code: 'DEU', name: 'Germany' },
  { code: 'DJI', name: 'Djibouti' },
  { code: 'DMA', name: 'Dominica' },
  { code: 'DNK', name: 'Denmark' },
  { code: 'DOM', name: 'Dominican Republic' },
  { code: 'DZA', name: 'Algeria' },
  { code: 'ECU', name: 'Ecuador' },
  { code: 'EGY', name: 'Egypt' },
  { code: 'ERI', name: 'Eritrea' },
  { code: 'ESH', name: 'Western Sahara' },
  { code: 'ESP', name: 'Spain' },
  { code: 'EST', name: 'Estonia' },
  { code: 'ETH', name: 'Ethiopia' },
  { code: 'FIN', name: 'Finland' },
  { code: 'FJI', name: 'Fiji' },
  { code: 'FLK', name: 'Falkland Islands (Malvinas)' },
  { code: 'FRA', name: 'France' },
  { code: 'FRO', name: 'Faroe Islands' },
  { code: 'FSM', name: 'Micronesia (Federated States of)' },
  { code: 'GAB', name: 'Gabon' },
  { code: 'GBR', name: 'United Kingdom of Great Britain and Northern Ireland' },
  { code: 'GEO', name: 'Georgia' },
  { code: 'GGY', name: 'Guernsey' },
  { code: 'GHA', name: 'Ghana' },
  { code: 'GIB', name: 'Gibraltar' },
  { code: 'GIN', name: 'Guinea' },
  { code: 'GLP', name: 'Guadeloupe' },
  { code: 'GMB', name: 'Gambia' },
  { code: 'GNB', name: 'Guinea-Bissau' },
  { code: 'GNQ', name: 'Equatorial Guinea' },
  { code: 'GRC', name: 'Greece' },
  { code: 'GRD', name: 'Grenada' },
  { code: 'GRL', name: 'Greenland' },
  { code: 'GTM', name: 'Guatemala' },
  { code: 'GUF', name: 'French Guiana' },
  { code: 'GUM', name: 'Guam' },
  { code: 'GUY', name: 'Guyana' },
  { code: 'HKG', name: 'Hong Kong' },
  { code: 'HMD', name: 'Heard Island and McDonald Islands' },
  { code: 'HND', name: 'Honduras' },
  { code: 'HRV', name: 'Croatia' },
  { code: 'HTI', name: 'Haiti' },
  { code: 'HUN', name: 'Hungary' },
  { code: 'IDN', name: 'Indonesia' },
  { code: 'IMN', name: 'Isle of Man' },
  { code: 'IND', name: 'India' },
  { code: 'IOT', name: 'British Indian Ocean Territory' },
  { code: 'IRL', name: 'Ireland' },
  { code: 'IRN', name: 'Iran (Islamic Republic of)' },
  { code: 'IRQ', name: 'Iraq' },
  { code: 'ISL', name: 'Iceland' },
  { code: 'ISR', name: 'Israel' },
  { code: 'ITA', name: 'Italy' },
  { code: 'JAM', name: 'Jamaica' },
  { code: 'JEY', name: 'Jersey' },
  { code: 'JOR', name: 'Jordan' },
  { code: 'JPN', name: 'Japan' },
  { code: 'KAZ', name: 'Kazakhstan' },
  { code: 'KEN', name: 'Kenya' },
  { code: 'KGZ', name: 'Kyrgyzstan' },
  { code: 'KHM', name: 'Cambodia' },
  { code: 'KIR', name: 'Kiribati' },
  { code: 'KNA', name: 'Saint Kitts and Nevis' },
  { code: 'KOR', name: 'Korea, Republic of' },
  { code: 'KWT', name: 'Kuwait' },
  { code: 'LAO', name: "Lao People's Democratic Republic" },
  { code: 'LBN', name: 'Lebanon' },
  { code: 'LBR', name: 'Liberia' },
  { code: 'LBY', name: 'Libya' },
  { code: 'LCA', name: 'Saint Lucia' },
  { code: 'LIE', name: 'Liechtenstein' },
  { code: 'LKA', name: 'Sri Lanka' },
  { code: 'LSO', name: 'Lesotho' },
  { code: 'LTU', name: 'Lithuania' },
  { code: 'LUX', name: 'Luxembourg' },
  { code: 'LVA', name: 'Latvia' },
  { code: 'MAC', name: 'Macao' },
  { code: 'MAF', name: 'Saint Martin (French part)' },
  { code: 'MAR', name: 'Morocco' },
  { code: 'MCO', name: 'Monaco' },
  { code: 'MDA', name: 'Moldova, Republic of' },
  { code: 'MDG', name: 'Madagascar' },
  { code: 'MDV', name: 'Maldives' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'MHL', name: 'Marshall Islands' },
  { code: 'MKD', name: 'North Macedonia' },
  { code: 'MLI', name: 'Mali' },
  { code: 'MLT', name: 'Malta' },
  { code: 'MMR', name: 'Myanmar' },
  { code: 'MNE', name: 'Montenegro' },
  { code: 'MNG', name: 'Mongolia' },
  { code: 'MNP', name: 'Northern Mariana Islands' },
  { code: 'MOZ', name: 'Mozambique' },
  { code: 'MRT', name: 'Mauritania' },
  { code: 'MSR', name: 'Montserrat' },
  { code: 'MTQ', name: 'Martinique' },
  { code: 'MUS', name: 'Mauritius' },
  { code: 'MWI', name: 'Malawi' },
  { code: 'MYS', name: 'Malaysia' },
  { code: 'MYT', name: 'Mayotte' },
  { code: 'NAM', name: 'Namibia' },
  { code: 'NCL', name: 'New Caledonia' },
  { code: 'NER', name: 'Niger' },
  { code: 'NFK', name: 'Norfolk Island' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'NIC', name: 'Nicaragua' },
  { code: 'NIU', name: 'Niue' },
  { code: 'NLD', name: 'Netherlands' },
  { code: 'NOR', name: 'Norway' },
  { code: 'NPL', name: 'Nepal' },
  { code: 'NRU', name: 'Nauru' },
  { code: 'NZL', name: 'New Zealand' },
  { code: 'OMN', name: 'Oman' },
  { code: 'PAK', name: 'Pakistan' },
  { code: 'PAN', name: 'Panama' },
  { code: 'PCN', name: 'Pitcairn' },
  { code: 'PER', name: 'Peru' },
  { code: 'PHL', name: 'Philippines' },
  { code: 'PLW', name: 'Palau' },
  { code: 'PNG', name: 'Papua New Guinea' },
  { code: 'POL', name: 'Poland' },
  { code: 'PRI', name: 'Puerto Rico' },
  { code: 'PRK', name: "Korea (Democratic People's Republic of)" },
  { code: 'PRT', name: 'Portugal' },
  { code: 'PRY', name: 'Paraguay' },
  { code: 'PSE', name: 'Palestine, State of' },
  { code: 'PYF', name: 'French Polynesia' },
  { code: 'QAT', name: 'Qatar' },
  { code: 'REU', name: 'Réunion' },
  { code: 'ROU', name: 'Romania' },
  { code: 'RUS', name: 'Russian Federation' },
  { code: 'RWA', name: 'Rwanda' },
  { code: 'SAU', name: 'Saudi Arabia' },
  { code: 'SDN', name: 'Sudan' },
  { code: 'SEN', name: 'Senegal' },
  { code: 'SGP', name: 'Singapore' },
  { code: 'SGS', name: 'South Georgia and the South Sandwich Islands' },
  { code: 'SHN', name: 'Saint Helena, Ascension and Tristan da Cunha' },
  { code: 'SJM', name: 'Svalbard and Jan Mayen' },
  { code: 'SLB', name: 'Solomon Islands' },
  { code: 'SLE', name: 'Sierra Leone' },
  { code: 'SLV', name: 'El Salvador' },
  { code: 'SMR', name: 'San Marino' },
  { code: 'SOM', name: 'Somalia' },
  { code: 'SPM', name: 'Saint Pierre and Miquelon' },
  { code: 'SRB', name: 'Serbia' },
  { code: 'SSD', name: 'South Sudan' },
  { code: 'STP', name: 'Sao Tome and Principe' },
  { code: 'SUR', name: 'Suriname' },
  { code: 'SVK', name: 'Slovakia' },
  { code: 'SVN', name: 'Slovenia' },
  { code: 'SWE', name: 'Sweden' },
  { code: 'SWZ', name: 'Eswatini' },
  { code: 'SXM', name: 'Sint Maarten (Dutch part)' },
  { code: 'SYC', name: 'Seychelles' },
  { code: 'SYR', name: 'Syrian Arab Republic' },
  { code: 'TCA', name: 'Turks and Caicos Islands' },
  { code: 'TCD', name: 'Chad' },
  { code: 'TGO', name: 'Togo' },
  { code: 'THA', name: 'Thailand' },
  { code: 'TJK', name: 'Tajikistan' },
  { code: 'TKL', name: 'Tokelau' },
  { code: 'TKM', name: 'Turkmenistan' },
  { code: 'TLS', name: 'Timor-Leste' },
  { code: 'TON', name: 'Tonga' },
  { code: 'TTO', name: 'Trinidad and Tobago' },
  { code: 'TUN', name: 'Tunisia' },
  { code: 'TUR', name: 'Turkey' },
  { code: 'TUV', name: 'Tuvalu' },
  { code: 'TWN', name: 'Taiwan, Province of China' },
  { code: 'TZA', name: 'Tanzania, United Republic of' },
  { code: 'UGA', name: 'Uganda' },
  { code: 'UKR', name: 'Ukraine' },
  { code: 'UMI', name: 'United States Minor Outlying Islands' },
  { code: 'URY', name: 'Uruguay' },
  { code: 'USA', name: 'United States of America' },
  { code: 'UZB', name: 'Uzbekistan' },
  { code: 'VAT', name: 'Holy See' },
  { code: 'VCT', name: 'Saint Vincent and the Grenadines' },
  { code: 'VEN', name: 'Venezuela (Bolivarian Republic of)' },
  { code: 'VGB', name: 'Virgin Islands (British)' },
  { code: 'VIR', name: 'Virgin Islands (U.S.)' },
  { code: 'VNM', name: 'Viet Nam' },
  { code: 'VUT', name: 'Vanuatu' },
  { code: 'WLF', name: 'Wallis and Futuna' },
  { code: 'WSM', name: 'Samoa' },
  { code: 'YEM', name: 'Yemen' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'ZMB', name: 'Zambia' },
  { code: 'ZWE', name: 'Zimbabwe' },
] as const;

// ISO 3166-1 alpha-3 three letter country code, e.g. USA.
export type CountryCode = typeof COUNTRIES[number]['code'];

export const THREE_LETTER_TO_TWO_LETTER_COUNTRY_CODE = {
  AFG: 'AF',
  ALB: 'AL',
  DZA: 'DZ',
  ASM: 'AS',
  AND: 'AD',
  AGO: 'AO',
  AIA: 'AI',
  ATA: 'AQ',
  ATG: 'AG',
  ARG: 'AR',
  ARM: 'AM',
  ABW: 'AW',
  AUS: 'AU',
  AUT: 'AT',
  AZE: 'AZ',
  BHS: 'BS',
  BHR: 'BH',
  BGD: 'BD',
  BRB: 'BB',
  BLR: 'BY',
  BEL: 'BE',
  BLZ: 'BZ',
  BEN: 'BJ',
  BMU: 'BM',
  BTN: 'BT',
  BOL: 'BO',
  BES: 'BQ',
  BIH: 'BA',
  BWA: 'BW',
  BVT: 'BV',
  BRA: 'BR',
  IOT: 'IO',
  BRN: 'BN',
  BGR: 'BG',
  BFA: 'BF',
  BDI: 'BI',
  CPV: 'CV',
  KHM: 'KH',
  CMR: 'CM',
  CAN: 'CA',
  CYM: 'KY',
  CAF: 'CF',
  TCD: 'TD',
  CHL: 'CL',
  CHN: 'CN',
  CXR: 'CX',
  CCK: 'CC',
  COL: 'CO',
  COM: 'KM',
  COD: 'CD',
  COG: 'CG',
  COK: 'CK',
  CRI: 'CR',
  HRV: 'HR',
  CUB: 'CU',
  CUW: 'CW',
  CYP: 'CY',
  CZE: 'CZ',
  CIV: 'CI',
  DNK: 'DK',
  DJI: 'DJ',
  DMA: 'DM',
  DOM: 'DO',
  ECU: 'EC',
  EGY: 'EG',
  SLV: 'SV',
  GNQ: 'GQ',
  ERI: 'ER',
  EST: 'EE',
  SWZ: 'SZ',
  ETH: 'ET',
  FLK: 'FK',
  FRO: 'FO',
  FJI: 'FJ',
  FIN: 'FI',
  FRA: 'FR',
  GUF: 'GF',
  PYF: 'PF',
  ATF: 'TF',
  GAB: 'GA',
  GMB: 'GM',
  GEO: 'GE',
  DEU: 'DE',
  GHA: 'GH',
  GIB: 'GI',
  GRC: 'GR',
  GRL: 'GL',
  GRD: 'GD',
  GLP: 'GP',
  GUM: 'GU',
  GTM: 'GT',
  GGY: 'GG',
  GIN: 'GN',
  GNB: 'GW',
  GUY: 'GY',
  HTI: 'HT',
  HMD: 'HM',
  VAT: 'VA',
  HND: 'HN',
  HKG: 'HK',
  HUN: 'HU',
  ISL: 'IS',
  IND: 'IN',
  IDN: 'ID',
  IRN: 'IR',
  IRQ: 'IQ',
  IRL: 'IE',
  IMN: 'IM',
  ISR: 'IL',
  ITA: 'IT',
  JAM: 'JM',
  JPN: 'JP',
  JEY: 'JE',
  JOR: 'JO',
  KAZ: 'KZ',
  KEN: 'KE',
  KIR: 'KI',
  PRK: 'KP',
  KOR: 'KR',
  KWT: 'KW',
  KGZ: 'KG',
  LAO: 'LA',
  LVA: 'LV',
  LBN: 'LB',
  LSO: 'LS',
  LBR: 'LR',
  LBY: 'LY',
  LIE: 'LI',
  LTU: 'LT',
  LUX: 'LU',
  MAC: 'MO',
  MDG: 'MG',
  MWI: 'MW',
  MYS: 'MY',
  MDV: 'MV',
  MLI: 'ML',
  MLT: 'MT',
  MHL: 'MH',
  MTQ: 'MQ',
  MRT: 'MR',
  MUS: 'MU',
  MYT: 'YT',
  MEX: 'MX',
  FSM: 'FM',
  MDA: 'MD',
  MCO: 'MC',
  MNG: 'MN',
  MNE: 'ME',
  MSR: 'MS',
  MAR: 'MA',
  MOZ: 'MZ',
  MMR: 'MM',
  NAM: 'NA',
  NRU: 'NR',
  NPL: 'NP',
  NLD: 'NL',
  NCL: 'NC',
  NZL: 'NZ',
  NIC: 'NI',
  NER: 'NE',
  NGA: 'NG',
  NIU: 'NU',
  NFK: 'NF',
  MNP: 'MP',
  NOR: 'NO',
  OMN: 'OM',
  PAK: 'PK',
  PLW: 'PW',
  PSE: 'PS',
  PAN: 'PA',
  PNG: 'PG',
  PRY: 'PY',
  PER: 'PE',
  PHL: 'PH',
  PCN: 'PN',
  POL: 'PL',
  PRT: 'PT',
  PRI: 'PR',
  QAT: 'QA',
  MKD: 'MK',
  ROU: 'RO',
  RUS: 'RU',
  RWA: 'RW',
  REU: 'RE',
  BLM: 'BL',
  SHN: 'SH',
  KNA: 'KN',
  LCA: 'LC',
  MAF: 'MF',
  SPM: 'PM',
  VCT: 'VC',
  WSM: 'WS',
  SMR: 'SM',
  STP: 'ST',
  SAU: 'SA',
  SEN: 'SN',
  SRB: 'RS',
  SYC: 'SC',
  SLE: 'SL',
  SGP: 'SG',
  SXM: 'SX',
  SVK: 'SK',
  SVN: 'SI',
  SLB: 'SB',
  SOM: 'SO',
  ZAF: 'ZA',
  SGS: 'GS',
  SSD: 'SS',
  ESP: 'ES',
  LKA: 'LK',
  SDN: 'SD',
  SUR: 'SR',
  SJM: 'SJ',
  SWE: 'SE',
  CHE: 'CH',
  SYR: 'SY',
  TWN: 'TW',
  TJK: 'TJ',
  TZA: 'TZ',
  THA: 'TH',
  TLS: 'TL',
  TGO: 'TG',
  TKL: 'TK',
  TON: 'TO',
  TTO: 'TT',
  TUN: 'TN',
  TUR: 'TR',
  TKM: 'TM',
  TCA: 'TC',
  TUV: 'TV',
  UGA: 'UG',
  UKR: 'UA',
  ARE: 'AE',
  GBR: 'GB',
  UMI: 'UM',
  USA: 'US',
  URY: 'UY',
  UZB: 'UZ',
  VUT: 'VU',
  VEN: 'VE',
  VNM: 'VN',
  VGB: 'VG',
  VIR: 'VI',
  WLF: 'WF',
  ESH: 'EH',
  YEM: 'YE',
  ZMB: 'ZM',
  ZWE: 'ZW',
  ALA: 'AX',
} as const;

// Parses a range, which is of the following shape (numbers can be anything):
// - below20K
// - from20Kto50K
// - above50K
// We use these to express ranges like `HouseholdIncome`.
export function parseRange(range: string): { min: number; max?: number } {
  const below = range.match(/^below([0-9]+)K$/);
  if (below) return { min: 0, max: parseInt(below[1]) };
  const from = range.match(/^from([0-9]+)Kto([0-9]+)K$/);
  if (from)
    return { min: parseInt(from[1]) * 1000, max: parseInt(from[2]) * 1000 };
  const above = range.match(/^above([0-9]+)K$/);
  if (above) return { min: parseInt(above[1]) * 1000 };
  throw new Error(`Cannot parse ${range}`);
}
