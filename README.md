# Al Kayan Real Estate Office

Full-stack real estate office dashboard for **Al Kayan** with JWT authentication, invitation-only user onboarding, role-based permissions, property CRUD, phone masking, city management, and an Arabic-friendly responsive UI.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express, TypeScript, Vercel Serverless Functions
- Database: Firebase Firestore via Firebase Admin SDK
- Auth: JWT, bcrypt password hashing, secure invitation tokens

## Quick Start

1. Copy `.env.example` to `.env` and update secrets.
2. Create a Firebase project, enable Firestore, and create a service account key.

3. Add the Firebase service account values to `.env`:

   ```bash
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Seed Firestore:

   ```bash
   npm run seed
   ```

6. Start both apps:

   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Vercel + Firebase

Vercel is used for the Vite frontend and the Express API through `api/[...path].ts`.
Firebase Firestore stores users, roles, permissions, cities, properties, and invitations.

Set these environment variables in Vercel:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `JWT_SECRET`
- `APP_URL`
- `API_URL`
- `CORS_ORIGIN`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- SMTP variables if you want real invitation emails

## Default Data

The seed creates:

- Admin role with all permissions
- Employee role with default operational permissions
- Required cities: El Shorouk, Badr, Obour, Madinaty
- Initial admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`

## Permissions

- `view_properties`
- `add_property`
- `edit_property`
- `delete_property`
- `view_phone_numbers`
- `manage_users`
- `manage_permissions`
- `manage_cities`
- `admin_access`

## Invitation Flow

Admins create users from the dashboard. The API creates a secure one-time invitation token, stores only its SHA-256 hash, and emails an invitation link. If SMTP is not configured in development, the link is logged by the backend and returned in the create-user response for local testing.
