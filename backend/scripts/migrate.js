#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';

import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom migration runner for SudoQMaestro
 * Since migrate-mongo has issues with ES modules, we implement our own
 */

// Migration tracking collection
const MIGRATION_COLLECTION = 'migrations';

/**
 * Get all migration files
 */
function getMigrationFiles() {
  const migrationDir = path.join(__dirname, '../migrations');
  
  if (!fs.existsSync(migrationDir)) {
    console.log('📁 Creating migrations directory...');
    fs.mkdirSync(migrationDir, { recursive: true });
    return [];
  }
  
  return fs.readdirSync(migrationDir)
    .filter(file => file.endsWith('.js'))
    .sort();
}

/**
 * Get applied migrations from database
 */
async function getAppliedMigrations() {
  try {
    const collection = mongoose.connection.db.collection(MIGRATION_COLLECTION);
    const migrations = await collection.find({}).toArray();
    return migrations.map(m => m.fileName);
  } catch (error) {
    console.log('📋 No migration history found, starting fresh');
    return [];
  }
}

/**
 * Record migration as applied
 */
async function recordMigration(fileName) {
  const collection = mongoose.connection.db.collection(MIGRATION_COLLECTION);
  await collection.insertOne({
    fileName,
    appliedAt: new Date()
  });
}

/**
 * Remove migration from applied list
 */
async function removeMigrationRecord(fileName) {
  const collection = mongoose.connection.db.collection(MIGRATION_COLLECTION);
  await collection.deleteOne({ fileName });
}

/**
 * Load and execute a migration file
 */
async function loadMigration(fileName) {
  const migrationPath = path.join(__dirname, '../migrations', fileName);
  
  // Since we're using ES modules but migrations are CommonJS, we need to use createRequire
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  
  return require(migrationPath);
}

/**
 * Run pending migrations
 */
async function runMigrations() {
  console.log('⬆️  Running migrations...');
  console.log(`📍 Connected to: ${config.mongodbUri}`);
  
  await mongoose.connect(config.mongodbUri);
  
  const allMigrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  const pendingMigrations = allMigrations.filter(file => !appliedMigrations.includes(file));
  
  if (pendingMigrations.length === 0) {
    console.log('✅ No pending migrations');
    return;
  }
  
  console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
  pendingMigrations.forEach(file => console.log(`   - ${file}`));
  console.log();
  
  for (const fileName of pendingMigrations) {
    try {
      console.log(`🔄 Applying migration: ${fileName}`);
      
      const migration = await loadMigration(fileName);
      
      if (typeof migration.up !== 'function') {
        throw new Error(`Migration ${fileName} does not export an 'up' function`);
      }
      
      await migration.up(mongoose.connection.db, mongoose.connection.getClient());
      await recordMigration(fileName);
      
      console.log(`✅ Applied migration: ${fileName}`);
    } catch (error) {
      console.error(`❌ Failed to apply migration ${fileName}:`, error.message);
      throw error;
    }
  }
  
  console.log(`\n🎉 Successfully applied ${pendingMigrations.length} migrations`);
}

/**
 * Rollback the last migration
 */
async function rollbackMigration() {
  console.log('⬇️  Rolling back last migration...');
  
  await mongoose.connect(config.mongodbUri);
  
  const appliedMigrations = await getAppliedMigrations();
  
  if (appliedMigrations.length === 0) {
    console.log('✅ No migrations to rollback');
    return;
  }
  
  // Get the most recently applied migration
  const allMigrations = getMigrationFiles();
  const lastAppliedMigration = appliedMigrations
    .filter(name => allMigrations.includes(name))
    .sort()
    .pop();
  
  if (!lastAppliedMigration) {
    console.log('❌ Could not find last applied migration file');
    return;
  }
  
  try {
    console.log(`🔄 Rolling back migration: ${lastAppliedMigration}`);
    
    const migration = await loadMigration(lastAppliedMigration);
    
    if (typeof migration.down !== 'function') {
      throw new Error(`Migration ${lastAppliedMigration} does not export a 'down' function`);
    }
    
    await migration.down(mongoose.connection.db, mongoose.connection.getClient());
    await removeMigrationRecord(lastAppliedMigration);
    
    console.log(`✅ Rolled back migration: ${lastAppliedMigration}`);
  } catch (error) {
    console.error(`❌ Failed to rollback migration ${lastAppliedMigration}:`, error.message);
    throw error;
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  console.log('📊 Migration Status');
  console.log('===================');
  
  await mongoose.connect(config.mongodbUri);
  
  const allMigrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  
  if (allMigrations.length === 0) {
    console.log('📋 No migrations found');
    return;
  }
  
  console.log('\n📋 Migration Files:');
  allMigrations.forEach(file => {
    const isApplied = appliedMigrations.includes(file);
    const status = isApplied ? '✅ Applied' : '⏳ Pending';
    console.log(`   ${status} ${file}`);
  });
  
  const pendingCount = allMigrations.filter(file => !appliedMigrations.includes(file)).length;
  console.log(`\n📊 Summary: ${allMigrations.length} total, ${appliedMigrations.length} applied, ${pendingCount} pending`);
}

/**
 * Create a new migration file
 */
async function createMigration(name) {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const fileName = `${timestamp}-${name.replace(/\s+/g, '-').toLowerCase()}.js`;
  const filePath = path.join(__dirname, '../migrations', fileName);
  
  const template = `module.exports = {
  async up(db, client) {
    console.log('Running migration: ${name}');
    
    // Add your migration logic here
    // Example:
    // await db.collection('users').updateMany({}, { $set: { newField: 'defaultValue' } });
    
    console.log('✅ Migration completed: ${name}');
  },

  async down(db, client) {
    console.log('Rolling back migration: ${name}');
    
    // Add your rollback logic here
    // Example:
    // await db.collection('users').updateMany({}, { $unset: { newField: "" } });
    
    console.log('✅ Rollback completed: ${name}');
  }
};`;

  // Ensure migrations directory exists
  const migrationDir = path.join(__dirname, '../migrations');
  if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, template);
  console.log(`✅ Created migration: ${fileName}`);
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;
      case 'down':
        await rollbackMigration();
        break;
      case 'status':
        await showStatus();
        break;
      case 'create':
        if (!arg) {
          console.error('❌ Please provide a migration name');
          console.error('   Usage: npm run migrate:create <migration-name>');
          process.exit(1);
        }
        await createMigration(arg);
        break;
      default:
        console.log('SudoQMaestro Migration Tool');
        console.log('Usage: npm run migrate:<command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  up           Run all pending migrations');
        console.log('  down         Rollback the last migration');
        console.log('  status       Show migration status');
        console.log('  create <name> Create a new migration file');
        console.log('');
        console.log('Examples:');
        console.log('  npm run migrate:up');
        console.log('  npm run migrate:down');
        console.log('  npm run migrate:status');
        console.log('  npm run migrate:create "add user preferences"');
        break;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runMigrations, rollbackMigration, showStatus, createMigration };
