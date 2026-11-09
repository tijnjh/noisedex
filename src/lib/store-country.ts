import type { Options } from "itunes-store-api";

export type StoreCountry = Options["country"];

export function storeCountryFromLanguages(header = ""): StoreCountry {
  const languages = header
    .split(",")
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const quality = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      return { tag, weight: quality ? Number(quality.trim().slice(2)) : 1 };
    })
    .filter(({ weight }) => weight > 0 && weight <= 1)
    .sort((a, b) => b.weight - a.weight);

  for (const { tag } of languages) {
    try {
      const locale = new Intl.Locale(tag);
      const region = locale.region ?? locale.maximize().region;
      if (region && /^[A-Z]{2}$/.test(region))
        return region.toLowerCase() as StoreCountry;
    } catch {}
  }
  return "us";
}
