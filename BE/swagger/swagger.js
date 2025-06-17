const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerDefinition = require('./swaggerDef');

const options = {
  swaggerDefinition,
  apis: ['./swagger/docs/*.yaml'], // <-- đường dẫn file yaml mô tả API
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger; // <-- export đúng hàm
