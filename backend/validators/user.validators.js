import Joi from 'joi';

/**
 * User validation schemas using Joi
 */

// User registration/update validation
export const userCreateSchema = Joi.object({
  googleId: Joi.string().required(),
  displayName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('user', 'admin').default('user'),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').default('light'),
    language: Joi.string().valid('en', 'hu', 'es', 'fr', 'de').default('en'),
    notifications: Joi.boolean().default(true)
  }).optional()
});

// User update validation
export const userUpdateSchema = Joi.object({
  displayName: Joi.string().min(1).max(100).optional(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark'),
    language: Joi.string().valid('en', 'hu', 'es', 'fr', 'de'),
    notifications: Joi.boolean()
  }).optional()
});

// Admin user role update validation
export const adminUserUpdateSchema = Joi.object({
  role: Joi.string().valid('user', 'admin').required(),
  isActive: Joi.boolean().optional()
});

// MongoDB ObjectId validation
export const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required();

// Query parameters validation
export const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('createdAt', 'displayName', 'email', 'role').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().max(100).optional(),
  role: Joi.string().valid('user', 'admin').optional(),
  active: Joi.boolean().optional()
});

export default {
  userCreateSchema,
  userUpdateSchema,
  adminUserUpdateSchema,
  objectIdSchema,
  userQuerySchema
};
