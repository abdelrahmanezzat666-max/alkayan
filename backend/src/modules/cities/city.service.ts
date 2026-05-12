import type { DocumentSnapshot } from "firebase-admin/firestore";
import { db, FieldValue } from "../../config/firebase.js";
import { fromDoc, type CityRecord, type PropertyRecord, type WithId } from "../../lib/firestore.js";
import { HttpError } from "../../lib/http-error.js";

async function assertUniqueCity(name: string, excludeId?: string) {
  const snapshot = await db.collection("cities").where("name", "==", name).limit(1).get();
  const existing = snapshot.docs[0] ? fromDoc(snapshot.docs[0] as DocumentSnapshot<CityRecord>) : null;
  if (existing && existing.id !== excludeId) {
    throw new HttpError(409, "A city with this name already exists");
  }
}

async function propertyCount(cityId: string) {
  const snapshot = await db.collection("properties").where("cityId", "==", cityId).get();
  return snapshot.size;
}

export async function listCities() {
  const snapshot = await db.collection("cities").orderBy("name", "asc").get();
  const cities = snapshot.docs
    .map((doc) => fromDoc(doc as DocumentSnapshot<CityRecord>))
    .filter((city): city is WithId<CityRecord> => Boolean(city));

  return Promise.all(
    cities.map(async (city) => ({
      ...city,
      _count: { properties: await propertyCount(city.id) }
    }))
  );
}

export async function createCity(name: string) {
  await assertUniqueCity(name);
  const ref = await db.collection("cities").add({
    name,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  return fromDoc((await ref.get()) as DocumentSnapshot<CityRecord>);
}

export async function updateCity(id: string, name: string) {
  await assertUniqueCity(name, id);
  const ref = db.collection("cities").doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new HttpError(404, "City not found");
  }

  await ref.update({ name, updatedAt: FieldValue.serverTimestamp() });
  return fromDoc((await ref.get()) as DocumentSnapshot<CityRecord>);
}

export async function deleteCity(id: string) {
  const usage = await db.collection("properties").where("cityId", "==", id).limit(1).get();
  if (!usage.empty) {
    throw new HttpError(400, "City cannot be deleted while it has properties");
  }

  const ref = db.collection("cities").doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new HttpError(404, "City not found");
  }

  await ref.delete();
}
