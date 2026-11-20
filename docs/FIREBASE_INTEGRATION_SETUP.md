# Firebase integration setup (staged)

This repository is being prepared for a gradual Firebase integration. The current production application remains on its existing Supabase implementation until the Firebase migration is implemented, tested, and explicitly approved.

## Current status

- Firebase project ID: `websitecpt-bot`
- Firebase Email/Password sign-in: enabled (owner-confirmed)
- Firestore: created (owner-confirmed)
- Firebase SDK and application integration: not yet added
- Existing Supabase authentication, database, and Storage must not be disabled during this stage.

## Owner actions in Firebase Console

1. Open https://console.firebase.google.com/ and select the project `websitecpt-bot`.
2. Open **Project settings** (gear icon) → **General**.
3. Under **Your apps**, select the Web app. If no Web app exists, add one (</>), name it `CPT Markets Web`, and do not enable Firebase Hosting just for this step.
4. In **SDK setup and configuration**, choose **Config**. Keep the values ready for the Vercel environment variables listed below. Do not post them in a public GitHub issue or commit them into source code.
5. Open **Firestore Database** → **Rules**. Do not use the temporary time-based public rule that allows everyone to read/write. Do not put real customer data in Firestore until proper authenticated, role-aware rules and server-side authorization have been implemented and tested.
6. Do not delete, reset, or migrate any existing Supabase data or Firebase Authentication users as part of this setup step.

## Vercel environment variables (add only when instructed)

Add these to the Vercel project for the preview environment first. The application code must read them via `import.meta.env`; never hard-code the values.

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

The Firebase Web config is client configuration, not an Admin SDK credential. Never place a service-account JSON, private key, Admin SDK credential, or other server secret in any `VITE_*` variable or frontend file.

## Required implementation order

1. Add the Firebase Web SDK and a small isolated client initializer; keep it unused by existing screens initially.
2. Verify install, type-check, and production build on this branch.
3. Add Firebase Auth in a compatibility-safe way. Existing customers must not lose access; do not copy plaintext passwords into Firestore.
4. Add server-side role checks and Firestore security rules before reading/writing customer records.
5. Migrate one data area at a time, preserving existing IDs, trade history, balances, support messages, and attachment references.
6. Test with preview deployments and test accounts on desktop and mobile. Keep Supabase available as rollback until all checks pass.
7. Only switch production after explicit owner approval.

## Important safety notes

- Never use public Firestore rules for customer data.
- Never store passwords in Firestore or in user profile documents.
- Balance changes, trade settlement, admin actions, and withdrawals must be authorized on a trusted server, not trusted to browser code.
- Support attachments need a deliberate Storage migration plan; old Supabase Storage references must continue to resolve until migrated.
- No production deployment, database deletion, or Supabase shutdown is authorized by this document.
