export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT - Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

const LOCAL_ZONE_STATE: NigerianState = "Delta";
const LOCAL_ZONE_FEE = 2500;
const STANDARD_ZONE_FEE = 4000;

// Matches "Book"/"Books"/"Worksheet"/"Worksheets" as whole words (e.g. "Kids Learning Worksheet"),
// but not as part of another word (e.g. "Notebook").
const DIGITAL_PRODUCT_PATTERN = /\b(books?|worksheets?)\b/i;

// Digital products (e-books, worksheets) are delivered as soft copies and never shipped.
export function isDigitalProduct(name: string): boolean {
  return DIGITAL_PRODUCT_PATTERN.test(name);
}

export function getShippingFee(state: string, items: { name: string }[]): number {
  if (items.length > 0 && items.every((item) => isDigitalProduct(item.name))) {
    return 0;
  }
  return state === LOCAL_ZONE_STATE ? LOCAL_ZONE_FEE : STANDARD_ZONE_FEE;
}
