import { z } from "zod";
import { ALL_PERMISSIONS } from "../../lib/permissions.js";
export const roleIdParamsSchema = z.object({
    id: z.string().trim().min(1)
});
export const roleSchema = z.object({
    name: z.string().trim().min(2).max(80).regex(/^[a-zA-Z0-9_-]+$/),
    permissionNames: z.array(z.enum(ALL_PERMISSIONS)).default([])
});
export const updateRoleSchema = z.object({
    permissionNames: z.array(z.enum(ALL_PERMISSIONS)).default([])
});
