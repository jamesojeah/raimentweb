// One-time CLI runner for lib/vtu/applyCheapDataHubCosts.ts.
//
// Usage: npm run apply:cheapdatahub-costs

import { applyCheapDataHubCosts } from "../lib/vtu/applyCheapDataHubCosts";

async function main() {
  const result = await applyCheapDataHubCosts();
  console.log(`Matched ${result.matched} plan(s) to a CheapDataHub bundle.`);
  if (result.skippedMissing.length > 0) {
    console.log("Doc ids not found (catalog may have changed since matching):");
    for (const id of result.skippedMissing) {
      console.log(`  - ${id}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Apply failed:", err);
    process.exit(1);
  });
