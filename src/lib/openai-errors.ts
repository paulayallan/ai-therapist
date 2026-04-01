export function getOpenAIErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (message.includes("429") || message.includes("quota") || message.includes("rate limit")) {
    return "AI support is temporarily unavailable because the OpenAI usage limit has been reached. Try again later.";
  }

  if (message.includes("401") || message.includes("invalid api key")) {
    return "AI support is not configured correctly right now. Check the OpenAI API key and try again.";
  }

  if (message.includes("billing")) {
    return "AI support is paused because OpenAI billing is not active on this account.";
  }

  return fallback;
}
