import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createRole, deleteRole, listPermissionsAndRoles, updateRolePermissions } from "./permission.service.js";
import { roleIdParamsSchema, roleSchema, updateRoleSchema } from "./permission.schemas.js";
export const permissionRoutes = Router();
permissionRoutes.use(authenticate, requirePermission("manage_permissions"));
permissionRoutes.get("/", asyncHandler(async (_req, res) => {
    res.json(await listPermissionsAndRoles());
}));
permissionRoutes.post("/roles", validate({ body: roleSchema }), asyncHandler(async (req, res) => {
    res.status(201).json({ role: await createRole(req.body.name, req.body.permissionNames) });
}));
permissionRoutes.put("/roles/:id", validate({ params: roleIdParamsSchema, body: updateRoleSchema }), asyncHandler(async (req, res) => {
    res.json({ role: await updateRolePermissions(req.params.id, req.body.permissionNames) });
}));
permissionRoutes.delete("/roles/:id", validate({ params: roleIdParamsSchema }), asyncHandler(async (req, res) => {
    await deleteRole(req.params.id);
    res.status(204).send();
}));
