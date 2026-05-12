import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { acceptInvitationSchema, loginSchema } from "./auth.schemas.js";
import { acceptInvitation, login } from "./auth.service.js";
export const authRoutes = Router();
authRoutes.post("/login", validate({ body: loginSchema }), asyncHandler(async (req, res) => {
    const result = await login(req.body.email, req.body.password);
    res.json(result);
}));
authRoutes.post("/accept-invitation", validate({ body: acceptInvitationSchema }), asyncHandler(async (req, res) => {
    const result = await acceptInvitation(req.body.token, req.body.password);
    res.json(result);
}));
authRoutes.get("/me", authenticate, asyncHandler(async (req, res) => {
    res.json({ user: req.user });
}));
