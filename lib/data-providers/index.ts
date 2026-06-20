import type { DataProviderName } from "@/types/vtu";
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
