import { jest } from '@jest/globals';

// This is a manual mock for the User model.
// It mocks the static 'find' method.
export default {
  find: jest.fn(),
};
