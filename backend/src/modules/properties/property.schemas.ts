import { z } from "zod";
import { OPERATION_TYPES, PROPERTY_TYPES } from "../../lib/permissions.js";

const phoneSchema = z
  .string()
  .trim()
  .min(5)
  .max(30)
  .regex(/^[+\d\s-]+$/, "Phone number can contain digits, spaces, hyphens, and a leading plus sign");

export const propertySchema = z.object({
  operationType: z.enum(OPERATION_TYPES),
  cityId: z.string().trim().min(1),
  propertyType: z.enum(PROPERTY_TYPES),
  assignedUserId: z.string().trim().min(1).nullable().optional(),
  phoneNumber: phoneSchema,
  description: z.string().trim().min(3).max(3000)
});

export const updatePropertySchema = propertySchema.partial();

export const propertyIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const phoneCheckQuerySchema = z.object({
  phoneNumber: phoneSchema,
  excludeId: z.string().trim().min(1).optional()
});

export const listPropertiesQuerySchema = z.object({
  operationType: z.enum(OPERATION_TYPES).optional(),
  cityId: z.string().trim().min(1).optional(),
  city: z.string().trim().optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  search: z.string().trim().optional()
});
