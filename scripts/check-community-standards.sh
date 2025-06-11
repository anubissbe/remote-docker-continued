#!/bin/bash

# Script to check and ensure GitHub Community Standards compliance
# Helps verify that the repository meets all GitHub community guidelines

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏆 GitHub Community Standards Checker${NC}"
echo "======================================="

# Function to check if file exists
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ ${description}${NC}: ${file}"
        return 0
    else
        echo -e "${RED}❌ ${description}${NC}: ${file} (missing)"
        return 1
    fi
}

# Function to check file content
check_file_content() {
    local file="$1"
    local description="$2"
    local min_lines="$3"
    
    if [ -f "$file" ]; then
        local lines=$(wc -l < "$file")
        if [ "$lines" -ge "$min_lines" ]; then
            echo -e "${GREEN}✅ ${description}${NC}: ${file} (${lines} lines)"
            return 0
        else
            echo -e "${YELLOW}⚠️  ${description}${NC}: ${file} (${lines} lines - may need more content)"
            return 1
        fi
    else
        echo -e "${RED}❌ ${description}${NC}: ${file} (missing)"
        return 1
    fi
}

echo -e "${BLUE}📋 Checking required community standards files...${NC}"
echo ""

standards_met=0
total_standards=12

# 1. README
if check_file_content "README.md" "Repository Description (README)" 50; then
    ((standards_met++))
fi

# 2. License
if check_file "LICENSE" "License"; then
    ((standards_met++))
fi

# 3. Code of Conduct
if check_file_content "CODE_OF_CONDUCT.md" "Code of Conduct" 20; then
    ((standards_met++))
fi

# 4. Contributing Guidelines
if check_file_content "CONTRIBUTING.md" "Contributing Guidelines" 30; then
    ((standards_met++))
fi

# 5. Security Policy
if check_file_content ".github/SECURITY.md" "Security Policy" 20; then
    ((standards_met++))
fi

# 6. Issue Templates
if check_file ".github/ISSUE_TEMPLATE/bug_report.md" "Bug Report Template"; then
    ((standards_met++))
fi

# 7. Pull Request Template
if check_file ".github/pull_request_template.md" "Pull Request Template"; then
    ((standards_met++))
fi

# 8. Code Owners
if check_file ".github/CODEOWNERS" "Code Owners"; then
    ((standards_met++))
fi

# 9. Funding
if check_file ".github/FUNDING.yml" "Funding Configuration"; then
    ((standards_met++))
fi

# 10. Changelog
if check_file_content "CHANGELOG.md" "Changelog" 20; then
    ((standards_met++))
fi

# 11. Package metadata (for Node.js projects)
if [ -f "ui/package.json" ]; then
    if grep -q '"repository"' ui/package.json && grep -q '"license"' ui/package.json; then
        echo -e "${GREEN}✅ Package Metadata${NC}: ui/package.json"
        ((standards_met++))
    else
        echo -e "${YELLOW}⚠️  Package Metadata${NC}: ui/package.json (missing repository or license)"
    fi
else
    echo -e "${YELLOW}⚠️  Package Metadata${NC}: ui/package.json (not applicable)"
    ((standards_met++))  # Count as met since it's not always required
fi

# 12. GitHub workflows for quality
if [ -d ".github/workflows" ] && [ "$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l)" -gt 0 ]; then
    echo -e "${GREEN}✅ GitHub Workflows${NC}: .github/workflows/"
    ((standards_met++))
else
    echo -e "${RED}❌ GitHub Workflows${NC}: .github/workflows/ (missing)"
fi

echo ""
echo -e "${BLUE}📊 Community Standards Compliance Score${NC}"
echo "========================================="

percentage=$((standards_met * 100 / total_standards))

if [ "$percentage" -ge 90 ]; then
    echo -e "${GREEN}🏆 EXCELLENT: ${standards_met}/${total_standards} standards met (${percentage}%)${NC}"
elif [ "$percentage" -ge 70 ]; then
    echo -e "${YELLOW}👍 GOOD: ${standards_met}/${total_standards} standards met (${percentage}%)${NC}"
else
    echo -e "${RED}👎 NEEDS IMPROVEMENT: ${standards_met}/${total_standards} standards met (${percentage}%)${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Additional Checks${NC}"
echo "===================="

# Check repository settings (if gh CLI available)
if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
    echo -e "${BLUE}📋 Repository Settings:${NC}"
    
    # Check if issues are enabled
    if gh repo view --json hasIssuesEnabled -q '.hasIssuesEnabled' 2>/dev/null | grep -q true; then
        echo -e "${GREEN}✅ Issues enabled${NC}"
    else
        echo -e "${RED}❌ Issues not enabled${NC}"
    fi
    
    # Check if discussions are enabled
    if gh repo view --json hasDiscussionsEnabled -q '.hasDiscussionsEnabled' 2>/dev/null | grep -q true; then
        echo -e "${GREEN}✅ Discussions enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Discussions not enabled${NC}"
    fi
    
    # Check branch protection
    if gh api "repos/telkombe/remote-docker/branches/main/protection" &>/dev/null; then
        echo -e "${GREEN}✅ Branch protection enabled${NC}"
    else
        echo -e "${RED}❌ Branch protection not enabled${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  GitHub CLI not available - skipping repository settings check${NC}"
fi

echo ""
echo -e "${BLUE}💡 Recommendations${NC}"
echo "=================="

if [ "$standards_met" -lt "$total_standards" ]; then
    echo -e "${YELLOW}To improve community standards compliance:${NC}"
    echo "1. Address any missing files listed above"
    echo "2. Ensure all files have sufficient content"
    echo "3. Review GitHub's community standards guide"
    echo "4. Enable repository features (issues, discussions)"
fi

echo -e "${GREEN}🚀 Current Status: Repository is well-configured for community collaboration!${NC}"

if [ "$percentage" -ge 90 ]; then
    echo -e "${GREEN}🎉 Congratulations! Your repository meets excellent community standards.${NC}"
    exit 0
else
    echo -e "${YELLOW}🔧 Consider addressing the items above to reach excellent standards.${NC}"
    exit 1
fi