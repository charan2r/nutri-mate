# NutriMate

NutriMate uses **hosted Gemma**, an open-weight model, to generate meal plans and replacement recipes. The React Native / Expo app connects to a NestJS backend and PostgreSQL. It includes profile onboarding, meal tracking, feedback, recipe details, grocery lists, and plan history.

## Why open weights matter

Gemma performs the central generation tasks. A small provider interface separates inference from planning and validation, making another Gemma deployment possible without changing the mobile app. The default deployment runs Gemma through Google's hosted API; it requires internet and sends profile constraints and relevant feedback to Google. This is not a claim of local privacy, offline operation, free inference, or fine-tuning.

Application code is MIT licensed. Model usage follows the selected Gemma model's terms; the application license does not license model weights.

## Validation behavior

- Responses must contain exactly the requested days and meal slots, with complete ingredients, preparation steps, nutrition, prices, and preparation times. Missing values, non-finite numbers, unknown meal IDs, and partial output are rejected instead of filled with invented data.
- Catalogue IDs are resolved to trusted stored names, ingredients, nutrition, prices, preparation steps, allergens, and tags **before** validation and total calculation. Only active, verified records with nutrition references are eligible.
- Every day must meet its calorie target within 10%. Reported meal energy must be within 25% of `4 × protein + 4 × carbohydrates + 9 × fat`; this is a plausibility check, not independent nutritional verification.
- Every day must stay within its budget. Unknown prices are rejected; a zero budget is not interpreted as unlimited.
- Allergens, excluded ingredients, diet constraints, preparation limits, and disliked foods are checked. Common aliases such as groundnut/peanut are recognized. Ingredient checks depend on complete, accurate information and do not establish absence of cross-contact or all possible hidden allergens.
- Generated recipes are marked **unverified** even when constraint checks pass. Strict calorie mode requires source-backed catalogue meals.
- Invalid plans are not persisted as usable plans. The model receives repair instructions during bounded retries.
- Alternatives are checked against the complete plan. Submission revalidates against current preferences; the server does not trust the mobile client's choice.
- Meal swaps use a database transaction and lock the parent plan. Archiving, saving the replacement, recalculating serving-adjusted totals, refreshing validation, and rebuilding groceries succeed or fail together.
- Grocery purchase marks survive rebuilds when ingredient quantities are unchanged. Grocery totals use the plan's serving-adjusted meal cost estimates. Ingredient-level prices are unavailable; totals are not checkout quotes.

Calories, protein, carbohydrates, fat, quantities, and estimated costs are **per declared serving**. Daily and plan totals multiply by scheduled servings. Prices are estimates, not guaranteed market prices. The quality score measures the checks described above; it is not a clinical safety certificate.

## Preference memory

Meal feedback stays in PostgreSQL. Generation uses the latest recorded opinion per dish, preventing an older dislike from overriding newer feedback. Both current and legacy reason tags are supported. `GET /api/feedback/preferences` exposes the derived likes, dislikes, and notes. Editing or deleting the underlying feedback changes subsequent memory. Explicit allergies and exclusions stay in authoritative profile fields.

## Run locally

Use Node.js **22.13 or newer**, npm, PostgreSQL, and a Google AI Studio API key. Hosted Gemma needs no Ollama or local model installation.

1. Create a PostgreSQL database. Apply `backend/docs/schema.txt` to a **new empty database** using your database SQL editor. It contains the existing Nutrio schema; application entities are not automatically synchronized.
2. In `backend`, run `npm ci` and copy `.env.example` to `.env`. Set:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
   GEMMA_API_KEY=your-google-ai-studio-key
   GEMMA_MODEL=gemma-4-26b-a4b-it
   GEMMA_TIMEOUT_MS=120000
   ```

   The backend uses Google's hosted `generateContent` endpoint and permits only Gemma model names. Existing `GOOGLE_API_KEY` or `GEMINI_API_KEY` settings are accepted as credential fallbacks; they do not select a Gemini model. The current database connection configuration expects TLS.

3. Run `npm run start:dev`. The API is available at port 3000 under `/api`.
4. In `frontend`, run `npm ci`, create `.env`, and set:

   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:3000/api
   ```

5. Run `npm start` and open the app in Expo Go or the web preview. Enter actual profile data before generating a plan. Budget defaults to LKR 2,000; allergies and ingredient exclusions start empty.

The app is configured with the `kemamate` URL scheme and Android package `com.charan25.kemamate`. Its old EAS project association was removed; link your own EAS project before a native release. Authentication storage uses new Kema Mate keys, so existing Nutrio installations require signing in again.

## Curated meal catalogue

A trusted database label must be supported by real nutrition evidence. This revision does not invent a verified Sri Lankan food dataset.

Prepare a JSON array following `docs/catalogue.template.json`. Supply actual per-serving nutrition, complete ingredients and instructions, local prices, a price observation date, nutrition source/reference, and curator review. Then run from `backend`:

```sh
npm run catalogue:import -- ../docs/my-reviewed-meals.json
```

The importer validates the whole input before writing, updates matching meal names/types in a transaction, and requires references and explicit review before marking a record verified. Keep unsourced meals unverified. The template intentionally contains null placeholders and cannot be imported until filled. Strict calorie mode will reject generation until suitable verified meals are available.

## Verify changes

```sh
cd backend
npm test -- --runInBand
npm run build
cd ../frontend
npx tsc --noEmit
npm run build:web
```

Regression coverage includes incomplete model output, hosted model selection, missing nutrition and prices, invalid catalogue IDs, authoritative database values, daily limits, allergen aliases, preparation limits, current preference memory, replacement filtering, serving-adjusted totals, and unverified generated replacements. Unit tests use mocked inference and database operations; live hosted inference and PostgreSQL transactions need separate integration testing with configured credentials.

## Friend demo and challenge write-up

Follow `docs/friend-demo.md` to hand the app over and record real feedback. Start with a one-day plan, demonstrate a meal swap and updated groceries, then show a preference affecting the next plan. Do not invent a friend's measurements, allergies, quotes, or outcomes.
