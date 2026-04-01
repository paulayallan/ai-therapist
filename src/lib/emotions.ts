export type EmotionalState = "calm" | "anxious" | "sad" | "angry" | "overwhelmed";

const emotionRules: Array<{ state: EmotionalState; patterns: RegExp[] }> = [
  {
    state: "overwhelmed",
    patterns: [/overwhelmed/i, /can't handle/i, /too much/i, /spiral/i, /falling apart/i]
  },
  {
    state: "anxious",
    patterns: [/anxious/i, /panic/i, /worried/i, /nervous/i, /overthink/i, /stress/i]
  },
  {
    state: "sad",
    patterns: [/sad/i, /lonely/i, /hurt/i, /heartbroken/i, /depressed/i, /crying/i]
  },
  {
    state: "angry",
    patterns: [/angry/i, /furious/i, /mad/i, /resent/i, /annoyed/i]
  }
];

export function detectEmotionalState(text: string): EmotionalState {
  for (const rule of emotionRules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.state;
    }
  }

  return "calm";
}
