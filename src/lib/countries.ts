/**
 * Countries, as ISO 3166-1 alpha-2 codes.
 *
 * Codes rather than names, and the names come from `Intl.DisplayNames`, which
 * every browser and Node build already carries. That means the list is a
 * kilobyte instead of ten, it never drifts out of date, and someone reading
 * the app in Spanish sees "Alemania" rather than "Germany" without anyone
 * translating anything.
 */

export const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AL", "AM", "AO", "AR", "AT", "AU", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BN", "BO", "BR", "BS", "BT", "BW", "BY", "BZ",
  "CA", "CD", "CF", "CG", "CH", "CI", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "ER", "ES", "ET",
  "FI", "FJ", "FM", "FR",
  "GA", "GB", "GD", "GE", "GH", "GM", "GN", "GQ", "GR", "GT", "GW", "GY",
  "HK", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IN", "IQ", "IR", "IS", "IT",
  "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MR", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NE", "NG", "NI", "NL", "NO", "NP", "NR", "NZ",
  "OM",
  "PA", "PE", "PG", "PH", "PK", "PL", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SI", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SY", "SZ",
  "TD", "TG", "TH", "TJ", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "US", "UY", "UZ",
  "VA", "VC", "VE", "VN", "VU",
  "WS",
  "YE",
  "ZA", "ZM", "ZW",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

/**
 * The only country whose practitioners can currently be verified.
 *
 * Verification runs against the AHPRA register, which is Australian. A
 * psychologist in Madrid has no AHPRA record to check, and an Australian one
 * generally cannot treat someone in Spain — it is outside their registration
 * and outside their insurance. So this is not a soft preference or a launch
 * order: it is the edge of what the safety model can actually stand behind.
 *
 * When a second country's register is wired up, add it here and the form
 * follows.
 */
export const REFERRAL_COUNTRIES: string[] = ["AU"];

export function referralsAvailableIn(country: string): boolean {
  return REFERRAL_COUNTRIES.includes(country);
}

export function countryName(code: string, locale = "en-AU"): string {
  try {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Alphabetical in the reader's own language, which is not the code order. */
export function sortedCountries(locale = "en-AU"): { code: string; name: string }[] {
  const collator = new Intl.Collator(locale);
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code, locale) })).sort((a, b) =>
    collator.compare(a.name, b.name),
  );
}

/**
 * Best guess at where someone is, from their timezone. Only ever a default —
 * the field is theirs to change, and anything unrecognised simply starts blank
 * rather than guessing wrong.
 */
export function countryFromTimeZone(timeZone: string | undefined | null): string | null {
  if (!timeZone) return null;
  if (timeZone.startsWith("Australia/")) return "AU";
  if (timeZone === "Pacific/Auckland" || timeZone === "Pacific/Chatham") return "NZ";
  if (timeZone === "Europe/London") return "GB";
  if (timeZone === "Europe/Dublin") return "IE";
  if (timeZone === "Europe/Madrid" || timeZone === "Atlantic/Canary") return "ES";
  if (timeZone === "Europe/Lisbon") return "PT";
  if (timeZone.startsWith("America/Sao_Paulo") || timeZone.startsWith("America/Bahia")) return "BR";
  if (timeZone === "Asia/Singapore") return "SG";
  if (timeZone === "Asia/Hong_Kong") return "HK";
  if (timeZone === "Asia/Taipei") return "TW";
  return null;
}
