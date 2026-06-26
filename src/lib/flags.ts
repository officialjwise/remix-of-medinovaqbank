/** Convert an ISO-3166 alpha-2 country code into its emoji flag (zero-dependency). */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  const cc = code.toUpperCase();
  const A = 0x1f1e6;
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65), A + (cc.charCodeAt(1) - 65));
}

const NAME_TO_CODE: Record<string, string> = {
  Ghana: "GH",
  Nigeria: "NG",
  "United Kingdom": "GB",
  "United States": "US",
  Kenya: "KE",
  "South Africa": "ZA",
  Canada: "CA",
  India: "IN",
};

export function flagForCountry(name: string): string {
  return countryFlag(NAME_TO_CODE[name] ?? "");
}
