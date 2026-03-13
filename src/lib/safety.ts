const crisisPatterns = [
  /suicide/i,
  /kill myself/i,
  /end my life/i,
  /self[- ]harm/i,
  /hurt myself/i,
  /don'?t want to live/i,
  /overdose/i
];

export function detectCrisisLanguage(text: string) {
  return crisisPatterns.some((pattern) => pattern.test(text));
}

export function getCrisisResources() {
  return {
    title: "Immediate support matters",
    description:
      "This tool is not a replacement for a licensed clinician or emergency care. If you may act on thoughts of self-harm, contact emergency services now or reach out to a crisis line.",
    resources: [
      "US & Canada: Call or text 988",
      "UK & ROI: Samaritans 116 123",
      "Australia: Lifeline 13 11 14",
      "If danger is immediate, call local emergency services"
    ]
  };
}
