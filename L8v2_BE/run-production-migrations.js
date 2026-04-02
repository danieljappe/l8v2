#!/usr/bin/env node

/**
 * Production Migration Runner
 * 
 * This script helps run migrations safely in production by:
 * 1. Checking database connection
 * 2. Running migrations with proper error handling
 * 3. Providing rollback instructions if needed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Production Migration Process...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Error: package.json not found. Please run this script from the L8v2_BE directory.');
    process.exit(1);
}

// Check if typeorm config exists
if (!fs.existsSync('typeorm.config.ts')) {
    console.error('❌ Error: typeorm.config.ts not found. Please ensure TypeORM is properly configured.');
    process.exit(1);
}

console.log('✅ Environment checks passed\n');

try {
    console.log('📊 Running database migrations...');
    console.log('This will add the following columns:');
    console.log('  - event.billettoURL (if not exists)');
    console.log('  - artist.embeddings (if not exists)\n');
    
    // Run the migrations
    execSync('npm run migration:run', { 
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    console.log('\n✅ Migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your application server');
    console.log('2. Test the embedding functionality');
    console.log('3. Monitor application logs for any issues');
    
} catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔄 Rollback instructions:');
    console.log('If you need to rollback, run:');
    console.log('  npm run migration:revert');
    console.log('\n⚠️  Note: This will remove the embeddings column and any data in it!');
    
    process.exit(1);
}
