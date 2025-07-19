import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from './config.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Marvel Movies API',
      version: '1.0.0',
      description: 'A REST API for Marvel movie and actor information using TMDB data',
      contact: {
        name: 'API Development Team',
        email: 'dev@company.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Marvel',
        description: 'Marvel movies and actors endpoints'
      },
      {
        name: 'Cache',
        description: 'Cache management endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

const specs = swaggerJSDoc(options);

export { specs, swaggerUi };