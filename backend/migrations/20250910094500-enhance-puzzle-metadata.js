module.exports = {
  async up(db, client) {
    console.log('Enhancing puzzle metadata...');
    
    // Add metadata fields to existing puzzles
    await db.collection('puzzles').updateMany(
      { 
        $or: [
          { status: { $exists: false } },
          { solveTime: { $exists: false } },
          { hints: { $exists: false } },
          { tags: { $exists: false } }
        ]
      },
      {
        $set: {
          status: 'unsolved',
          solveTime: null,
          hints: [],
          tags: [],
          metadata: {
            source: 'generated',
            version: '1.0',
            notes: ''
          },
          stats: {
            attempts: 0,
            hintsUsed: 0,
            timeSpent: 0
          }
        }
      }
    );
    
    console.log('✅ Added metadata fields to puzzles');
    
    // Update difficulty values to ensure consistency
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    await db.collection('puzzles').updateMany(
      { difficulty: { $nin: validDifficulties } },
      { $set: { difficulty: 'medium' } }
    );
    
    console.log('✅ Normalized puzzle difficulty values');
    
    // Add createdAt to puzzles that don't have it
    const puzzlesWithoutCreatedAt = await db.collection('puzzles').find({ createdAt: { $exists: false } }).toArray();
    
    for (const puzzle of puzzlesWithoutCreatedAt) {
      await db.collection('puzzles').updateOne(
        { _id: puzzle._id },
        { $set: { createdAt: new Date() } }
      );
    }
    
    console.log('✅ Added createdAt to puzzles without timestamps');
  },

  async down(db, client) {
    console.log('Reverting puzzle metadata enhancements...');
    
    // Remove the added metadata fields
    await db.collection('puzzles').updateMany(
      {},
      {
        $unset: {
          status: "",
          solveTime: "",
          hints: "",
          tags: "",
          metadata: "",
          stats: ""
        }
      }
    );
    
    console.log('✅ Removed metadata fields from puzzles');
  }
};
