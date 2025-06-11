#!/bin/bash
# Deploy script for remote-docker extension

set -e

# Colors for output
INFO_COLOR='\033[0;36m'
SUCCESS_COLOR='\033[0;32m'
ERROR_COLOR='\033[0;31m'
NO_COLOR='\033[m'

# Default values
IMAGE=${IMAGE:-"anubissbe/remote-docker"}
TAG=${TAG:-"0.1.0"}
BUILDER="buildx-multi-arch"

echo -e "${INFO_COLOR}Deploying remote-docker extension...${NO_COLOR}"
echo -e "${INFO_COLOR}Image: ${IMAGE}:${TAG}${NO_COLOR}"

# Check if tag already exists
if docker pull "${IMAGE}:${TAG}" 2>/dev/null; then
    echo -e "${ERROR_COLOR}Error: Tag ${TAG} already exists!${NO_COLOR}"
    echo "Use 'make push-extension-force-no-cache' to force push"
    exit 1
fi

# Prepare buildx
echo -e "${INFO_COLOR}Preparing buildx builder...${NO_COLOR}"
if ! docker buildx inspect "${BUILDER}" 2>/dev/null; then
    docker buildx create --name="${BUILDER}" --driver=docker-container --driver-opt=network=host
fi

# Build and push
echo -e "${INFO_COLOR}Building and pushing multi-arch image...${NO_COLOR}"
if docker buildx build --push --builder="${BUILDER}" --platform=linux/amd64,linux/arm64 --build-arg TAG="${TAG}" --tag="${IMAGE}:${TAG}" .; then
    echo -e "${SUCCESS_COLOR}Deploy completed successfully!${NO_COLOR}"
else
    echo -e "${ERROR_COLOR}Deploy failed!${NO_COLOR}"
    exit 1
fi