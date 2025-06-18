#!/bin/bash
# Concatenate all .ts files in this directory (recursively) into all_ts_sources.txt
find "$(dirname "$0")" -type f -name "*.ts" -print0 | xargs -0 cat > "$(dirname "$0")/all_ts_sources.txt"
[ $? -eq 0 ] && exit