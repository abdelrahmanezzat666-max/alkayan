import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function signAccessToken(payload) {
    const options = { expiresIn: env.JWT_EXPIRES_IN };
    return jwt.sign(payload, env.JWT_SECRET, options);
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
