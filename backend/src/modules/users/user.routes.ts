import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createUserSchema, updateUserSchema, userIdParamsSchema } from "./user.schemas.js";
import { createUser, deleteUser, listAssignees, listUsers, resendInvitation, updateUser } from "./user.service.js";

export const userRoutes = Router();

userRoutes.use(authenticate);

userRoutes.get(
  "/assignees",
  requirePermission("view_properties", "add_property", "edit_property"),
  asyncHandler(async (_req, res) => {
    res.json({ users: await listAssignees() });
  })
);

userRoutes.get(
  "/",
  requirePermission("manage_users"),
  asyncHandler(async (_req, res) => {
    res.json({ users: await listUsers() });
  })
);

userRoutes.post(
  "/",
  requirePermission("manage_users"),
  validate({ body: createUserSchema }),
  asyncHandler(async (req, res) => {
    const result = await createUser(req.body, req.user!.id);
    res.status(201).json(result);
  })
);

userRoutes.put(
  "/:id",
  requirePermission("manage_users"),
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  asyncHandler(async (req, res) => {
    res.json({ user: await updateUser(req.params.id as string, req.body) });
  })
);

userRoutes.post(
  "/:id/invite",
  requirePermission("manage_users"),
  validate({ params: userIdParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json(await resendInvitation(req.params.id as string, req.user!.id));
  })
);

userRoutes.delete(
  "/:id",
  requirePermission("manage_users"),
  validate({ params: userIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await deleteUser(req.params.id as string, req.user!.id);
    res.status(204).send();
  })
);
