const { Client } = require('pg');

async function fixArtistDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'qhr96wmr',
    database: 'l8v2'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully');

    // First, let's see what the current structure looks like
    console.log('\n🔍 Checking current database structure...');
    const currentResult = await client.query('SELECT * FROM artists LIMIT 3');
    console.log('Current artist structure:', JSON.stringify(currentResult.rows[0], null, 2));

    // Step 1: Update all existing records to have the new structure
    console.log('\n🔄 Step 1: Updating existing records...');
    const updateResult = await client.query(`
      UPDATE artists 
      SET 
        "imageUrl" = COALESCE("imageUrl", "image", ''),
        "website" = COALESCE("website", "email", ''),
        "socialMedia" = COALESCE("socialMedia", '{}'),
        "rating" = COALESCE("rating", 0),
        "isActive" = COALESCE("isActive", true)
      WHERE "imageUrl" IS NULL 
         OR "website" IS NULL 
         OR "socialMedia" IS NULL 
         OR "rating" IS NULL 
         OR "isActive" IS NULL
    `);
    console.log(`✅ Updated ${updateResult.rowCount} records`);

    // Step 2: Drop old columns if they exist
    console.log('\n🗑️ Step 2: Removing old columns...');
    try {
      await client.query('ALTER TABLE artists DROP COLUMN IF EXISTS "email"');
      console.log('✅ Dropped "email" column');
    } catch (error) {
      console.log('⚠️ "email" column was already removed or never existed');
    }

    try {
      await client.query('ALTER TABLE artists DROP COLUMN IF EXISTS "phone"');
      console.log('✅ Dropped "phone" column');
    } catch (error) {
      console.log('⚠️ "phone" column was already removed or never existed');
    }

    try {
      await client.query('ALTER TABLE artists DROP COLUMN IF EXISTS "image"');
      console.log('✅ Dropped "image" column');
    } catch (error) {
      console.log('⚠️ "image" column was already removed or never existed');
    }

    try {
      await client.query('ALTER TABLE artists DROP COLUMN IF EXISTS "eventsCount"');
      console.log('✅ Dropped "eventsCount" column');
    } catch (error) {
      console.log('⚠️ "eventsCount" column was already removed or never existed');
    }

    // Step 3: Verify the fix
    console.log('\n🔍 Step 3: Verifying the fix...');
    const updatedResult = await client.query('SELECT * FROM artists LIMIT 3');
    console.log('Updated artist structure:', JSON.stringify(updatedResult.rows[0], null, 2));

    // Step 4: Check if all records now have the correct structure
    console.log('\n🔍 Step 4: Checking all records...');
    const checkResult = await client.query(`
      SELECT COUNT(*) as total,
             COUNT("imageUrl") as has_imageUrl,
             COUNT("website") as has_website,
             COUNT("socialMedia") as has_socialMedia,
             COUNT("rating") as has_rating,
             COUNT("isActive") as has_isActive
      FROM artists
    `);
    
    const stats = checkResult.rows[0];
    console.log('Database statistics:');
    console.log(`- Total artists: ${stats.total}`);
    console.log(`- Has imageUrl: ${stats.has_imageUrl}`);
    console.log(`- Has website: ${stats.has_website}`);
    console.log(`- Has socialMedia: ${stats.has_socialMedia}`);
    console.log(`- Has rating: ${stats.has_rating}`);
    console.log(`- Has isActive: ${stats.has_isActive}`);

    if (stats.total === stats.has_imageUrl && 
        stats.total === stats.has_website && 
        stats.total === stats.has_socialMedia && 
        stats.total === stats.has_rating && 
        stats.total === stats.has_isActive) {
      console.log('\n🎉 SUCCESS: All artist records now have the correct structure!');
    } else {
      console.log('\n⚠️ WARNING: Some records may still have issues');
    }

    console.log('\n✅ Database fix completed successfully!');
    console.log('🔄 Now restart your backend server and test the frontend');

  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

console.log('🚀 Starting database fix...');
fixArtistDatabase();
