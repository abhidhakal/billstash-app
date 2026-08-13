# BillStash

BillStash turns receipts into a searchable personal spending history. Scan a receipt, verify the extracted details, and track spending by month, category, and merchant.

## Local setup

```bash
npm install
npm run dev
```

Create a `.env` file with the Firebase web-app values: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and optionally `VITE_FIREBASE_MEASUREMENT_ID`.

Set `VITE_OCR_LANGUAGES=eng` by default. Tesseract language codes can be combined, for example `eng+nep`, when the corresponding trained data is available.

Enable Email/Password and Google authentication in Firebase. Firestore and Storage rules should restrict each user to their own `users/{uid}` data.

Deploy rules with the Firebase CLI: `firebase deploy --only firestore:rules,storage`.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run preview` — preview the production build

## Roadmap

Improve OCR confidence and field verification; add budgets, recurring bills, reminders, month-over-month insights, server-side filtering, pagination, and automated tests.
