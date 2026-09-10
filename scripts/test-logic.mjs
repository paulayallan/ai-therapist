/**
 * Runs the pure logic — dates, safety screening, tier entitlements, usage
 * periods, statistics, signals and tool ranking — against fixed inputs.
 * No network, no database, no API key, no build step:
 *
 *   node scripts/test-logic.mjs
 */
import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".logic-test");
const MODULES = ["utils", "date", "types", "safety", "billing", "usage-limits", "tools", "signals", "stats"];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const name of MODULES) {
  const source = readFileSync(join(ROOT, "src", "lib", `${name}.ts`), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  writeFileSync(
    join(OUT, `${name}.mjs`),
    outputText
      .replace(/["']@\/lib\/([\w-]+)["']/g, '"./$1.mjs"')
      .replace(/^\s*import\s+\{[^}]*\}\s+from\s+["'](clsx|tailwind-merge)["'];?\s*$/gm, "")
      .replace(/^\s*import\s+["'][^"']*["'];?\s*$/gm, "")
      .replace(/\bclsx\(/g, "String(")
      .replace(/\btwMerge\(/g, "String("),
  );
}

const load = (name) => import(pathToFileURL(join(OUT, `${name}.mjs`)).href);
const { isLocalDate, shiftLocalDate, localDateRange, daysBetween } = await load("date");
const { screenText, crisisResources, regionFromTimeZone, ALL_REGIONS } = await load("safety");
const { getEffectiveSubscriptionPlan, hasPlanAccess, isStarterTrialActive, starterTrialDaysLeft, webCheckoutUrl } =
  await load("billing");
const { ruleFor, periodKey } = await load("usage-limits");
const { TOOLS, getTool, recommendTools, SOS_SEQUENCE } = await load("tools");
const { deriveSignals } = await load("signals");
const { computeStats, statsToBrief } = await load("stats");
const { PANIC_TRIGGERS, PANIC_LOCATIONS, PANIC_RECOVERY } = await load("types");

let passed = 0;
const check = (label, fn) => {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`  FAIL  ${label}\n        ${error.message}`);
    process.exitCode = 1;
  }
};

/* ------------------------------------------------------------------ dates */

check("rejects malformed and impossible dates", () => {
  assert.equal(isLocalDate("2026-02-30"), false, "30 Feb accepted");
  assert.equal(isLocalDate("2026-13-01"), false);
  assert.equal(isLocalDate("2026-1-1"), false);
  assert.equal(isLocalDate(null), false);
  assert.equal(isLocalDate("2024-02-29"), true, "valid leap day rejected");
});

check("date arithmetic survives months, years and DST", () => {
  assert.equal(shiftLocalDate("2026-01-31", 1), "2026-02-01");
  assert.equal(shiftLocalDate("2026-01-01", -1), "2025-12-31");
  // Australia switches DST on 5 October 2025; UTC-based maths must be immune.
  assert.equal(shiftLocalDate("2025-10-04", 1), "2025-10-05");
  assert.equal(daysBetween("2026-01-01", "2026-03-01"), 59);
  const range = localDateRange("2026-01-10", 5);
  assert.deepEqual(range, ["2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10"]);
});

/* ----------------------------------------------------------------- safety */

check("crisis language blocks AI interpretation", () => {
  for (const phrase of [
    "i keep thinking about killing myself",
    "I don't want to live anymore",
    "thoughts of suicide again",
    "everyone would be better off without me",
    "he hits me and I'm afraid to go home",
  ]) {
    const screen = screenText(phrase);
    assert.equal(screen.level, "crisis", `not flagged: ${phrase}`);
    assert.equal(screen.blocksAi, true, `AI not blocked: ${phrase}`);
  }
});

check("urgent medical language blocks AI interpretation", () => {
  const screen = screenText("I have chest pain and my face is drooping");
  assert.equal(screen.level, "medical");
  assert.equal(screen.blocksAi, true);
});

check("crisis outranks panic when both appear", () => {
  assert.equal(screenText("i'm panicking and i want to die").level, "crisis");
});

check("panic is surfaced but does not block reflection", () => {
  const screen = screenText("I think I'm having a panic attack");
  assert.equal(screen.level, "panic");
  assert.equal(screen.blocksAi, false);
});

check("ordinary difficulty is not over-flagged", () => {
  for (const phrase of [
    "Work was stressful and I'm exhausted",
    "I had an argument with my sister and felt awful",
    "I'm dying to see that film",
    "The presentation killed me",
    "My phone battery is dead",
  ]) {
    assert.equal(screenText(phrase).level, "none", `false positive: ${phrase}`);
  }
});

check("every region returns a usable emergency number first", () => {
  for (const region of ALL_REGIONS) {
    const resources = crisisResources(region);
    assert.ok(resources.lines.length >= 2, `${region} has too few lines`);
    assert.equal(resources.lines[0].emergency, true, `${region} does not lead with emergency`);
    for (const line of resources.lines) assert.ok(line.contact.length > 0);
  }
  assert.ok(crisisResources("XX").lines.length >= 2, "unknown region did not fall back");
});

check("timezone maps to the right emergency service", () => {
  assert.equal(regionFromTimeZone("Australia/Sydney"), "AU");
  assert.equal(regionFromTimeZone("Australia/Perth"), "AU");
  assert.equal(regionFromTimeZone("Pacific/Auckland"), "NZ");
  assert.equal(regionFromTimeZone("Europe/London"), "UK");
  assert.equal(regionFromTimeZone("Europe/Dublin"), "IE");
  assert.equal(regionFromTimeZone("America/Toronto"), "CA");
  assert.equal(regionFromTimeZone("America/New_York"), "US");
  // Never guess: an unmapped zone must not send someone to a wrong number.
  assert.equal(regionFromTimeZone("Asia/Tokyo"), "INTL");
  assert.equal(regionFromTimeZone(undefined), "INTL");
});

/* ---------------------------------------------------------------- billing */

check("an active starter trial grants Premium", () => {
  const sub = {
    plan: "free",
    status: "inactive",
    currentPeriodEnd: null,
    starterTrialEndsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  };
  assert.equal(isStarterTrialActive(sub), true);
  assert.equal(getEffectiveSubscriptionPlan(sub), "premium");
  assert.equal(starterTrialDaysLeft(sub), 3);
});

check("an expired trial falls back to the real plan", () => {
  const sub = {
    plan: "free",
    status: "inactive",
    currentPeriodEnd: null,
    starterTrialEndsAt: new Date(Date.now() - 86400000).toISOString(),
  };
  assert.equal(getEffectiveSubscriptionPlan(sub), "free");
  assert.equal(starterTrialDaysLeft(sub), null);
});

check("an expired paid period drops to free", () => {
  assert.equal(
    getEffectiveSubscriptionPlan({
      plan: "pro",
      status: "active",
      currentPeriodEnd: new Date(Date.now() - 1000).toISOString(),
    }),
    "free",
  );
  assert.equal(
    getEffectiveSubscriptionPlan({
      plan: "pro",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
    }),
    "pro",
  );
});

check("plan ranking is ordered, and null is free", () => {
  assert.equal(getEffectiveSubscriptionPlan(null), "free");
  assert.equal(hasPlanAccess("premium", "pro"), true);
  assert.equal(hasPlanAccess("pro", "premium"), false);
  assert.equal(hasPlanAccess("free", "pro"), false);
});

check("web checkout refuses to invent a URL", () => {
  delete process.env.BILLING_PRO_URL;
  assert.equal(webCheckoutUrl("pro"), null, "returned a URL with none configured");
  process.env.BILLING_PRO_URL = "not-a-url";
  assert.equal(webCheckoutUrl("pro"), null, "accepted a non-URL");
  process.env.BILLING_PRO_URL = "https://pay.example.com/pro";
  assert.equal(webCheckoutUrl("pro"), "https://pay.example.com/pro");
});

/* ------------------------------------------------------------ tier limits */

check("tier limits match the live app exactly", () => {
  const free = { plan: "free", status: "inactive", currentPeriodEnd: null };
  const pro = { plan: "pro", status: "active", currentPeriodEnd: null };
  const premium = { plan: "premium", status: "active", currentPeriodEnd: null };

  assert.deepEqual(ruleFor(free, "support_chat").rule, { kind: "metered", limit: 5, period: "day" });
  assert.deepEqual(ruleFor(free, "journal_analysis").rule, { kind: "metered", limit: 3, period: "day" });
  assert.deepEqual(ruleFor(free, "mood_checkin").rule, { kind: "metered", limit: 3, period: "day" });
  assert.deepEqual(ruleFor(free, "insights_generation").rule, { kind: "metered", limit: 2, period: "day" });
  assert.equal(ruleFor(free, "twin_question").rule.kind, "locked");
  assert.equal(ruleFor(free, "voice_transcription_minutes").rule.upgradeTarget, "pro");

  assert.equal(ruleFor(pro, "support_chat").rule.limit, 200);
  assert.equal(ruleFor(pro, "journal_analysis").rule.limit, 100);
  assert.equal(ruleFor(pro, "insights_generation").rule.limit, 60);
  assert.equal(ruleFor(pro, "voice_transcription_minutes").rule.limit, 30);
  assert.equal(ruleFor(pro, "mood_checkin").rule, null, "check-ins should be unlimited on Pro");
  assert.equal(ruleFor(pro, "twin_question").rule.kind, "locked");

  assert.equal(ruleFor(premium, "support_chat").rule.limit, 800);
  assert.equal(ruleFor(premium, "journal_analysis").rule.limit, 300);
  assert.equal(ruleFor(premium, "insights_generation").rule.limit, 200);
  assert.equal(ruleFor(premium, "twin_question").rule.limit, 80);
  assert.equal(ruleFor(premium, "voice_transcription_minutes").rule.limit, 180);
});

check("usage periods reset on the user's own boundaries", () => {
  assert.equal(periodKey("day", "2026-03-09"), "d:2026-03-09");
  assert.equal(periodKey("month", "2026-03-09"), "m:2026-03");
  // 9 March 2026 is a Monday; the week bucket anchors to it.
  assert.equal(periodKey("week", "2026-03-09"), "w:2026-03-09");
  assert.equal(periodKey("week", "2026-03-15"), "w:2026-03-09");
  assert.notEqual(periodKey("day", "2026-03-09"), periodKey("day", "2026-03-10"));
});

/* ------------------------------------------------------------------ tools */

check("tool library is internally consistent", () => {
  const ids = TOOLS.map((tool) => tool.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate tool ids");
  for (const tool of TOOLS) {
    assert.ok(tool.steps.length >= 3, `${tool.id} has too few steps`);
    assert.ok(tool.minutes > 0 && tool.minutes <= 10, `${tool.id} has an odd duration`);
    assert.ok(["free", "pro", "premium"].includes(tool.tier), `${tool.id} has a bad tier`);
    assert.ok(Object.keys(tool.weights).length > 0, `${tool.id} responds to no signal`);
    assert.ok(tool.defaultReason.text.length > 0, `${tool.id} has no fallback reason`);
    if (tool.breath) assert.ok(tool.breath.cycles > 0 && tool.breath.exhale > 0);
  }
  for (const id of SOS_SEQUENCE) {
    const tool = getTool(id);
    assert.ok(tool, `SOS references a missing tool: ${id}`);
    assert.equal(tool.tier, "free", `SOS uses a paid tool: ${id}`);
  }
});

check("a free user is never shown a wall of locked tools", () => {
  // A signal profile that scores paid tools highest — the exact case that
  // used to return three padlocks.
  const signals = {
    panicPattern: 9, highAnxiety: 9, poorSleep: 10, bodilyStress: 8, overthinking: 8,
    workStress: 10, socialStress: 7, lowMood: 8, selfCriticism: 8, relationshipStrain: 7,
  };
  const free = recommendTools(signals, { allowedTiers: ["free"], limit: 3 });
  assert.equal(free.length, 3);
  assert.equal(free.filter((item) => item.locked).length, 0, "free user shown locked tools");
  assert.equal(free[0].locked, false, "top recommendation is locked");

  const pro = recommendTools(signals, { allowedTiers: ["free", "pro"], limit: 3 });
  assert.ok(pro.every((item) => !item.locked), "pro user shown premium-only tools first");
});

check("recommendations are explained and deterministic", () => {
  const signals = { ...deriveSignals({ checkIns: [], panicEpisodes: [], journal: [], moodLogs: [] }), workStress: 9 };
  const first = recommendTools(signals, { allowedTiers: ["free", "pro", "premium"], limit: 5 });
  const second = recommendTools(signals, { allowedTiers: ["free", "pro", "premium"], limit: 5 });
  assert.deepEqual(first.map((r) => r.tool.id), second.map((r) => r.tool.id), "ranking is unstable");
  for (const item of first) assert.ok(item.reason.text.length > 0, "a recommendation has no reason");
});

/* ---------------------------------------------------------------- signals */

const day = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const iso = (n) => new Date(Date.now() - n * 86400000).toISOString();

check("signals come from the person's own rows", () => {
  const signals = deriveSignals({
    checkIns: [0, 1, 2, 3].map((n) => ({
      id: String(n), local_date: day(n), mood: 2, anxiety_level: 8,
      sleep_quality: "very_poorly", contributing_factors: ["Work"], other_factor: null,
      physical_symptoms: ["Tight chest"], notes: null, created_at: iso(n),
    })),
    panicEpisodes: [
      { id: "p", trigger: "Work stress", location: "Work", recovery_time: "20+ minutes", check_in: "still-anxious", created_at: iso(1) },
    ],
    journal: [],
    moodLogs: [],
  });
  assert.ok(signals.poorSleep >= 8, `sleep signal too low: ${signals.poorSleep}`);
  assert.ok(signals.highAnxiety >= 7, `anxiety signal too low: ${signals.highAnxiety}`);
  assert.ok(signals.workStress > 0, "work never registered");
  assert.ok(signals.panicPattern > 0, "panic never registered");
  for (const value of Object.values(signals)) {
    assert.ok(value >= 0 && value <= 10, `signal out of range: ${value}`);
  }
});

check("old rows outside the window are ignored", () => {
  const signals = deriveSignals({
    checkIns: [{
      id: "old", local_date: day(60), mood: 1, anxiety_level: 10, sleep_quality: "very_poorly",
      contributing_factors: ["Work"], other_factor: null, physical_symptoms: [], notes: null,
      created_at: iso(60),
    }],
    panicEpisodes: [], journal: [], moodLogs: [],
  });
  assert.equal(signals.highAnxiety, 0, "a two-month-old check-in still counted");
});

check("no data yields no signal, and never throws", () => {
  const signals = deriveSignals({ checkIns: [], panicEpisodes: [], journal: [], moodLogs: [] });
  assert.ok(Object.values(signals).every((value) => value === 0));
});

/* ------------------------------------------------------------------ stats */

const checkIn = (n, mood, anxiety, sleep = "okay") => ({
  id: `c${n}`, local_date: day(n), mood, anxiety_level: anxiety, sleep_quality: sleep,
  contributing_factors: [], other_factor: null, physical_symptoms: [], notes: null, created_at: iso(n),
});

check("averages and trends match hand-computed values", () => {
  const stats = computeStats({
    today: day(0), days: 28,
    checkIns: [checkIn(0, 4, 4), checkIn(1, 4, 4), checkIn(2, 2, 8), checkIn(3, 2, 8)],
    panicEpisodes: [], journal: [],
  });
  assert.equal(stats.checkInCount, 4);
  assert.equal(stats.avgMood, 3);
  // Anxiety is stored 1-10 and halved for display: (2+2+4+4)/4 = 3.
  assert.equal(stats.avgAnxiety, 3);
  assert.equal(stats.moodTrend, 2, "oldest-first ordering is wrong");
  assert.equal(stats.anxietyTrend, -2);
});

check("streak counts back and tolerates a not-yet-done today", () => {
  assert.equal(
    computeStats({ today: day(0), days: 28, checkIns: [checkIn(1, 3, 6), checkIn(2, 3, 6), checkIn(3, 3, 6)], panicEpisodes: [], journal: [] }).streak,
    3,
    "yesterday-anchored streak miscounted",
  );
  assert.equal(
    computeStats({ today: day(0), days: 28, checkIns: [checkIn(0, 3, 6), checkIn(2, 3, 6)], panicEpisodes: [], journal: [] }).streak,
    1,
    "a gap did not break the streak",
  );
});

check("correlation is withheld below five paired days", () => {
  const four = [checkIn(0, 4, 2, "very_well"), checkIn(1, 3, 6, "okay"), checkIn(2, 2, 8, "poorly"), checkIn(3, 1, 10, "very_poorly")];
  assert.equal(
    computeStats({ today: day(0), days: 28, checkIns: four, panicEpisodes: [], journal: [] }).sleepAnxietyLink,
    null,
    "reported a correlation from four points",
  );
  const six = [...four, checkIn(4, 5, 2, "very_well"), checkIn(5, 1, 10, "very_poorly")];
  const link = computeStats({ today: day(0), days: 28, checkIns: six, panicEpisodes: [], journal: [] }).sleepAnxietyLink;
  assert.ok(link !== null && link < -0.8, `expected a strong negative link, got ${link}`);
});

check("the series has one slot per day, gaps left null", () => {
  const stats = computeStats({
    today: day(0), days: 28, checkIns: [checkIn(0, 4, 4), checkIn(5, 3, 6)], panicEpisodes: [], journal: [],
  });
  assert.equal(stats.series.length, 28);
  assert.equal(stats.series[27].mood, 4);
  assert.equal(stats.series[26].mood, null, "a missing day was filled in");
});

check("SOS stats and the model brief only quote real figures", () => {
  const panicEpisodes = [
    { id: "1", trigger: "Work stress", location: "Work", recovery_time: "5-10 minutes", check_in: "calmer", created_at: iso(1) },
    { id: "2", trigger: "Work stress", location: "Home", recovery_time: "1-5 minutes", check_in: "calmer", created_at: iso(2) },
    { id: "3", trigger: "Overthinking", location: "Home", recovery_time: "20+ minutes", check_in: "still-anxious", created_at: iso(3) },
  ];
  const stats = computeStats({ today: day(0), days: 28, checkIns: [checkIn(0, 3, 6)], panicEpisodes, journal: [] });
  assert.equal(stats.panicCount, 3);
  assert.equal(stats.topTrigger.trigger, "Work stress");
  assert.equal(stats.topTrigger.count, 2);
  assert.equal(stats.calmerRate, 0.67);

  const brief = statsToBrief(stats);
  assert.match(brief, /SOS sessions: 3/);
  assert.ok(!brief.includes("undefined") && !brief.includes("NaN"), "brief leaked a bad value");
});

check("empty input never throws", () => {
  const stats = computeStats({ today: day(0), days: 28, checkIns: [], panicEpisodes: [], journal: [] });
  assert.equal(stats.avgMood, null);
  assert.equal(stats.streak, 0);
  assert.ok(statsToBrief(stats).length > 0);
});

/* ------------------------------------------------------- schema agreement */

check("panic values match the database's check constraints", () => {
  assert.deepEqual([...PANIC_TRIGGERS], [
    "Work stress", "Social situation", "Relationship", "Overthinking", "Physical symptoms", "Unknown",
  ]);
  assert.deepEqual([...PANIC_LOCATIONS], ["Home", "Work", "Outside", "With people", "Alone"]);
  assert.deepEqual([...PANIC_RECOVERY], ["1-5 minutes", "5-10 minutes", "10-20 minutes", "20+ minutes"]);
});

rmSync(OUT, { recursive: true, force: true });

console.log(
  process.exitCode ? `\n${passed} passed, with failures above.` : `All ${passed} logic checks passed.`,
);
