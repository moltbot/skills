#!/bin/bash
# Wrapper for ccsinfo CLI with server URL from environment

set -e

# Verify ccsinfo is installed
if ! command -v ccsinfo &> /dev/null; then
    echo "Error: ccsinfo is not installed. Run scripts/install.sh first."
    exit 1
fi

# Verify server URL is set
if [ -z "$CCSINFO_SERVER_URL" ]; then
    echo "Error: CCSINFO_SERVER_URL environment variable is not set."
    echo "Set it with: export CCSINFO_SERVER_URL=http://your-server:port"
    exit 1
fi

# Execute ccsinfo with all arguments passed through
exec ccsinfo "$@"
