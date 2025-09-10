import { validationResult } from 'express-validator';

/**
 * Joi validation middleware
 * @param {Object} schema - Joi schema to validate against
 * @param {String} target - What to validate ('body', 'params', 'query')
 */
export const validateJoi = (schema, target = 'body') => {
  return (req, res, next) => {
    let dataToValidate;
    
    switch (target) {
      case 'params':
        dataToValidate = req.params;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      case 'body':
      default:
        dataToValidate = req.body;
        break;
    }
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Get all validation errors
      allowUnknown: false, // Don't allow extra fields
      stripUnknown: true // Remove unknown fields
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Replace the original data with validated/sanitized data
    switch (target) {
      case 'params':
        req.params = value;
        break;
      case 'query':
        req.query = value;
        break;
      case 'body':
      default:
        req.body = value;
        break;
    }
    
    next();
  };
};

/**
 * Validate file upload
 * @param {Object} fileSchema - Joi schema for file validation
 */
export const validateFile = (fileSchema) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const { error } = fileSchema.validate(req.file);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'File validation failed',
        details: errors
      });
    }
    
    next();
  };
};

/**
 * Validate multiple files
 * @param {Object} fileSchema - Joi schema for file validation
 * @param {Number} maxFiles - Maximum number of files allowed
 */
export const validateFiles = (fileSchema, maxFiles = 10) => {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    if (req.files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        error: `Too many files. Maximum ${maxFiles} files allowed`
      });
    }
    
    const errors = [];
    
    req.files.forEach((file, index) => {
      const { error } = fileSchema.validate(file);
      
      if (error) {
        error.details.forEach(detail => {
          errors.push({
            fileIndex: index,
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          });
        });
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'File validation failed',
        details: errors
      });
    }
    
    next();
  };
};

/**
 * Custom validation function wrapper
 * @param {Function} validationFunction - Custom validation function
 * @param {String} target - What to validate ('body', 'params', 'query', 'file')
 */
export const validateCustom = (validationFunction, target = 'body') => {
  return (req, res, next) => {
    let dataToValidate;
    
    switch (target) {
      case 'params':
        dataToValidate = req.params;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      case 'file':
        dataToValidate = req.file;
        break;
      case 'body':
      default:
        dataToValidate = req.body;
        break;
    }
    
    try {
      const result = validationFunction(dataToValidate);
      
      if (!result.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Custom validation failed',
          details: result.errors
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Validation error',
        message: error.message
      });
    }
  };
};

/**
 * Handle validation errors from express-validator
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.param || error.path?.join('.'),
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

export default {
  validateJoi,
  validateFile,
  validateFiles,
  validateCustom,
  handleValidationErrors
};
