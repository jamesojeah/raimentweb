# Project Overview
This is a Next.js e-commerce website for Raiment, a general ecommerce store.
It connects to an existing Firebase Firestore database shared with our iOS and Android apps.

# Tech Stack
- Framework: Next.js (App Router) with TypeScript
- Styling: Tailwind CSS
- Animations: Framer Motion, GSAP, Three.js
- Database: Firebase Firestore (read-only product fetching)
- State: Zustand for cart
- Deployment: Vercel

# Firebase
- The Firestore collection is called `products` (replace with your actual name)
- Do not use Firebase Admin SDK — use client-side firebase/firestore only
- Config is in `lib/firebase.ts`

# Firestore Document Shape
{
  id: string,
  name: string,
  price: number,
  description: string,
  images: string[],
  category: string,
  inStock: boolean,
  tags: string[]
}

# Code Rules
- TypeScript everywhere, no `any` types
- Components go in /components
- Custom hooks go in /hooks
- Keep animations performant — use will-change: transform
- Mobile first — disable cursor effects and reduce 3D on mobile/touch devices
- All animations must respect prefers-reduced-motion

# Cursor
- Custom cursor is a global component in /components/Cursor.tsx
- It uses requestAnimationFrame with lerp damping
- Must work across all pages

# Do Not
- Do not use Firebase Admin SDK
- Do not hardcode Firebase credentials — they live in .env.local
- Do not leave stub/placeholder functions — write full implementations
- Do not use `any` in TypeScript