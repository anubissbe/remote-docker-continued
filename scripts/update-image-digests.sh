#!/bin/bash

# Script to update Dockerfile with specific image digests to avoid Docker Hub rate limits

set -e

echo "🔍 Fetching current image digests..."

# Function to get digest for an image
get_digest() {
    local image=$1
    echo "Getting digest for $image..."
    # Try to get the digest, fallback to original tag if it fails
    digest=$(docker manifest inspect "$image" 2>/dev/null | jq -r '.manifests[] | select(.platform.architecture=="amd64" and .platform.os=="linux") | .digest' 2>/dev/null || echo "")
    if [ -z "$digest" ]; then
        echo "⚠️  Could not get digest for $image, keeping original tag"
        echo "$image"
    else
        echo "✅ Found digest for $image: $digest"
        echo "$image@$digest"
    fi
}

# Current images used in Dockerfile
GOLANG_IMAGE="golang:1.24-alpine"
NODE_IMAGE="node:22.2-alpine3.18"
ALPINE_IMAGE="alpine:latest"

# Get digests (or fallback to tags)
GOLANG_WITH_DIGEST=$(get_digest "$GOLANG_IMAGE")
NODE_WITH_DIGEST=$(get_digest "$NODE_IMAGE")
ALPINE_WITH_DIGEST=$(get_digest "$ALPINE_IMAGE")

echo ""
echo "📝 Updating Dockerfile with digests..."

# Create a backup
cp Dockerfile Dockerfile.backup

# Update Dockerfile with digests
sed -i.tmp "s|FROM golang:1.24-alpine|FROM $GOLANG_WITH_DIGEST|g" Dockerfile
sed -i.tmp "s|FROM --platform=\$BUILDPLATFORM node:22.2-alpine3.18|FROM --platform=\$BUILDPLATFORM $NODE_WITH_DIGEST|g" Dockerfile
sed -i.tmp "s|FROM alpine:latest|FROM $ALPINE_WITH_DIGEST|g" Dockerfile

# Clean up temp file
rm -f Dockerfile.tmp

echo "✅ Dockerfile updated successfully!"
echo ""
echo "📋 Summary of changes:"
echo "  - golang:1.24-alpine → $GOLANG_WITH_DIGEST"
echo "  - node:22.2-alpine3.18 → $NODE_WITH_DIGEST" 
echo "  - alpine:latest → $ALPINE_WITH_DIGEST"
echo ""
echo "💡 To revert changes, run: mv Dockerfile.backup Dockerfile"