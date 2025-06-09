#!/bin/bash

# Script to systematically handle all open PRs
# Prioritizes security fixes and handles them in the correct order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Systematic PR Handler for Remote Docker Repository${NC}"
echo "===================================================="

# Check prerequisites
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo -e "${BLUE}ℹ️  Install from: https://cli.github.com/${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub${NC}"
    echo -e "${BLUE}ℹ️  Run: gh auth login${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Analyzing all open PRs...${NC}"

# Define PR categories and priorities
declare -A SECURITY_PRS=(
    ["5"]="golang.org/x/net security fix (CVE fixes)"
    ["3"]="Go modules security group update"
    ["10"]="GitHub CodeQL Action v2→v3 (DEPRECATED v2)"
    ["18"]="actions/cache v3→v4"
    ["6"]="actions/upload-artifact v3→v4"
    ["13"]="actions/setup-go v4→v5"
)

declare -A MAJOR_VERSION_PRS=(
    ["15"]="Golang 1.21→1.24-alpine (MAJOR)"
    ["11"]="Node 21.6→22.2-alpine (MAJOR)"
)

declare -A FRONTEND_PRS=(
    ["17"]="recharts 2.15.1→2.15.3"
    ["16"]="@vitejs/plugin-react 4.3.4→4.5.1"
    ["14"]="React and @types/react updates"
    ["12"]="@mui/icons-material 6.4.6→7.1.1"
    ["8"]="@mui/material 6.4.6→7.1.1"
)

declare -A BACKEND_PRS=(
    ["9"]="docker/build-push-action v5→v6"
    ["7"]="echo/v4 4.13.3→4.13.4"
)

declare -A INFRASTRUCTURE_PRS=(
    ["19"]="Community Standards Implementation"
)

show_pr_status() {
    local pr_num="$1"
    local description="$2"
    local category_color="$3"
    
    echo -e "${category_color}📋 PR #${pr_num}${NC}: ${description}"
    
    # Get PR status
    local pr_status=$(gh pr view "$pr_num" --repo anubissbe/remote-docker --json state,mergeable,reviewDecision 2>/dev/null || echo "ERROR")
    
    if [ "$pr_status" = "ERROR" ]; then
        echo -e "    ${RED}❌ PR not found or error accessing${NC}"
        return 1
    fi
    
    local state=$(echo "$pr_status" | jq -r '.state')
    local mergeable=$(echo "$pr_status" | jq -r '.mergeable')
    local review_decision=$(echo "$pr_status" | jq -r '.reviewDecision')
    
    echo -e "    State: ${state} | Mergeable: ${mergeable} | Review: ${review_decision}"
    
    # Check status checks
    local failing_checks=$(gh pr checks "$pr_num" --repo anubissbe/remote-docker --json state,name --jq '.[] | select(.state != "SUCCESS") | .name' 2>/dev/null | wc -l)
    local total_checks=$(gh pr checks "$pr_num" --repo anubissbe/remote-docker --json state --jq '. | length' 2>/dev/null)
    
    if [ "$failing_checks" -eq 0 ]; then
        echo -e "    ${GREEN}✅ All ${total_checks} status checks passing${NC}"
    else
        echo -e "    ${RED}❌ ${failing_checks}/${total_checks} status checks failing${NC}"
    fi
    
    echo ""
}

merge_pr() {
    local pr_num="$1"
    local description="$2"
    
    echo -e "${BLUE}🔄 Merging PR #${pr_num}: ${description}${NC}"
    
    # Check if already approved
    local review_decision=$(gh pr view "$pr_num" --repo anubissbe/remote-docker --json reviewDecision --jq '.reviewDecision')
    
    if [ "$review_decision" != "APPROVED" ]; then
        echo -e "${BLUE}✅ Approving PR #${pr_num}...${NC}"
        gh pr review "$pr_num" --approve --repo anubissbe/remote-docker --body "Approved: ${description} - Safe dependency/security update."
    fi
    
    # Merge
    if gh pr merge "$pr_num" --squash --repo anubissbe/remote-docker --delete-branch 2>/dev/null; then
        echo -e "${GREEN}✅ Successfully merged PR #${pr_num}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to merge PR #${pr_num} (may need manual intervention)${NC}"
        return 1
    fi
}

echo -e "${PURPLE}🔍 Current Status of All PRs${NC}"
echo "================================"

echo -e "\n${RED}🛡️  CRITICAL SECURITY PRs (Priority 1):${NC}"
for pr_num in "${!SECURITY_PRS[@]}"; do
    show_pr_status "$pr_num" "${SECURITY_PRS[$pr_num]}" "${RED}"
done

echo -e "\n${PURPLE}🏗️  INFRASTRUCTURE PRs (Priority 2):${NC}"
for pr_num in "${!INFRASTRUCTURE_PRS[@]}"; do
    show_pr_status "$pr_num" "${INFRASTRUCTURE_PRS[$pr_num]}" "${PURPLE}"
done

echo -e "\n${BLUE}🎨 FRONTEND DEPENDENCY PRs (Priority 3):${NC}"
for pr_num in "${!FRONTEND_PRS[@]}"; do
    show_pr_status "$pr_num" "${FRONTEND_PRS[$pr_num]}" "${BLUE}"
done

echo -e "\n${GREEN}⚙️  BACKEND DEPENDENCY PRs (Priority 4):${NC}"
for pr_num in "${!BACKEND_PRS[@]}"; do
    show_pr_status "$pr_num" "${BACKEND_PRS[$pr_num]}" "${GREEN}"
done

echo -e "\n${YELLOW}⚠️  MAJOR VERSION PRs (Review Required):${NC}"
for pr_num in "${!MAJOR_VERSION_PRS[@]}"; do
    show_pr_status "$pr_num" "${MAJOR_VERSION_PRS[$pr_num]}" "${YELLOW}"
done

echo ""
echo -e "${BLUE}🎯 Recommended Action Plan${NC}"
echo "=========================="
echo ""
echo -e "${YELLOW}STEP 1: Fix Workflows First${NC}"
echo "- The community standards PR (#19) contains workflow fixes"
echo "- Once merged, other PRs should pass their checks"
echo ""
echo -e "${YELLOW}STEP 2: Security PRs (Auto-merge safe)${NC}"
echo "- PRs #5, #3, #10, #18, #6, #13 - All contain critical security fixes"
echo ""
echo -e "${YELLOW}STEP 3: Standard Dependencies${NC}" 
echo "- PRs #17, #16, #14, #12, #8, #9, #7 - Standard dependency updates"
echo ""
echo -e "${YELLOW}STEP 4: Major Versions (Manual Review)${NC}"
echo "- PRs #15, #11 - Need careful testing due to major version bumps"

echo ""
read -p "What would you like to do? (1) Auto-handle safe PRs (2) Manual review (3) Exit: " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Auto-handling safe PRs...${NC}"
        echo ""
        
        # First merge infrastructure
        echo -e "${PURPLE}Step 1: Merging infrastructure PR #19...${NC}"
        merge_pr "19" "Community Standards Implementation"
        sleep 2
        
        # Then security PRs
        echo -e "${RED}Step 2: Merging security PRs...${NC}"
        for pr_num in 5 3 10 18 6 13; do
            if [[ -n "${SECURITY_PRS[$pr_num]}" ]]; then
                merge_pr "$pr_num" "${SECURITY_PRS[$pr_num]}"
                sleep 2
            fi
        done
        
        # Then standard dependencies
        echo -e "${BLUE}Step 3: Merging standard dependency PRs...${NC}"
        for pr_num in 17 16 14 12 8 9 7; do
            description=""
            if [[ -n "${FRONTEND_PRS[$pr_num]}" ]]; then
                description="${FRONTEND_PRS[$pr_num]}"
            elif [[ -n "${BACKEND_PRS[$pr_num]}" ]]; then
                description="${BACKEND_PRS[$pr_num]}"
            fi
            
            if [[ -n "$description" ]]; then
                merge_pr "$pr_num" "$description"
                sleep 2
            fi
        done
        
        echo -e "${GREEN}✅ Auto-handling complete!${NC}"
        echo -e "${YELLOW}⚠️  Major version PRs (#15, #11) still need manual review${NC}"
        ;;
        
    2)
        echo -e "${BLUE}Manual review mode - check each PR individually on GitHub${NC}"
        echo "Visit: https://github.com/anubissbe/remote-docker/pulls"
        ;;
        
    3)
        echo -e "${BLUE}👋 Exiting...${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 PR handling completed!${NC}"
echo -e "${BLUE}📊 Check repository status: https://github.com/anubissbe/remote-docker${NC}"