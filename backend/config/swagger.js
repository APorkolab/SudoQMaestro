import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import config from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SudoQMaestro API',
      version: '1.0.0',
      description: 'A comprehensive Sudoku application with AI-powered image recognition and puzzle generation capabilities.',
      contact: {
        name: 'SudoQMaestro Team',
        url: 'https://github.com/yourusername/SudoQMaestro',
        email: 'support@sudoqmaestro.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: config.isDevelopment ? 'http://localhost:5000' : 'https://api.sudoqmaestro.com',
        description: config.isDevelopment ? 'Development server' : 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication'
        },
        googleOAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: '/api/auth/google',
              tokenUrl: '/api/auth/google/callback',
              scopes: {
                'profile': 'Access to user profile',
                'email': 'Access to user email'
              }
            }
          }
        }
      },
      schemas: {
        ServerError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Internal Server Error' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011'
            },
            googleId: {
              type: 'string',
              description: 'Google OAuth ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              description: 'User display name',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
              example: 'user'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            }
          }
        },
        Puzzle: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Puzzle ID',
              example: '507f1f77bcf86cd799439012'
            },
            userId: {
              type: 'string',
              description: 'Owner user ID',
              example: '507f1f77bcf86cd799439011'
            },
            puzzleGrid: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 9
                }
              },
              description: '9x9 Sudoku grid with 0 for empty cells',
              example: [[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0]]
            },
            solutionGrid: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 9
                }
              },
              description: '9x9 Sudoku solution grid',
              example: [[5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8]]
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard', 'expert'],
              description: 'Puzzle difficulty level',
              example: 'medium'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Puzzle creation date'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid input data'
            },
            code: {
              type: 'string',
              description: 'Error code',
              example: 'VALIDATION_ERROR'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            }
          }
        }
      },
      responses: {
        ServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServerError'
              }
            }
          }
        }
      }
    },
    security: [
      {
        sessionAuth: []
      }
    ]
  },
  apis: [
    './api/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
