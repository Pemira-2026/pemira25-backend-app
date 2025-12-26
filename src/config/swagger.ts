import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const port = process.env.PORT || 5000;

const options: swaggerJsdoc.Options = {
     definition: {
          openapi: '3.0.0',
          info: {
               title: 'PEMIRA STTNF API 25',
               version: '1.0.0',
               description: 'API documentation for PEMIRA STTNF Voting System',
               contact: {
                    name: 'Tim Developer PEMIRA',
               },
          },
          servers: [
               {
                    url: `http://localhost:${port}`,
                    description: 'Development Server',
               },
               {
                    url: `https://pemira.nurulfikri.ac.id`,
                    description: 'Production Server',
               },
          ],
          components: {
               securitySchemes: {
                    bearerAuth: {
                         type: 'http',
                         scheme: 'bearer',
                         bearerFormat: 'JWT',
                    },
               },
          },
          security: [
               {
                    bearerAuth: [],
               },
          ],
     },
     apis: ['./src/routes/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
