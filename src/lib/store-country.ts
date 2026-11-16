import type { Options } from "itunes-store-api";

export type StoreCountry = Options["country"];

export function storeCountryFromLanguages(header = ""): StoreCountry {
  // browsers list languages by preference, so the q weights can be ignored
  for (const entry of header.split(",")) {
    try {
      const locale = new Intl.Locale(entry.split(";")[0].trim());
      const region = locale.region ?? locale.maximize().region;
      if (region && /^[A-Z]{2}$/.test(region)) return region.toLowerCase() as StoreCountry;
    } catch {}
  }
  return "us";
}
