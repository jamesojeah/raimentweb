// One-time/occasional CLI runner for lib/vtu/seedDataPlans.ts. The same
// logic is also exposed as a protected admin route
// (app/api/admin/seed-data-plans/route.ts) for re-seeding after deploy
// without shell access.
//
// Usage: npm run seed:data-plans
// Requires FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 in the environment — run with
// `tsx --env-file=.env.local` (wired into the npm script already) to load it
// from .env.local like Next.js does.

import { seedDataPlans } from "../lib/vtu/seedDataPlans";

async function main() {
  const result = await seedDataPlans();

  console.log(`Seeded ${result.plansWritten} plan(s): ${result.activePlans} active.`);
  if (result.inactivePlans.length > 0) {
    console.log("Inactive (skipped from Buy screens until fixed):");
    for (const plan of result.inactivePlans) {
      console.log(`  - ${plan.id} (${plan.planName}): ${plan.reason}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
