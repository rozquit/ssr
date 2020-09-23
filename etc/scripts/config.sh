#!/bin/bash

set -a [ -f ./.env ] && . ./.env && set +

CONFIG=${CONFIG}/index.js

rm ${CONFIG}

echo "${PAD} CREATE JS CONFIG ${PAD}"

awk -F= -v q="'" -v z='' -v d=' = ' -v t='exports.' '
/^[A-Z]/{
gsub(/'\''|'\"'/,"", $2);
printf t $1 d;
printf length($2) ? tolower($2) ~ /true|false|null|^[0-9]*$/ ? tolower($2) : q $2 q : "null";
print z;}' .env >"${CONFIG}"

#cat "${CONFIG}"
