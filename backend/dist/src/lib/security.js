import crypto from "node:crypto";
export function createInvitationToken() {
    const token = crypto.randomBytes(32).toString("hex");
    return {
        token,
        tokenHash: hashToken(token)
    };
}
export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
export function normalizePhoneNumber(phoneNumber) {
    return phoneNumber.trim().replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}
export function maskPhoneNumber(phoneNumber) {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (normalized.length <= 6) {
        return "****";
    }
    return `${normalized.slice(0, 3)}****${normalized.slice(-3)}`;
}
