import mongoose from 'mongoose';
import User from './user.model.js';

describe('User Model', () => {
  beforeEach(async () => {
    // Clear any existing data
    await User.deleteMany({});
  });

  it('should create a valid user with required fields', async () => {
    const userData = {
      googleId: '12345',
      displayName: 'Test User',
      email: 'test@example.com',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.googleId).toBe(userData.googleId);
    expect(savedUser.displayName).toBe(userData.displayName);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe('user'); // default role
  });

  it('should create a user with admin role', async () => {
    const userData = {
      googleId: '67890',
      displayName: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.role).toBe('admin');
  });

  it('should enforce unique googleId', async () => {
    const userData1 = {
      googleId: '12345',
      displayName: 'User One',
      email: 'user1@example.com',
    };

    const userData2 = {
      googleId: '12345', // same googleId
      displayName: 'User Two',
      email: 'user2@example.com',
    };

    await new User(userData1).save();

    // Attempting to save another user with the same googleId should fail
    await expect(new User(userData2).save()).rejects.toThrow();
  });

  it('should allow users with same email (email is not unique in this schema)', async () => {
    const userData1 = {
      googleId: '12345',
      displayName: 'User One',
      email: 'same@example.com',
    };

    const userData2 = {
      googleId: '67890',
      displayName: 'User Two',
      email: 'same@example.com', // same email - should be allowed
    };

    await new User(userData1).save();
    const user2 = await new User(userData2).save();

    expect(user2).toBeDefined();
    expect(user2.email).toBe('same@example.com');
  });

  it('should require googleId field', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      // missing googleId
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow(/googleId.*required/);
  });

  it('should require displayName field', async () => {
    const userData = {
      googleId: '12345',
      email: 'test@example.com',
      // missing displayName
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow(/displayName.*required/);
  });

  it('should require email field', async () => {
    const userData = {
      googleId: '12345',
      displayName: 'Test User',
      // missing email
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow(/email.*required/);
  });

  it('should set default role to user', () => {
    const user = new User({
      googleId: '12345',
      displayName: 'Test User',
      email: 'test@example.com',
    });

    expect(user.role).toBe('user');
  });

  it('should only allow valid role values', async () => {
    const userData = {
      googleId: '12345',
      displayName: 'Test User',
      email: 'test@example.com',
      role: 'invalid-role',
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow();
  });
});
