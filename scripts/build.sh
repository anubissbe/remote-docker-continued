#!/bin/bash
# Build script for remote-docker extension

set -e

# Colors for output
INFO_COLOR='\033[0;36m'
SUCCESS_COLOR='\033[0;32m'
ERROR_COLOR='\033[0;31m'
NO_COLOR='\033[m'

# Default values
IMAGE=${IMAGE:-"telkombe/remote-docker"}
TAG=${TAG:-"0.1.0"}

echo -e "${INFO_COLOR}Building remote-docker extension...${NO_COLOR}"
echo -e "${INFO_COLOR}Image: ${IMAGE}:${TAG}${NO_COLOR}"

# Build the extension
if docker build --tag="${IMAGE}:${TAG}" .; then
    echo -e "${SUCCESS_COLOR}Build completed successfully!${NO_COLOR}"
else
    echo -e "${ERROR_COLOR}Build failed!${NO_COLOR}"
    exit 1
fi