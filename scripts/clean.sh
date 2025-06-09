#!/bin/bash
# Clean script for remote-docker extension

set -e

# Colors for output
INFO_COLOR='\033[0;36m'
SUCCESS_COLOR='\033[0;32m'
WARNING_COLOR='\033[0;33m'
NO_COLOR='\033[m'

echo -e "${INFO_COLOR}Cleaning remote-docker build artifacts...${NO_COLOR}"

# Clean Go binaries
echo -e "${INFO_COLOR}Removing Go binaries...${NO_COLOR}"
rm -f server client ssh backend/main

# Clean UI build
echo -e "${INFO_COLOR}Removing UI build artifacts...${NO_COLOR}"
rm -rf ui/build ui/dist

# Clean node_modules if requested
if [ "$1" == "--deep" ]; then
    echo -e "${WARNING_COLOR}Deep clean requested - removing node_modules...${NO_COLOR}"
    rm -rf ui/node_modules
fi

# Clean logs
echo -e "${INFO_COLOR}Removing log files...${NO_COLOR}"
find . -name "*.log" -type f -delete

# Clean temporary files
echo -e "${INFO_COLOR}Removing temporary files...${NO_COLOR}"
find . -name "*.tmp" -o -name "*.temp" -type f -delete

echo -e "${SUCCESS_COLOR}Clean completed!${NO_COLOR}"

if [ "$1" != "--deep" ]; then
    echo -e "${INFO_COLOR}Run with --deep flag to also remove node_modules${NO_COLOR}"
fi