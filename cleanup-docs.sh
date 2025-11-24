#!/bin/bash
# Documentation Cleanup Script
# Purpose: Archive outdated documentation files
# Date: 2025-11-22

echo "🧹 Starting documentation cleanup..."

# Create archive directory
ARCHIVE_DIR="docs/archive"
mkdir -p "$ARCHIVE_DIR"
echo "✅ Created archive directory: $ARCHIVE_DIR"

# Files to archive (outdated/redundant)
FILES_TO_ARCHIVE=(
    "ALTERNATIVE_CONFERENCE_DATA.md"
    "BOOKING_INTEGRATION_EXAMPLE.md"
    "CHANGELOG_MIDTRANS.md"
    "CONFERENCE_DATA_FIX.md"
    "DEBUGGING_MIDTRANS.md"
    "DEPLOYMENT_COMPLETE.md"
    "DEPLOYMENT_FIXES_SUMMARY.md"
    "FINAL_DEPLOYMENT_STATUS.md"
    "FIXES_AUTHORIZATION.md"
    "FIXES_COLUMN_NAMES.md"
    "FIXES_CORS.md"
    "FIXES_MIDTRANS_VALIDATION.md"
    "GOOGLE_MEET_INTEGRATION.md"
    "IMPLEMENTATION_SUMMARY.md"
    "MEETING_LINKS_SETUP.md"
    "MIGRATION_GUIDE_EDGE_FUNCTIONS.md"
    "QUICK_START_MIDTRANS.md"
    "README_MEETING_LINKS.md"
    "README_MIDTRANS.md"
    "SERVICE_ACCOUNT_FIX.md"
    "TIME_CALCULATION_FIX.md"
)

# Move files to archive
MOVED_COUNT=0
NOT_FOUND_COUNT=0

for file in "${FILES_TO_ARCHIVE[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "📦 Archived: $file"
        ((MOVED_COUNT++))
    else
        echo "⚠️  Not found: $file"
        ((NOT_FOUND_COUNT++))
    fi
done

echo ""
echo "📊 Summary:"
echo "   Archived: $MOVED_COUNT files"
echo "   Not found: $NOT_FOUND_COUNT files"

# Files kept in root (essential documentation)
echo ""
echo "✅ Essential docs kept in root:"
ESSENTIAL_DOCS=(
    "README.md"
    "MEETING_LINKS_DEPLOYMENT_FINAL.md"
    "MEETING_LINKS_POOL_SYSTEM.md"
    "MIDTRANS_INTEGRATION.md"
    "TROUBLESHOOTING.md"
    "run-migrations.md"
    "DEPLOYMENT_CHECKLIST.md"
)

for doc in "${ESSENTIAL_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "   ✓ $doc"
    else
        echo "   ✗ $doc (not found)"
    fi
done

echo ""
echo "🎉 Cleanup complete!"
echo "📁 Archived files are in: $ARCHIVE_DIR"
