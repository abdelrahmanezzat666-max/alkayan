import { ZodError } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
export function notFoundHandler(req, _res, next) {
    next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}
export function errorHandler(error, _req, res, _next) {
    if (error instanceof ZodError) {
        return res.status(422).json({
            message: "Validation failed",
            errors: error.flatten()
        });
    }
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
            message: error.message,
            details: error.details
        });
    }
    console.error(error);
    return res.status(500).json({
        message: "Internal server error",
        stack: env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined
    });
}
