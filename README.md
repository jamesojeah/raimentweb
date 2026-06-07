# Raiment — Elevated Fashion E-Commerce

A production-ready, visually premium e-commerce storefront for the Raiment fashion brand.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Framer Motion** — page transitions, scroll animations, card effects
- **GSAP + ScrollTrigger** — intro loader, split text, parallax
- **Three.js** — 3D hero canvas
- **Zustand** — persistent cart state
- **Firebase Firestore** — product data (client-side, read-only)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Your credentials are already in `.env.local`. To change them, edit that file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Firestore collection

Products collection must be named `products`. Each document:

```json
{
  "name": "string",
  "price": 120.00,
  "description": "string",
  "images": ["https://..."],
  "category": "string",
  "inStock": true,
  "tags": ["tag1", "tag2"]
}
```

### 4. Firebase Security Rules

Allow public reads on the products collection:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{doc} {
      allow read: if true;
    }
  }
}
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Pages

| Route | Description |
|---|---|
| `/` | Home: loader → hero → featured products → brand story → newsletter |
| `/products` | Full catalogue with category filters and sort |
| `/products/[id]` | Product detail with image gallery and related items |
| `/cart` | Cart with quantity controls and order summary |

## Key Files

| File | Purpose |
|---|---|
| `lib/firebase.ts` | Firebase app init |
| `lib/firestore.ts` | Product fetch utilities |
| `store/cartStore.ts` | Zustand cart (persisted to localStorage) |
| `components/Cursor.tsx` | Custom cursor with lerp damping |
| `components/Loader.tsx` | GSAP intro loader (once per session) |
| `components/HeroScene.tsx` | Three.js 3D canvas |
| `components/ProductCard.tsx` | CSS 3D tilt card with gloss layer |
| `components/MagneticButton.tsx` | Magnetic hover CTA |
| `components/SplitText.tsx` | GSAP character scroll reveal |

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in project settings
4. Deploy
