# Database backup script for L8v2 production (Windows PowerShell)
# Usage: .\backup-db.ps1 [backup_type]

param(
    [Parameter(Position=0)]
    [ValidateSet("full", "data", "schema")]
    [string]$BackupType = "full"
)

# Configuration
$DB_HOST = $env:DB_HOST ?? "localhost"
$DB_PORT = $env:DB_PORT ?? "5432"
$DB_USER = $env:DB_USER ?? "postgres"
$DB_NAME = $env:DB_NAME ?? "l8v2"
$BACKUP_DIR = ".\backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"

# Create backup directory if it doesn't exist
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Set backup filename and options
switch ($BackupType) {
    "full" {
        $BACKUP_FILE = "$BACKUP_DIR\l8v2_full_backup_$DATE.sql"
        $BACKUP_OPTIONS = "--clean --create --if-exists"
    }
    "data" {
        $BACKUP_FILE = "$BACKUP_DIR\l8v2_data_backup_$DATE.sql"
        $BACKUP_OPTIONS = "--data-only"
    }
    "schema" {
        $BACKUP_FILE = "$BACKUP_DIR\l8v2_schema_backup_$DATE.sql"
        $BACKUP_OPTIONS = "--schema-only"
    }
}

Write-Host "Starting $BackupType backup..." -ForegroundColor Green
Write-Host "Database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Backup file: $BACKUP_FILE" -ForegroundColor Yellow

# Set environment variable for password
$env:PGPASSWORD = $env:DB_PASSWORD

# Perform the backup
try {
    $pgDumpArgs = @(
        "-h", $DB_HOST,
        "-p", $DB_PORT,
        "-U", $DB_USER,
        "-d", $DB_NAME,
        "--verbose",
        "--no-password",
        "--file", $BACKUP_FILE
    )
    
    # Add backup options
    $pgDumpArgs += $BACKUP_OPTIONS.Split(" ")
    
    & pg_dump @pgDumpArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        
        # Get file size
        $fileSize = (Get-Item $BACKUP_FILE).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Host "File size: $fileSizeMB MB" -ForegroundColor Yellow
        
        # Compress the backup (requires 7-Zip or similar)
        if (Get-Command "7z" -ErrorAction SilentlyContinue) {
            & 7z a -tgzip "$BACKUP_FILE.gz" $BACKUP_FILE
            Remove-Item $BACKUP_FILE
            Write-Host "Compressed backup: $BACKUP_FILE.gz" -ForegroundColor Yellow
        } else {
            Write-Host "7-Zip not found. Backup file not compressed." -ForegroundColor Yellow
        }
        
        # Clean up old backups (keep last 7 days)
        $cutoffDate = (Get-Date).AddDays(-7)
        Get-ChildItem $BACKUP_DIR -Filter "*.gz" | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item
        
        Write-Host "Cleaned up backups older than 7 days" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ Backup failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Backup failed with error: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
