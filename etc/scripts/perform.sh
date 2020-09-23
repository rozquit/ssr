#!/bin/bash

URL=${1}

set -a [ -f ./.env ] && . ./.env && set +

URI="http://${HOST}:${PORT}/${URL}"

autocannon -c 10 "${URI}"
