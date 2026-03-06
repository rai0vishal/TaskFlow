const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management System API',
      version: '1.0.0',
      description:
        'A production-ready REST API for managing projects and tasks with authentication and role-based access control.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /auth/login or /auth/register',
        },
      },
      schemas: {
        // ---- User ----
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ---- Task ----
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
            title: { type: 'string', example: 'Implement login page' },
            description: { type: 'string', example: 'Create the login UI with form validation' },
            status: {
              type: 'string',
              enum: ['todo', 'in-progress', 'in-review', 'done'],
              example: 'todo',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              example: 'medium',
            },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            createdBy: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ---- Pagination ----
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
          },
        },

        // ---- Error ----
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation Error' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Please provide a valid email address' },
                },
              },
            },
          },
        },
      },
    },

    // ---- Paths ----
    paths: {
      // ==================== AUTH ====================
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          description: 'Creates a new user account and returns a JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: {
                      type: 'string',
                      minLength: 2,
                      maxLength: 50,
                      example: 'John Doe',
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'john@example.com',
                    },
                    password: {
                      type: 'string',
                      minLength: 8,
                      maxLength: 128,
                      description:
                        'Must contain at least one uppercase letter, one lowercase letter, and one number.',
                      example: 'SecurePass1',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'User registered successfully' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string', example: 'eyJhbGciOi...' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            409: { description: 'Email already exists' },
            429: { description: 'Too many requests' },
          },
        },
      },

      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Log in a user',
          description: 'Authenticates with email and password and returns a JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', example: 'SecurePass1' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Login successful' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string', example: 'eyJhbGciOi...' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Invalid email or password' },
            429: { description: 'Too many authentication attempts' },
          },
        },
      },

      // ==================== TASKS ====================
      '/tasks': {
        post: {
          tags: ['Tasks'],
          summary: 'Create a new task',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', minLength: 3, maxLength: 150, example: 'Implement login page' },
                    description: { type: 'string', maxLength: 2000, example: 'Build the login form with validation' },
                    status: { type: 'string', enum: ['todo', 'in-progress', 'in-review', 'done'], default: 'todo' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Task created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Task created successfully' },
                      data: {
                        type: 'object',
                        properties: {
                          task: { $ref: '#/components/schemas/Task' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Validation error' },
            401: { description: 'Not authenticated' },
          },
        },
        get: {
          tags: ['Tasks'],
          summary: 'List tasks (paginated)',
          description: 'Returns paginated tasks. Regular users see only their own tasks; admins see all.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 }, description: 'Items per page (max 100)' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'in-progress', 'in-review', 'done'] }, description: 'Filter by status' },
          ],
          responses: {
            200: {
              description: 'Tasks retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                          pagination: { $ref: '#/components/schemas/Pagination' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Not authenticated' },
          },
        },
      },

      '/tasks/{id}': {
        get: {
          tags: ['Tasks'],
          summary: 'Get a task by ID',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Task ID' },
          ],
          responses: {
            200: {
              description: 'Task retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'object', properties: { task: { $ref: '#/components/schemas/Task' } } },
                    },
                  },
                },
              },
            },
            401: { description: 'Not authenticated' },
            403: { description: 'Forbidden — not your task' },
            404: { description: 'Task not found' },
          },
        },
        put: {
          tags: ['Tasks'],
          summary: 'Update a task',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Task ID' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', minLength: 3, maxLength: 150 },
                    description: { type: 'string', maxLength: 2000 },
                    status: { type: 'string', enum: ['todo', 'in-progress', 'in-review', 'done'] },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Task updated' },
            400: { description: 'Validation error' },
            401: { description: 'Not authenticated' },
            403: { description: 'Forbidden' },
            404: { description: 'Task not found' },
          },
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Delete a task',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Task ID' },
          ],
          responses: {
            200: { description: 'Task deleted' },
            401: { description: 'Not authenticated' },
            403: { description: 'Forbidden' },
            404: { description: 'Task not found' },
          },
        },
      },

      '/tasks/{id}/activity': {
        get: {
          tags: ['Tasks'],
          summary: 'Get activity history for a task',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Task ID' },
          ],
          responses: {
            200: {
              description: 'Task activity retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Task activity retrieved successfully' },
                      data: {
                        type: 'object',
                        properties: {
                          activities: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                _id: { type: 'string' },
                                action: { type: 'string', enum: ['created', 'updated', 'deleted'] },
                                details: { type: 'object' },
                                performedBy: {
                                  type: 'object',
                                  properties: {
                                    _id: { type: 'string' },
                                    name: { type: 'string' },
                                    email: { type: 'string' }
                                  }
                                },
                                createdAt: { type: 'string', format: 'date-time' },
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Not authenticated' },
            403: { description: 'Forbidden' },
            404: { description: 'Task not found' },
          }
        }
      },
    },

    tags: [
      { name: 'Authentication', description: 'User registration and login' },
      { name: 'Tasks', description: 'Task CRUD operations' },
    ],
  },
  apis: [], // We define everything inline above, no JSDoc scanning needed
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
