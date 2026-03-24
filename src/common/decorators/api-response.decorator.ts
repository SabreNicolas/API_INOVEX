import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from "@nestjs/swagger";

import { MessageResponseDto } from "../dto/response.dto";

const wrapSchema = (dataSchema: object) => ({
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string", example: "Opération réussie" },
    data: dataSchema,
    timestamp: {
      type: "string",
      format: "date-time",
      example: "2025-01-01T00:00:00.000Z",
    },
  },
});

const paginatedSchema = (model: Type) => ({
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string", example: "Opération réussie" },
    data: { type: "array", items: { $ref: getSchemaPath(model) } },
    meta: {
      type: "object",
      properties: {
        total: { type: "number", example: 100 },
        page: { type: "number", example: 1 },
        limit: { type: "number", example: 20 },
        totalPages: { type: "number", example: 5 },
        hasNextPage: { type: "boolean", example: true },
        hasPreviousPage: { type: "boolean", example: false },
      },
    },
    timestamp: {
      type: "string",
      format: "date-time",
      example: "2025-01-01T00:00:00.000Z",
    },
  },
});

/** GET single entity → { success, data: Entity, timestamp } */
export const ApiOkResponseWrapped = <T extends Type>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: "Opération réussie",
      schema: wrapSchema({ $ref: getSchemaPath(model) }),
    })
  );

/** GET array (non-paginé) → { success, data: Entity[], timestamp } */
export const ApiOkArrayResponseWrapped = <T extends Type>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: "Opération réussie",
      schema: wrapSchema({
        type: "array",
        items: { $ref: getSchemaPath(model) },
      }),
    })
  );

/** GET paginé → { success, data: Entity[], meta: {...}, timestamp } */
export const ApiPaginatedResponseWrapped = <T extends Type>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: "Opération réussie (paginé)",
      schema: paginatedSchema(model),
    })
  );

/** POST create → 201 { success, data: Entity, timestamp } */
export const ApiCreatedResponseWrapped = <T extends Type>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiCreatedResponse({
      description: "Ressource créée",
      schema: wrapSchema({ $ref: getSchemaPath(model) }),
    })
  );

/** PUT/PATCH/DELETE → { success, data: { message }, timestamp } */
export const ApiMessageResponseWrapped = () =>
  applyDecorators(
    ApiExtraModels(MessageResponseDto),
    ApiOkResponse({
      description: "Opération réussie",
      schema: wrapSchema({ $ref: getSchemaPath(MessageResponseDto) }),
    })
  );
