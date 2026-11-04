import type { DataPlan, DataProviderName } from "@/types/vtu";
import type { DataProvider } from "./DataProvider";
import { PeyflexProvider } from "./PeyflexProvider";
import { CheapDataHubProvider } from "./CheapDataHubProvider";

export type {
  DataProvider,
  ProviderPlan,
  ProviderPurchaseResult,
  ProviderStatusResult,
  BuyDataParams,
  BuyAirtimeParams,
} from "./DataProvider";

const PROVIDERS: Record<DataProviderName, DataProvider> = {
  peyflex: new PeyflexProvider(),
  cheapdatahub: new CheapDataHubProvider(),
};

function getPrimaryProviderName(): DataProviderName {
  const name = process.env.PRIMARY_DATA_PROVIDER as DataProviderName | undefined;
  if (name === "peyflex" || name === "cheapdatahub") return name;
  return "peyflex";
}

export function getDataProvider(name: DataProviderName): DataProvider {
  return PROVIDERS[name];
}

export function getPrimaryDataProvider(): DataProvider {
  return PROVIDERS[getPrimaryProviderName()];
}

export function getFallbackDataProvider(): DataProvider {
  const primary = getPrimaryProviderName();
  const fallback: DataProviderName = primary === "peyflex" ? "cheapdatahub" : "peyflex";
  return PROVIDERS[fallback];
}

// Per-plan provider order: whichever provider is actually cheaper for THIS
// plan is tried first, not a single global default - Peyflex and
// CheapDataHub aren't uniformly cheaper than each other across the catalog.
// A provider only counts as "usable" if it has both a cost and a mapped
// bundle/plan id; if only one provider has a usable mapping, it's primary
// regardless of cost (the other will just fail-fast and is never reached).
export function selectProvidersForDataPlan(
  plan: Pick<DataPlan, "peyflexCost" | "peyflexPlanId" | "cheapdatahubCost" | "cheapdatahubPlanId">
): { primary: DataProviderName; fallback: DataProviderName } {
  const peyflexUsable = plan.peyflexCost !== null && plan.peyflexPlanId !== null;
  const cheapdatahubUsable = plan.cheapdatahubCost !== null && plan.cheapdatahubPlanId !== null;

  if (peyflexUsable && cheapdatahubUsable) {
    return plan.cheapdatahubCost! <= plan.peyflexCost!
      ? { primary: "cheapdatahub", fallback: "peyflex" }
      : { primary: "peyflex", fallback: "cheapdatahub" };
  }
  if (cheapdatahubUsable) return { primary: "cheapdatahub", fallback: "peyflex" };
  if (peyflexUsable) return { primary: "peyflex", fallback: "cheapdatahub" };

  // Neither provider has a usable mapping (shouldn't happen for an active
  // plan) - fall back to the configured global default rather than guessing.
  return { primary: getPrimaryDataProvider().name, fallback: getFallbackDataProvider().name };
}
