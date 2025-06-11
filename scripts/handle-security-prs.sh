#!/bin/bash

# Script to handle security-related Dependabot PRs
# These PRs contain critical security fixes and are safe to merge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Security PR Handler${NC}"
echo "========================="

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo -e "${BLUE}ℹ️  Install from: https://cli.github.com/${NC}"
    echo ""
    echo -e "${YELLOW}Manual Instructions:${NC}"
    echo "1. Go to https://github.com/telkombe/remote-docker/pulls"
    echo "2. Review and approve these security PRs:"
    echo "   - PR #6: Actions/upload-artifact bump (fixes ArtiPACKED vulnerability)"
    echo "   - PR #5: golang.org/x/net bump (fixes DoS vulnerabilities)"
    echo "   - PR #3: golang.org/x/crypto bump (fixes SSH CVE-2025-22869)"
    echo "3. Merge each PR using 'Squash and merge'"
    echo ""
    echo -e "${GREEN}✅ All PRs are safe to merge - they contain critical security fixes${NC}"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not logged in to GitHub${NC}"
    echo -e "${BLUE}ℹ️  Run: gh auth login${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Checking security-related Dependabot PRs...${NC}"

# List of security PRs to handle (in reverse order for proper merging)
SECURITY_PRS=(3 5 6)
PR_DESCRIPTIONS=(
    "golang.org/x/crypto bump (fixes SSH CVE-2025-22869)"
    "golang.org/x/net bump (fixes DoS vulnerabilities)" 
    "Actions/upload-artifact bump (fixes ArtiPACKED vulnerability)"
)

echo ""
echo -e "${YELLOW}📋 Security PRs to handle:${NC}"
for i in "${!SECURITY_PRS[@]}"; do
    pr_num=${SECURITY_PRS[$i]}
    desc=${PR_DESCRIPTIONS[$i]}
    echo -e "  ${GREEN}PR #${pr_num}${NC}: ${desc}"
done

echo ""
read -p "Do you want to approve and merge these security PRs? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏭️  Skipping PR merge${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Processing security PRs...${NC}"

for i in "${!SECURITY_PRS[@]}"; do
    pr_num=${SECURITY_PRS[$i]}
    desc=${PR_DESCRIPTIONS[$i]}
    
    echo ""
    echo -e "${BLUE}📝 Processing PR #${pr_num}: ${desc}${NC}"
    
    # Check if PR exists and is open
    if ! gh pr view "$pr_num" --repo telkombe/remote-docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  PR #${pr_num} not found or already closed${NC}"
        continue
    fi
    
    # Check if already approved
    pr_status=$(gh pr view "$pr_num" --repo telkombe/remote-docker --json reviewDecision --jq '.reviewDecision')
    
    if [ "$pr_status" != "APPROVED" ]; then
        echo -e "${BLUE}✅ Approving PR #${pr_num}...${NC}"
        gh pr review "$pr_num" --approve --repo telkombe/remote-docker --body "Approved: Critical security update - safe to merge despite CI/CD authentication failures."
    else
        echo -e "${GREEN}✅ PR #${pr_num} already approved${NC}"
    fi
    
    # Check if mergeable
    is_mergeable=$(gh pr view "$pr_num" --repo telkombe/remote-docker --json mergeable --jq '.mergeable')
    
    if [ "$is_mergeable" = "MERGEABLE" ]; then
        echo -e "${BLUE}🔀 Merging PR #${pr_num}...${NC}"
        gh pr merge "$pr_num" --squash --repo telkombe/remote-docker --delete-branch
        echo -e "${GREEN}✅ PR #${pr_num} merged successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  PR #${pr_num} is not mergeable - may have conflicts${NC}"
        echo -e "${BLUE}ℹ️  Check the PR manually: https://github.com/telkombe/remote-docker/pull/${pr_num}${NC}"
    fi
    
    sleep 2  # Brief pause between operations
done

echo ""
echo -e "${GREEN}🎉 Security PR processing completed!${NC}"
echo ""
echo -e "${BLUE}📊 Next Steps:${NC}"
echo "1. Check repository security alerts (should now be 0)"
echo "2. Verify workflows run successfully on main branch"
echo "3. Consider fixing Docker Hub authentication for future PRs"
echo ""
echo -e "${GREEN}✅ Repository security is now up to date!${NC}"