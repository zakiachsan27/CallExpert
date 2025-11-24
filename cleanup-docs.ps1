# Documentation Cleanup Script
# Purpose: Archive outdated documentation files
# Date: 2025-11-22

Write-Host "🧹 Starting documentation cleanup..." -ForegroundColor Cyan

# Create archive directory
$archiveDir = "docs/archive"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
    Write-Host "✅ Created archive directory: $archiveDir" -ForegroundColor Green
}

# Files to archive (outdated/redundant)
$filesToArchive = @(
    "ALTERNATIVE_CONFERENCE_DATA.md",
    "BOOKING_INTEGRATION_EXAMPLE.md",
    "CHANGELOG_MIDTRANS.md",
    "CONFERENCE_DATA_FIX.md",
    "DEBUGGING_MIDTRANS.md",
    "DEPLOYMENT_COMPLETE.md",
    "DEPLOYMENT_FIXES_SUMMARY.md",
    "FINAL_DEPLOYMENT_STATUS.md",
    "FIXES_AUTHORIZATION.md",
    "FIXES_COLUMN_NAMES.md",
    "FIXES_CORS.md",
    "FIXES_MIDTRANS_VALIDATION.md",
    "GOOGLE_MEET_INTEGRATION.md",
    "IMPLEMENTATION_SUMMARY.md",
    "MEETING_LINKS_SETUP.md",
    "MIGRATION_GUIDE_EDGE_FUNCTIONS.md",
    "QUICK_START_MIDTRANS.md",
    "README_MEETING_LINKS.md",
    "README_MIDTRANS.md",
    "SERVICE_ACCOUNT_FIX.md",
    "TIME_CALCULATION_FIX.md"
)

# Move files to archive
$movedCount = 0
$notFoundCount = 0

foreach ($file in $filesToArchive) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "$archiveDir/$file" -Force
        Write-Host "📦 Archived: $file" -ForegroundColor Yellow
        $movedCount++
    } else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor DarkGray
        $notFoundCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   Archived: $movedCount files" -ForegroundColor Green
Write-Host "   Not found: $notFoundCount files" -ForegroundColor Gray

# Files kept in root (essential documentation)
Write-Host "`n✅ Essential docs kept in root:" -ForegroundColor Green
$essentialDocs = @(
    "README.md",
    "MEETING_LINKS_DEPLOYMENT_FINAL.md",
    "MEETING_LINKS_POOL_SYSTEM.md",
    "MIDTRANS_INTEGRATION.md",
    "TROUBLESHOOTING.md",
    "run-migrations.md",
    "DEPLOYMENT_CHECKLIST.md"
)

foreach ($doc in $essentialDocs) {
    if (Test-Path $doc) {
        Write-Host "   ✓ $doc" -ForegroundColor White
    } else {
        Write-Host "   ✗ $doc (not found)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Cleanup complete!" -ForegroundColor Green
Write-Host "📁 Archived files are in: $archiveDir" -ForegroundColor Cyan
