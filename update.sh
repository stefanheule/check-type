#!/bin/bash

echo "IMPORTANT: This script is not used, use yarn release instead"
exit 1

set -e

prefix="\e[1;34m[update.sh] "
suffix="\e[0m"

echo "${prefix}Building check-type locally...${suffix}"
yarn build

# update check-type on terra via ssh
echo -e "${prefix}Updating check-type on terra...${suffix}"
ssh terra NO_GITSTATUS=yes 'zsh -ic "cd ~/www/check-type && git pull && yarn install && yarn build"'

# run build in ../metro and ../purplemoon
for d in metro purplemoon call-schedule; do
  dir="../$d"
  if [ -d "$dir" ]; then
    echo "${prefix}Updating dependency for $d...${suffix}"
    (cd "$dir" && rm -rf node_modules client/node_modules server/node_modules && yarn install-all && yarn codegen)
    echo "${prefix}Updating dependency for $d on terra...${suffix}"
    ssh terra NO_GITSTATUS=yes "zsh -ic \"cd ~/www/$d-staging && rm -rf node_modules client/node_modules server/node_modules && yarn install-all\""
  else
    echo "${prefix}Project $d does not exist!!${suffix}"
  fi
done

echo "${prefix}Done${suffix}"
