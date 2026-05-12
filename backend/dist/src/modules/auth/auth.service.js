import bcrypt from "bcryptjs";
import { db, FieldValue } from "../../config/firebase.js";
import { env } from "../../config/env.js";
import { fromDoc, toDate } from "../../lib/firestore.js";
import { HttpError } from "../../lib/http-error.js";
import { signAccessToken } from "../../lib/jwt.js";
import { hashToken } from "../../lib/security.js";
import { buildUserContext } from "../../middlewares/auth.js";
export async function login(email, password) {
    const users = await db.collection("users").where("email", "==", email).limit(1).get();
    const user = users.docs[0] ? fromDoc(users.docs[0]) : null;
    if (!user || !user.password) {
        throw new HttpError(401, "Invalid email or password");
    }
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        throw new HttpError(401, "Invalid email or password");
    }
    const context = await buildUserContext(user.id);
    const token = signAccessToken({ sub: user.id, email: user.email });
    return { token, user: context };
}
export async function acceptInvitation(token, password) {
    const tokenHash = hashToken(token);
    const invitations = await db.collection("invitations").where("tokenHash", "==", tokenHash).limit(1).get();
    const invitation = invitations.docs[0] ? fromDoc(invitations.docs[0]) : null;
    if (!invitation || invitation.acceptedAt) {
        throw new HttpError(400, "Invitation link is invalid or already used");
    }
    const expiresAt = toDate(invitation.expiresAt);
    if (!expiresAt || expiresAt < new Date()) {
        throw new HttpError(400, "Invitation link has expired");
    }
    const userRef = db.collection("users").doc(invitation.userId);
    const userDoc = await userRef.get();
    const user = fromDoc(userDoc);
    if (!user) {
        throw new HttpError(400, "Invitation user no longer exists");
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await db.runTransaction(async (tx) => {
        tx.update(userRef, {
            password: passwordHash,
            updatedAt: FieldValue.serverTimestamp()
        });
        tx.update(db.collection("invitations").doc(invitation.id), {
            acceptedAt: FieldValue.serverTimestamp()
        });
    });
    const context = await buildUserContext(invitation.userId);
    const accessToken = signAccessToken({ sub: invitation.userId, email: user.email });
    return {
        token: accessToken,
        user: context,
        expiresIn: env.JWT_EXPIRES_IN
    };
}
