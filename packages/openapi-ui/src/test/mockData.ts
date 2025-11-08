import type { OpenApiSpec } from "../types";

export const mockOpenApiSpec: OpenApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Test API",
    version: "1.0.0",
    description: "A test API for unit testing",
  },
  servers: [
    {
      url: "https://api.test.com/v1",
      description: "Test server",
    },
  ],
  paths: {
    "/users": {
      get: {
        tags: ["users"],
        summary: "List users",
        description: "Get a list of all users",
        operationId: "listUsers",
        parameters: [
          {
            name: "limit",
            in: "query",
            description: "Maximum number of users to return",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
        ],
        responses: {
          "200": {
            description: "A list of users",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["users"],
        summary: "Create user",
        description: "Create a new user",
        operationId: "createUser",
        requestBody: {
          description: "User to create",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/NewUser",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "400": {
            description: "Invalid input",
          },
        },
      },
    },
    "/users/{userId}": {
      get: {
        tags: ["users"],
        summary: "Get user by ID",
        description: "Retrieve a specific user by ID",
        operationId: "getUserById",
        parameters: [
          {
            name: "userId",
            in: "path",
            description: "ID of user to retrieve",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          "200": {
            description: "User details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          "404": {
            description: "User not found",
          },
        },
      },
      delete: {
        tags: ["users"],
        summary: "Delete user",
        description: "Delete a user by ID",
        operationId: "deleteUser",
        parameters: [
          {
            name: "userId",
            in: "path",
            description: "ID of user to delete",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          "204": {
            description: "User deleted",
          },
          "404": {
            description: "User not found",
          },
        },
      },
    },
    "/posts": {
      get: {
        tags: ["posts"],
        summary: "List posts",
        description: "Get a list of all posts",
        operationId: "listPosts",
        responses: {
          "200": {
            description: "A list of posts",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Post",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "username"],
        properties: {
          id: {
            type: "integer",
            format: "int64",
            description: "User ID",
          },
          username: {
            type: "string",
            description: "Username",
          },
          email: {
            type: "string",
            format: "email",
            description: "Email address",
          },
          status: {
            type: "string",
            enum: ["active", "inactive"],
            description: "User status",
          },
        },
      },
      NewUser: {
        type: "object",
        required: ["username"],
        properties: {
          username: {
            type: "string",
            description: "Username",
          },
          email: {
            type: "string",
            format: "email",
            description: "Email address",
          },
        },
      },
      Post: {
        type: "object",
        required: ["id", "title"],
        properties: {
          id: {
            type: "integer",
            format: "int64",
            description: "Post ID",
          },
          title: {
            type: "string",
            description: "Post title",
          },
          content: {
            type: "string",
            description: "Post content",
          },
        },
      },
    },
  },
  tags: [
    {
      name: "users",
      description: "User operations",
    },
    {
      name: "posts",
      description: "Post operations",
    },
  ],
};
