import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  listPropertiesQuerySchema,
  phoneCheckQuerySchema,
  propertyIdParamsSchema,
  propertySchema,
  updatePropertySchema
} from "./property.schemas.js";
import { checkPhoneNumber, createProperty, deleteProperty, listProperties, updateProperty } from "./property.service.js";

export const propertyRoutes = Router();

propertyRoutes.use(authenticate);

propertyRoutes.get(
  "/",
  requirePermission("view_properties"),
  validate({ query: listPropertiesQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json({ properties: await listProperties(req.query as Parameters<typeof listProperties>[0], req.user!.permissions) });
  })
);

propertyRoutes.get(
  "/phone-check",
  requirePermission("add_property", "edit_property"),
  validate({ query: phoneCheckQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await checkPhoneNumber(req.query.phoneNumber as string, req.user!.permissions, req.query.excludeId as string | undefined));
  })
);

propertyRoutes.post(
  "/",
  requirePermission("add_property"),
  validate({ body: propertySchema }),
  asyncHandler(async (req, res) => {
    const property = await createProperty(req.body, req.user!.id, req.user!.permissions);
    res.status(201).json({ property });
  })
);

propertyRoutes.put(
  "/:id",
  requirePermission("edit_property"),
  validate({ params: propertyIdParamsSchema, body: updatePropertySchema }),
  asyncHandler(async (req, res) => {
    res.json({ property: await updateProperty(req.params.id as string, req.body, req.user!.permissions) });
  })
);

propertyRoutes.delete(
  "/:id",
  requirePermission("delete_property"),
  validate({ params: propertyIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await deleteProperty(req.params.id as string);
    res.status(204).send();
  })
);
