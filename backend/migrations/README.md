# SudoQMaestro Database Migrations

This directory contains database migrations for the SudoQMaestro application. Migrations are used to make changes to the database schema and data in a controlled, versioned manner.

## Migration System

We use a custom migration system built for ES modules compatibility. The system tracks applied migrations in a `migrations` collection in the database.

## Available Commands

All migration commands should be run from the `backend` directory:

```bash
# Check migration status
npm run migrate:status

# Apply pending migrations
npm run migrate:up

# Rollback the last applied migration
npm run migrate:down

# Create a new migration
npm run migrate:create "migration description"
```

## Migration File Structure

Migration files follow this naming pattern:
```
YYYYMMDDHHMMSS-description.js
```

Each migration file exports two functions:
- `up(db, client)` - Applies the migration
- `down(db, client)` - Reverts the migration

### Example Migration

```javascript
module.exports = {
  async up(db, client) {
    console.log('Adding new field to users...');
    
    await db.collection('users').updateMany(
      { newField: { $exists: false } },
      { $set: { newField: 'defaultValue' } }
    );
    
    console.log('✅ Added newField to users');
  },

  async down(db, client) {
    console.log('Removing newField from users...');
    
    await db.collection('users').updateMany(
      {},
      { $unset: { newField: "" } }
    );
    
    console.log('✅ Removed newField from users');
  }
};
```

## Best Practices

1. **Always write both `up` and `down` functions**
   - The `up` function should apply the migration
   - The `down` function should revert the changes

2. **Make migrations idempotent**
   - Check if changes already exist before applying them
   - Use conditions like `{ field: { $exists: false } }`

3. **Test migrations thoroughly**
   - Test both `up` and `down` operations
   - Verify data integrity after migrations

4. **Use descriptive names**
   - Migration names should clearly describe what they do
   - Examples: "add-user-preferences", "remove-deprecated-fields"

5. **Handle large datasets carefully**
   - For large collections, consider batching operations
   - Add progress logging for long-running migrations

## Available Migrations

### 20250910094329-add-indexes.js
Creates database indexes for better query performance:
- Users: googleId (unique), email, role, createdAt
- Puzzles: user, difficulty, createdAt, compound indexes

### 20250910094400-update-user-schema.js
Updates user schema with new fields:
- Adds `lastLoginAt`, `isActive`, and `preferences` fields
- Migrates from deprecated `name` field to `displayName`

### 20250910094500-enhance-puzzle-metadata.js
Enhances puzzle collection with metadata:
- Adds status, solveTime, hints, tags, metadata, and stats fields
- Normalizes difficulty values
- Ensures all puzzles have createdAt timestamps

## Troubleshooting

### Common Issues

1. **MongoDB not running**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   Solution: Start MongoDB service

2. **Permission errors**
   ```
   Error: EACCES: permission denied
   ```
   Solution: Check file permissions, run `chmod +x scripts/migrate.js`

3. **Migration already applied**
   The system automatically tracks applied migrations and skips them

### Recovery

If a migration fails partway through:

1. Check the database state manually
2. Fix any incomplete changes
3. If needed, manually remove the migration from the `migrations` collection
4. Re-run the migration

## Development Workflow

1. **Before making schema changes:**
   ```bash
   npm run migrate:status  # Check current state
   ```

2. **Create a new migration:**
   ```bash
   npm run migrate:create "add user avatar field"
   ```

3. **Edit the migration file** with your database changes

4. **Test the migration:**
   ```bash
   npm run migrate:up    # Apply migration
   npm run migrate:down  # Test rollback
   npm run migrate:up    # Re-apply
   ```

5. **Commit the migration file** to version control

## Production Deployment

1. **Always backup the database** before running migrations in production
2. **Test migrations** on a staging environment first
3. **Run migrations during maintenance windows** for breaking changes
4. **Monitor the application** after migrations are applied

## Migration Tracking

The system uses a `migrations` collection to track applied migrations:

```javascript
{
  _id: ObjectId("..."),
  fileName: "20250910094329-add-indexes.js",
  appliedAt: ISODate("2025-09-10T09:43:29.123Z")
}
```

This ensures migrations are only applied once and provides an audit trail.
