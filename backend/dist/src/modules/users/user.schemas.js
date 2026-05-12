import { z } from "zod";
import { ALL_PERMISSIONS } from "../../lib/permissions.js";
const permissionEnum = z.enum(ALL_PERMISSIONS);
export const createUserSchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email().transform((value) => value.toLowerCase()),
    roleIds: z.array(z.string().trim().min(1)).optional(),
    permissionNames: z.array(permissionEnum).optional()
});
export const updateUserSchema = createUserSchema.partial().extend({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().email().transform((value) => value.toLowerCase()).optional()
});
export const userIdParamsSchema = z.object({
    id: z.string().trim().min(1)
});
