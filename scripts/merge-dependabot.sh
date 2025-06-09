#!/bin/bash

# Script to handle Dependabot PRs
# This script helps review and merge Dependabot pull requests safely

set -e

echo "🔍 Checking Dependabot PRs..."

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    echo "Visit: https://cli.github.com/"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub. Please run 'gh auth login' first."
    exit 1
fi

echo "📋 Fetching open Dependabot PRs..."

# List all open Dependabot PRs
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --json number,title,headRefName --jq '.[]')

if [ -z "$DEPENDABOT_PRS" ]; then
    echo "✅ No open Dependabot PRs found."
    exit 0
fi

echo "🔍 Found Dependabot PRs:"
echo "$DEPENDABOT_PRS" | jq -r '.number + ": " + .title'

echo ""
echo "🛠️  Options:"
echo "1. Review each PR individually"
echo "2. Auto-merge all passing PRs" 
echo "3. Close all PRs (if you want to handle updates manually)"
echo "4. Exit"

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        echo "📝 Opening PR review interface..."
        echo "$DEPENDABOT_PRS" | jq -r '.number' | while read pr_number; do
            echo "🔍 Reviewing PR #$pr_number"
            gh pr view "$pr_number"
            echo ""
            read -p "Action for PR #$pr_number (merge/close/skip): " action
            
            case $action in
                merge)
                    echo "✅ Merging PR #$pr_number..."
                    gh pr merge "$pr_number" --squash --delete-branch
                    ;;
                close)
                    echo "❌ Closing PR #$pr_number..."
                    gh pr close "$pr_number"
                    ;;
                skip)
                    echo "⏭️  Skipping PR #$pr_number"
                    ;;
                *)
                    echo "⚠️  Invalid action, skipping PR #$pr_number"
                    ;;
            esac
            echo ""
        done
        ;;
    2)
        echo "🚀 Auto-merging all passing PRs..."
        echo "$DEPENDABOT_PRS" | jq -r '.number' | while read pr_number; do
            echo "🔍 Checking PR #$pr_number status..."
            
            # Check if PR has passing checks
            pr_status=$(gh pr checks "$pr_number" --json state --jq '.[] | select(.state != "SUCCESS") | .state' | wc -l)
            
            if [ "$pr_status" -eq 0 ]; then
                echo "✅ PR #$pr_number has passing checks, merging..."
                gh pr merge "$pr_number" --squash --delete-branch
            else
                echo "❌ PR #$pr_number has failing checks, skipping..."
            fi
        done
        ;;
    3)
        echo "❌ Closing all Dependabot PRs..."
        echo "$DEPENDABOT_PRS" | jq -r '.number' | while read pr_number; do
            gh pr close "$pr_number"
            echo "❌ Closed PR #$pr_number"
        done
        ;;
    4)
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo "✅ Done!"