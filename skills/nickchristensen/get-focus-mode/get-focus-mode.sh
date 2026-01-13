#!/bin/bash
# Get current macOS Focus mode from Do Not Disturb database

jq -s -r '
  # 1) Grab the latest-mode ID (or null if none)
  (.[0].data[0].storeAssertionRecords? // []
    | max_by(.assertionStartDateTimestamp)?
    | .assertionDetails.assertionDetailsModeIdentifier
  ) as $activeID

  # 2) If we got an ID, look it up; otherwise print "No Focus"
  | if $activeID then
      (.[1].data[0].modeConfigurations? // [])[]
      | select(.mode.modeIdentifier == $activeID)
      | .mode.name
    else
      "No Focus"
    end
' \
  ~/Library/DoNotDisturb/DB/Assertions.json \
  ~/Library/DoNotDisturb/DB/ModeConfigurations.json
