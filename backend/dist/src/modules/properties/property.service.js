import { db, FieldValue } from "../../config/firebase.js";
import { byDateDesc, fromDoc, toDate } from "../../lib/firestore.js";
import { HttpError } from "../../lib/http-error.js";
import { hasPermission } from "../../lib/permissions.js";
import { maskPhoneNumber, normalizePhoneNumber } from "../../lib/security.js";
function canViewPhone(permissions) {
    return hasPermission(permissions, "view_phone_numbers");
}
async function publicUser(userId) {
    if (!userId) {
        return null;
    }
    const user = fromDoc((await db.collection("users").doc(userId).get()));
    return user ? { id: user.id, name: user.name, email: user.email } : null;
}
async function propertyDto(property, permissions) {
    const [city, assignedEmployee, createdBy] = await Promise.all([
        db.collection("cities").doc(property.cityId).get(),
        publicUser(property.assignedUserId),
        publicUser(property.createdById)
    ]);
    const cityRecord = fromDoc(city);
    const revealPhone = canViewPhone(permissions);
    return {
        id: property.id,
        operationType: property.operationType,
        city: cityRecord,
        cityId: property.cityId,
        propertyType: property.propertyType,
        assignedEmployee,
        assignedUserId: property.assignedUserId ?? null,
        phoneNumber: revealPhone ? property.phoneNumber : maskPhoneNumber(property.phoneNumber),
        phoneNumberMasked: maskPhoneNumber(property.phoneNumber),
        canViewFullPhoneNumber: revealPhone,
        description: property.description,
        createdBy,
        createdAt: toDate(property.createdAt),
        updatedAt: toDate(property.updatedAt)
    };
}
async function findDuplicate(phoneNumber, excludeId) {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const snapshot = await db.collection("properties").where("phoneNumber", "==", normalizedPhone).limit(5).get();
    return (snapshot.docs
        .map((doc) => fromDoc(doc))
        .filter((property) => Boolean(property))
        .find((property) => property.id !== excludeId) ?? null);
}
async function ensureRefs(input) {
    if (input.cityId) {
        const city = await db.collection("cities").doc(input.cityId).get();
        if (!city.exists) {
            throw new HttpError(400, "City is invalid");
        }
    }
    if (input.assignedUserId) {
        const user = await db.collection("users").doc(input.assignedUserId).get();
        if (!user.exists) {
            throw new HttpError(400, "Assigned user is invalid");
        }
    }
}
export async function listProperties(query, permissions) {
    let firestoreQuery = db.collection("properties");
    if (query.operationType) {
        firestoreQuery = firestoreQuery.where("operationType", "==", query.operationType);
    }
    if (query.cityId) {
        firestoreQuery = firestoreQuery.where("cityId", "==", query.cityId);
    }
    if (query.propertyType) {
        firestoreQuery = firestoreQuery.where("propertyType", "==", query.propertyType);
    }
    const snapshot = await firestoreQuery.get();
    let properties = snapshot.docs
        .map((doc) => fromDoc(doc))
        .filter((property) => Boolean(property));
    if (query.city) {
        const cities = await db.collection("cities").get();
        const cityIds = new Set(cities.docs
            .map((doc) => fromDoc(doc))
            .filter((city) => Boolean(city))
            .filter((city) => city.name.toLowerCase() === query.city.toLowerCase())
            .map((city) => city.id));
        properties = properties.filter((property) => cityIds.has(property.cityId));
    }
    if (query.search) {
        const search = query.search.toLowerCase();
        const normalizedSearch = normalizePhoneNumber(query.search);
        const cityDocs = await db.collection("cities").get();
        const cityById = new Map(cityDocs.docs
            .map((doc) => fromDoc(doc))
            .filter((city) => Boolean(city))
            .map((city) => [city.id, city]));
        properties = properties.filter((property) => {
            const city = cityById.get(property.cityId);
            return (property.description.toLowerCase().includes(search) ||
                city?.name.toLowerCase().includes(search) ||
                (canViewPhone(permissions) && property.phoneNumber.includes(normalizedSearch)));
        });
    }
    properties.sort(byDateDesc);
    return Promise.all(properties.map((property) => propertyDto(property, permissions)));
}
export async function checkPhoneNumber(phoneNumber, permissions, excludeId) {
    const existing = await findDuplicate(phoneNumber, excludeId);
    return {
        exists: Boolean(existing),
        property: existing ? await propertyDto(existing, permissions) : null
    };
}
export async function createProperty(input, createdById, permissions) {
    await ensureRefs(input);
    const duplicate = await findDuplicate(input.phoneNumber);
    if (duplicate) {
        throw new HttpError(409, "Phone number already exists", {
            property: await propertyDto(duplicate, permissions)
        });
    }
    const ref = await db.collection("properties").add({
        operationType: input.operationType,
        cityId: input.cityId,
        propertyType: input.propertyType,
        assignedUserId: input.assignedUserId || null,
        phoneNumber: normalizePhoneNumber(input.phoneNumber),
        description: input.description,
        createdById,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
    return propertyDto(fromDoc((await ref.get())), permissions);
}
export async function updateProperty(id, input, permissions) {
    await ensureRefs(input);
    if (input.phoneNumber) {
        const duplicate = await findDuplicate(input.phoneNumber, id);
        if (duplicate) {
            throw new HttpError(409, "Phone number already exists", {
                property: await propertyDto(duplicate, permissions)
            });
        }
    }
    const ref = db.collection("properties").doc(id);
    const existing = fromDoc((await ref.get()));
    if (!existing) {
        throw new HttpError(404, "Property not found");
    }
    await ref.update({
        operationType: input.operationType ?? existing.operationType,
        cityId: input.cityId ?? existing.cityId,
        propertyType: input.propertyType ?? existing.propertyType,
        assignedUserId: input.assignedUserId === undefined ? existing.assignedUserId ?? null : input.assignedUserId || null,
        phoneNumber: input.phoneNumber ? normalizePhoneNumber(input.phoneNumber) : existing.phoneNumber,
        description: input.description ?? existing.description,
        updatedAt: FieldValue.serverTimestamp()
    });
    return propertyDto(fromDoc((await ref.get())), permissions);
}
export async function deleteProperty(id) {
    const ref = db.collection("properties").doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
        throw new HttpError(404, "Property not found");
    }
    await ref.delete();
}
