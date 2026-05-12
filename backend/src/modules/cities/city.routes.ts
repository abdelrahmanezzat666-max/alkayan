import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { cityIdParamsSchema, citySchema } from "./city.schemas.js";
import { createCity, deleteCity, listCities, updateCity } from "./city.service.js";

export const cityRoutes = Router();

cityRoutes.use(authenticate);

cityRoutes.get(
  "/",
  requirePermission("view_properties", "manage_cities"),
  asyncHandler(async (_req, res) => {
    res.json({ cities: await listCities() });
  })
);

cityRoutes.post(
  "/",
  requirePermission("manage_cities"),
  validate({ body: citySchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ city: await createCity(req.body.name) });
  })
);

cityRoutes.put(
  "/:id",
  requirePermission("manage_cities"),
  validate({ params: cityIdParamsSchema, body: citySchema }),
  asyncHandler(async (req, res) => {
    res.json({ city: await updateCity(req.params.id as string, req.body.name) });
  })
);

cityRoutes.delete(
  "/:id",
  requirePermission("manage_cities"),
  validate({ params: cityIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await deleteCity(req.params.id as string);
    res.status(204).send();
  })
);
