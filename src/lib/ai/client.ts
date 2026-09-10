import "server-only";

import OpenAI from "openai";

/**
 * One model per job, each overridable by environment. Cheap models do
 * extraction and summarising; the expensive one is reserved for the two
 * surfaces a person actually talks to.
 */
export type AiTask =
  | "coach"
  | "journal"
  | "insights"
  | "twin_profile"
  | "twin_response"
  | "memory"
  | "observations"
  | "mirror"
  | "science"
  | "transcribe";

const DEFAULTS: Record<AiTask, string> = {
  coach: "gpt-5-mini",
  journal: "gpt-5-mini",
  insights: "gpt-5-mini",
  twin_profile: "gpt-5-mini",
  twin_response: "gpt-5",
  memory: "gpt-5-mini",
  observations: "gpt-5-mini",
  mirror: "gpt-5-mini",
  science: "gpt-5-mini",
  transcribe: "gpt-4o-mini-transcribe",
};

const ENV_KEYS: Record<AiTask, string[]> = {
  coach: ["OPENAI_MODEL_COACH"],
  journal: ["OPENAI_MODEL_JOURNAL"],
  insights: ["OPENAI_MODEL_INSIGHTS"],
  twin_profile: ["OPENAI_MODEL_TWIN_PROFILE"],
  twin_response: ["OPENAI_MODEL_TWIN_RESPONSE", "OPENAI_MODEL_TWIN"],
  memory: ["OPENAI_MODEL_MEMORY"],
  observations: ["OPENAI_MODEL_INSIGHTS"],
  mirror: ["OPENAI_MODEL_INSIGHTS"],
  science: ["OPENAI_MODEL_INSIGHTS"],
  transcribe: ["OPENAI_MODEL_TRANSCRIBE"],
};

export function modelFor(task: AiTask): string {
  for (const key of ENV_KEYS[task]) {
    const value = process.env[key];
    if (value) return value;
  }
  // OPENAI_MODEL is a global override for everything except transcription,
  // which needs an audio-capable model.
  if (task !== "transcribe" && process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL;
  return DEFAULTS[task];
}

/**
 * A function rather than a constant: module-level env reads can be evaluated
 * at build time, which would freeze this as `false` on a deployment where the
 * key is set afterwards.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

let cached: OpenAI | null = null;

/**
 * Returns null rather than throwing when no key is set. Every caller has a
 * deterministic fallback, so the app stays usable without OpenAI.
 */
export function getOpenAI(): OpenAI | null {
  if (!isAiConfigured()) return null;
  if (!cached) {
    cached = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 1 });
  }
  return cached;
}

/**
 * Tried in order when the configured model name is not one this account can
 * reach. Model names change under us — a rename at OpenAI should degrade the
 * answer slightly, not take the feature away from someone mid-sentence.
 */
const FALLBACK_MODELS = ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"] as const;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * The gpt-5 and o-series models reason before they answer, and those reasoning
 * tokens are billed against the same `max_completion_tokens` budget as the
 * reply. Ask for 900 and the model can spend all 900 thinking and hand back an
 * empty string — a success, as far as the API is concerned, with nothing in it.
 * So these models get their answer budget plus room to think, and are told to
 * think briefly: someone anxious does not want to watch a spinner while a model
 * deliberates about a four-sentence reply.
 */
const REASONING_MODEL = /^(gpt-5|o[1345])/i;
const REASONING_HEADROOM = 1400;

function isUnknownModel(error: unknown): boolean {
  const err = error as { status?: number; code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code === "model_not_found") return true;
  if (err.status !== 404 && err.status !== 400) return false;
  return /model/i.test(err.message ?? "");
}

/**
 * One JSON completion, with the two things every caller needs and none of
 * them should repeat: the real error printed to the server log (routes
 * deliberately swallow it so the person never sees a stack trace), and a
 * retry on a different model when the configured name has gone away.
 *
 * Throws on genuine failure so each route keeps its own fallback behaviour.
 */
export async function completeJson(options: {
  task: AiTask;
  messages: ChatMessage[];
  maxTokens: number;
}): Promise<string | null> {
  const client = getOpenAI();
  if (!client) return null;

  const first = modelFor(options.task);
  const chain = [first, ...FALLBACK_MODELS.filter((name) => name !== first)];

  let lastError: unknown = null;

  for (const model of chain) {
    const reasons = REASONING_MODEL.test(model);
    const budget = reasons ? options.maxTokens + REASONING_HEADROOM : options.maxTokens;

    try {
      // Two attempts on the same model: if it thought its way through the
      // whole budget and returned nothing, give it more room once.
      for (const tokens of [budget, budget * 2]) {
        const params = {
          model,
          response_format: { type: "json_object" as const },
          max_completion_tokens: tokens,
          messages: options.messages,
          ...(reasons ? { reasoning_effort: "low" as const } : {}),
        };

        const completion = await client.chat.completions.create(params);
        const choice = completion.choices[0];
        const content = choice?.message?.content ?? null;

        if (content && content.trim()) {
          if (model !== first) {
            console.warn(
              `[mentara/ai] "${first}" is unavailable on this account — used "${model}" for ${options.task}.`,
            );
          }
          return content;
        }

        console.warn(
          `[mentara/ai] ${options.task}: "${model}" returned empty content (finish_reason=${choice?.finish_reason}, budget=${tokens}, reasoning tokens=${completion.usage?.completion_tokens_details?.reasoning_tokens ?? "?"}).`,
        );

        // Only worth retrying when it ran out of room. Anything else will
        // come back empty again.
        if (choice?.finish_reason !== "length") break;
      }

      return null;
    } catch (cause) {
      lastError = cause;
      if (!isUnknownModel(cause)) break;
    }
  }

  console.error(`[mentara/ai] ${options.task} failed:`, lastError);
  throw lastError;
}

/**
 * Called when a reply parsed as JSON but did not match the schema. The person
 * gets a plain "try again"; this is how you find out why.
 */
export function logSchemaMiss(task: AiTask, raw: string | null, issues: unknown): void {
  console.warn(
    `[mentara/ai] ${task}: reply did not match the expected shape.\n  raw: ${
      raw ? raw.slice(0, 400) : "(empty)"
    }\n  issues:`,
    issues,
  );
}

/** Parses a model response that should be a JSON object, tolerating stray text. */
export function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return null;
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}
