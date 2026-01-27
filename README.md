# Comics Shelf (Expo / React Native) :)

A tiny comic collection app that lets you track what you’ve read vs what’s on your “to-read” pile, store everything in Appwrite, and upload cover images to Cloudinary. It can also generate a short description via an Appwrite Function. (ง'̀-'́)ง

## What you can do (☞ﾟヮﾟ)☞

- Browse your shelf (grid of comics)
- Add a comic with:
  - Title
  - Status: `to-read` or `read`
  - Rating (1–5, only when status is `read`)
  - Optional cover image upload
  - Auto-generated description (via Appwrite Functions)
- View details for a comic
- Edit a comic (title/status/rating/description/cover)
- Delete a comic (with confirmation) :(

## Routes / screens (•_•)

This project uses `expo-router`.

- `/(tabs)/index.jsx` — Shelf (list)
- `/(tabs)/add-comic.jsx` — Add comic
- `/comics/[id].jsx` — Comic details
- `/comics/edit/[id].jsx` — Edit comic

## Tech stack (⌐■_■)

- Expo SDK 52 + React Native 0.76
- `expo-router` for navigation
- Appwrite:
  - Client: `react-native-appwrite` (CRUD)
  - Admin/migration: `node-appwrite` (schema creation)
- Cloudinary (image uploads)
- NativeWind + Tailwind config (project is mostly `StyleSheet`, but NativeWind is wired up)
- Google font: Bangers (`@expo-google-fonts/bangers`)

## Getting started (ง •̀_•́)ง

### 1) Install dependencies

```bash
npm install
```

### 2) Set up environment variables

Create a `.env` file in the project root.

- If you’re starting fresh: copy `.env.example` → `.env` and fill values.
- This repo already contains a `.gitignore` rule for `.env` (good!). Still: do NOT commit secrets. (ಠ_ಠ)

Required for the mobile app:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_COLLECTION_ID`

Optional:

- `APPWRITE_FUNCTION_ID_GENERATE_DESC` (defaults to `comics_description_ai`)

Required only for schema migration scripts:

- `APPWRITE_API_KEY` (Appwrite Server API Key)

Cloudinary:

- The current implementation in `utils/cloudinary.js` uses a hardcoded Cloudinary cloud name and an unsigned upload preset.
- The `.env` includes `CLOUDINARY_*` vars mainly for convenience (and future refactor), but uploads currently depend on:
  - Cloud name: `dytiufsuu`
  - Upload preset: `comics_shelf`

If you want to use your own Cloudinary account, update those in `utils/cloudinary.js`. :)

### 3) (Optional but recommended) Create/update the Appwrite DB schema

There’s a migration script that will create the database + collection + attributes if they don’t exist.

```bash
npm run migrate
```

It creates a `comics` schema with fields:

- `title` (string, required)
- `description` (string)
- `status` (string, required)
- `rating` (int, 0–5)
- `coverImage` (string)
- `createdAt` (datetime)
- `updatedAt` (datetime)

Permissions note (important) (ಠ‿ಠ):

- The migration sets collection permissions to `Role.any()` for read/create/update/delete.
- That’s convenient for demos, but you probably want auth-based rules for a real app.

### 4) Run the app

```bash
npm start
```

Or platform specific:

```bash
npm run android
npm run ios
npm run web
```

## Appwrite notes (•ᴗ•)

- Client calls are implemented in `utils/appwrite.js`.
- The Appwrite client sets `.setPlatform("com.comicsshelf.app")`.
  - Android package in `app.json` is also `com.comicsshelf.app`.
  - If you change the Android package, update the platform string too.

### AI description generation

When adding a comic, the app calls an Appwrite Function execution:

- Function ID: `APPWRITE_FUNCTION_ID_GENERATE_DESC` (or default `comics_description_ai`)
- Payload: `{ title, status, rating }`
- Expected response shape:
  - `{ success: true, description: "..." }`

If you don’t have that function deployed, adding comics will fail at the “generate description” step. (╯°□°）╯︵ ┻━┻

## Project scripts (•_•)>

- `npm start` — start Expo
- `npm run android` — start Expo for Android
- `npm run ios` — start Expo for iOS
- `npm run web` — start Expo for web
- `npm run migrate` — run Appwrite schema migration

## Troubleshooting (¬_¬)

- **Stuck on splash / blank screen**: fonts are loaded before rendering (`app/_layout.js`). If fonts don’t load, the app intentionally returns `null`.
- **Appwrite errors**: verify `APPWRITE_*` IDs are correct and the database/collection exists (run `npm run migrate`).
- **Cloudinary upload failing**: ensure the unsigned upload preset exists and is enabled for your Cloudinary cloud; or update `utils/cloudinary.js`.

## Folder map (quick) (づ｡◕‿‿◕｡)づ

- `app/` — routes (expo-router)
- `utils/appwrite.js` — Appwrite CRUD + function execution
- `utils/cloudinary.js` — image upload + URL optimization helper
- `scripts/` — schema migration scripts
- `styles/global.css` — NativeWind/Tailwind entry
