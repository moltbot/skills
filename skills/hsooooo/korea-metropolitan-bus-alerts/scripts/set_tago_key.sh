#!/usr/bin/env bash
set -euo pipefail

# Interactive secret setter for TAGO_SERVICE_KEY.
#
# Usage:
#   ./set_tago_key.sh                 # writes ~/.clawdbot/secrets/tago.env
#   ./set_tago_key.sh /path/to/file   # writes given file
#
# It writes a simple env file:
#   TAGO_SERVICE_KEY=...
# with chmod 600.

ENV_FILE="${1:-$HOME/.clawdbot/secrets/tago.env}"
KEY_NAME="TAGO_SERVICE_KEY"

mkdir -p "$(dirname "$ENV_FILE")"

read -r -s -p "${KEY_NAME}: " KEY_VALUE
printf "\n"

if [[ -z "${KEY_VALUE}" ]]; then
  echo "Error: empty key" >&2
  exit 2
fi

TMP_FILE="${ENV_FILE}.tmp"
if [[ -f "$ENV_FILE" ]]; then
  grep -v "^${KEY_NAME}=" "$ENV_FILE" > "$TMP_FILE" || true
else
  : > "$TMP_FILE"
fi

echo "${KEY_NAME}=${KEY_VALUE}" >> "$TMP_FILE"

mv "$TMP_FILE" "$ENV_FILE"
chmod 600 "$ENV_FILE"
unset KEY_VALUE

echo "Saved ${KEY_NAME} to: ${ENV_FILE} (chmod 600)"
echo "Next steps:"
echo "- For one-off testing:  source ${ENV_FILE}"
echo "- For cron jobs (Gateway): add EnvironmentFile=${ENV_FILE} to your systemd user service override, then restart gateway."
