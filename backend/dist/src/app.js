import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { corsOrigins, env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { cityRoutes } from "./modules/cities/city.routes.js";
import { permissionRoutes } from "./modules/permissions/permission.routes.js";
import { propertyRoutes } from "./modules/properties/property.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
export const app = express();
app.use(helmet());
app.use(cors({
    origin: corsOrigins,
    credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false
}));
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "al-kayan-api" });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/properties", propertyRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
