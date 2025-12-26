"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const port = process.env.PORT || 5000;
const options = {
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
