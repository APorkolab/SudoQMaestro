module.exports = {
  async up(db, client) {
    console.log('Creating indexes for performance optimization...');
    
    // Add indexes to users collection
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    console.log('✅ Created indexes on users collection');
    
    // Add indexes to puzzles collection
    await db.collection('puzzles').createIndex({ user: 1 });
    await db.collection('puzzles').createIndex({ difficulty: 1 });
    await db.collection('puzzles').createIndex({ createdAt: -1 });
    await db.collection('puzzles').createIndex({ user: 1, createdAt: -1 });
    await db.collection('puzzles').createIndex({ user: 1, difficulty: 1 });
    
    console.log('✅ Created indexes on puzzles collection');
  },

  async down(db, client) {
    console.log('Removing indexes...');
    
    // Remove indexes from users collection
    await db.collection('users').dropIndex({ googleId: 1 });
    await db.collection('users').dropIndex({ email: 1 });
    await db.collection('users').dropIndex({ role: 1 });
    await db.collection('users').dropIndex({ createdAt: -1 });
    
    console.log('✅ Removed indexes from users collection');
    
    // Remove indexes from puzzles collection
    await db.collection('puzzles').dropIndex({ user: 1 });
    await db.collection('puzzles').dropIndex({ difficulty: 1 });
    await db.collection('puzzles').dropIndex({ createdAt: -1 });
    await db.collection('puzzles').dropIndex({ user: 1, createdAt: -1 });
    await db.collection('puzzles').dropIndex({ user: 1, difficulty: 1 });
    
    console.log('✅ Removed indexes from puzzles collection');
  }
};
