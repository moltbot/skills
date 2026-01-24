#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_kaput.sh"

"$KAPUT" transfers list
