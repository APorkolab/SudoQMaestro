module.exports = {
  async up(db, client) {
    console.log('Updating user schema...');
    
    // Add lastLoginAt field to all existing users
    await db.collection('users').updateMany(
      { lastLoginAt: { $exists: false } },
      {
        $set: {
          lastLoginAt: null,
          isActive: true,
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: true
          }
        }
      }
    );
    
    console.log('✅ Added lastLoginAt, isActive, and preferences fields to users');
    
    // Ensure all users have proper displayName (migrate from deprecated 'name' field if exists)
    const usersWithoutDisplayName = await db.collection('users').find({ displayName: { $exists: false } }).toArray();
    
    for (const user of usersWithoutDisplayName) {
      const displayName = user.name || user.email?.split('@')[0] || 'Unknown User';
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { displayName },
          $unset: { name: "" }  // Remove deprecated 'name' field
        }
      );
    }
    
    console.log('✅ Migrated user displayName field');
  },

  async down(db, client) {
    console.log('Reverting user schema changes...');
    
    // Remove the added fields
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          lastLoginAt: "",
          isActive: "",
          preferences: ""
        }
      }
    );
    
    console.log('✅ Removed lastLoginAt, isActive, and preferences fields from users');
  }
};
