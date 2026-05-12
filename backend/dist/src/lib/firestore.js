export function fromDoc(doc) {
    if (!doc.exists) {
        return null;
    }
    return { id: doc.id, ...doc.data() };
}
export function requireDoc(doc, message = "Record not found") {
    const data = fromDoc(doc);
    if (!data) {
        throw new Error(message);
    }
    return data;
}
export function toDate(value) {
    if (!value) {
        return null;
    }
    return value instanceof Date ? value : value.toDate();
}
export function byDateDesc(a, b) {
    return toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime();
}
