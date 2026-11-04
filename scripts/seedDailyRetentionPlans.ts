// One-time/occasional CLI runner for lib/vtu/seedDailyRetentionPlans.ts.
//
// Usage: npm run seed:daily-retention-plans

import { seedDailyRetentionPlans } from "../lib/vtu/seedDailyRetentionPlans";

async function main() {
  const result = await seedDailyRetentionPlans();
  console.log(
    `Backfilled validityGroup on ${result.backfilled} existing doc(s). ` +
      `Updated ${result.updatedExisting} existing daily/2-day/3-day plan(s). ` +
      `Created ${result.createdNew} new plan(s).`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
