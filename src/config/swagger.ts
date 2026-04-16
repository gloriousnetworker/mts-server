import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MegaTech Solutions API',
      version: '1.0.0',
      description: 'Backend API for the MegaTech Solutions educational platform',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
      { url: 'https://mts-server-production.up.railway.app', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['student', 'staff', 'admin'] },
            avatar: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            instructor: { type: 'string', description: 'Instructor name' },
            instructorId: { type: 'string', format: 'uuid' },
            price: { type: 'number' },
            category: { type: 'string' },
            level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
            duration: { type: 'string' },
            image: { type: 'string' },
            curriculum: { type: 'array', items: { type: 'string' } },
            requirements: { type: 'array', items: { type: 'string' } },
            learningOutcomes: { type: 'array', items: { type: 'string' } },
            enrolledStudents: { type: 'integer' },
            rating: { type: 'number' },
            isFeatured: { type: 'boolean' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            courseId: { type: 'string', format: 'uuid' },
            enrolledDate: { type: 'string', format: 'date-time' },
            progress: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'completed', 'pending'] },
            course: { $ref: '#/components/schemas/Course' },
          },
        },
      },
    },
  },
  apis: ['./src/modules/*/auth.routes.ts', './src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
