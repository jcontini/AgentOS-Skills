#!/bin/bash
# Merge driver for manifest.json - always regenerate instead of merging
# This script is called by git during merge conflicts on manifest.json

# Regenerate the manifest (this is the source of truth)
node scripts/generate-manifest.js

# Exit successfully - git will use the regenerated manifest.json
exit 0
