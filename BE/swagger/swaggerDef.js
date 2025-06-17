module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'EvelynBeauty API',
    version: '1.0.0',
    description: 'Tài liệu Swagger cho hệ thống EvelynBeauty',
  },
  servers: [
    {
      url: 'http://localhost:3000',
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
};
