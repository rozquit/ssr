#!/bin/bash

sh etc/scripts/config.sh

set -a [ -f ./.env ] && . ./.env && set +

echo "${PAD} CLINIC DOCTOR ${PAD}"

clinic doctor --autocannon [ -c 10 ./ ] -- node "index.js"
