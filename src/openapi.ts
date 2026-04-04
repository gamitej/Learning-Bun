export const openapi = {
  openapi: "3.0.1",
  info: {
    title: "Todo API",
    version: "1.0.0",
    description: "API for user-authenticated todo management",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Todo", description: "Todo management endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      UserSignup: {
        type: "object",
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
        required: ["username", "password"],
      },
      AuthResponse: {
        type: "object",
        properties: { token: { type: "string" } },
      },
      Todo: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          completed: { type: "boolean" },
        },
      },
      Todos: { type: "array", items: { $ref: "#/components/schemas/Todo" } },
    },
  },
  paths: {
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Signup",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserSignup" },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserSignup" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
        },
      },
    },
    "/todos": {
      get: {
        tags: ["Todo"],
        summary: "List todos",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Todos" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Todo"],
        summary: "Create todo",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string" } },
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/todos/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
      ],
      get: {
        tags: ["Todo"],
        summary: "Get todo",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Todo"],
        summary: "Update todo",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["Todo"],
        summary: "Delete todo",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
  },
} as const;

export default openapi;
