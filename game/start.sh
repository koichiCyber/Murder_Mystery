#!/bin/sh
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js not found. Install the LTS version from https://nodejs.org"; exit 1; }
exec node launcher.js
