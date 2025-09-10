#!/usr/bin/env node

import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Puzzle from '../models/puzzle.model.js';
import { generateSudoku } from '../services/sudoku.service.js';
import config from '../config/env.js';

/**
 * Database seeding script for development
 * Seeds the database with sample users and puzzles
 */

const seedData = {
  users: [
    {
      googleId: 'dev-user-1',
      displayName: 'John Developer',
      email: 'john.dev@example.com',
      role: 'user'
    },
    {
      googleId: 'dev-admin-1',
      displayName: 'Admin User',
      email: 'admin.dev@example.com',
      role: 'admin'
    },
    {
      googleId: 'dev-user-2',
      displayName: 'Jane Tester',
      email: 'jane.test@example.com',
      role: 'user'
    }
  ]
};

/**
 * Clear all data from the database
 */
async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  await User.deleteMany({});
  await Puzzle.deleteMany({});
  console.log('✅ Database cleared');
}

/**
 * Seed users into the database
 */
async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const createdUsers = [];
  for (const userData of seedData.users) {
    try {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`   ✓ Created user: ${savedUser.displayName} (${savedUser.email})`);
    } catch (error) {
      console.error(`   ✗ Failed to create user ${userData.email}:`, error.message);
    }
  }
  
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

/**
 * Seed puzzles into the database
 */
async function seedPuzzles(users) {
  console.log('🧩 Seeding puzzles...');
  
  const difficulties = ['easy', 'medium', 'hard'];
  const createdPuzzles = [];
  
  for (const user of users) {
    for (const difficulty of difficulties) {
      try {
        // Generate multiple puzzles per difficulty per user
        for (let i = 0; i < 2; i++) {
          const { puzzle, solution } = generateSudoku(difficulty);
          
          const puzzleDoc = new Puzzle({
            user: user._id,
            puzzleGrid: puzzle,
            solutionGrid: solution,
            difficulty: difficulty
          });
          
          const savedPuzzle = await puzzleDoc.save();
          createdPuzzles.push(savedPuzzle);
          console.log(`   ✓ Created ${difficulty} puzzle for ${user.displayName}`);
        }
      } catch (error) {
        console.error(`   ✗ Failed to create puzzle for ${user.displayName}:`, error.message);
      }
    }
  }
  
  console.log(`✅ Created ${createdPuzzles.length} puzzles`);
  return createdPuzzles;
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log(`📍 Connecting to: ${config.mongodbUri}`);
    
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await clearDatabase();
    
    // Seed new data
    const users = await seedUsers();
    await seedPuzzles(users);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🧩 Puzzles: ${users.length * 6} (2 per difficulty per user)`);
    
    // Display sample login info
    console.log('\n🔐 Sample Login Information:');
    users.forEach(user => {
      console.log(`   ${user.role === 'admin' ? '👑' : '👤'} ${user.displayName}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      ID: ${user._id}`);
    });
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const forceMode = args.includes('--force') || args.includes('-f');

if (!forceMode && config.isProduction) {
  console.error('❌ Seeding is not allowed in production environment.');
  console.error('   Use --force flag if you really want to seed production data (not recommended).');
  process.exit(1);
}

if (forceMode) {
  console.log('⚠️  Force mode enabled - proceeding with seeding');
}

// Run the seeding
seedDatabase();
