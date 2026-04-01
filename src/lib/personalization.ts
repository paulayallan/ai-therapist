import { getAccountMemory, getMentalProfile, getRecentSessionSummaries, getStoredAITwinProfile, getSubscription } from "@/lib/data";

type PersonalizationSnapshot = {
  userName: string;
  therapistStyle: string;
  currentMood: number;
  currentPlan: string;
  commonTriggers: string[];
  memorySummary: string;
  promptContext: string;
};

export async function buildPersonalizationSnapshot(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const userName = getPreferredUserName(user);
  const [profile, summaries, accountMemory, subscription, aiTwinProfile] = await Promise.all([
    getMentalProfile(user.id),
    getRecentSessionSummaries(user.id),
    getAccountMemory(user.id),
    getSubscription(user.id),
    getStoredAITwinProfile(user.id)
  ]);

  const therapistStyle = profile?.therapistStyle ?? accountMemory?.therapistStyle ?? "Practical Coach";
  const currentMood = profile?.currentMood ?? accountMemory?.lastMood ?? 5;
  const currentPlan = subscription.plan;
  const commonTriggers = accountMemory?.commonTriggers ?? [];
  const memorySummary = accountMemory?.memorySummary ?? "";

  const sections: string[] = [
    `Current user context:
- user_name: ${userName}
- therapist_style: ${therapistStyle}
- current_mood: ${currentMood}/10
- subscription_plan: ${currentPlan}`
  ];

  if (profile?.bringsYouHere.length) {
    sections.push(`Why they joined Mentara:\n- ${profile.bringsYouHere.join("\n- ")}`);
  }
  if (profile?.goals.length) {
    sections.push(`Current goals:\n- ${profile.goals.join("\n- ")}`);
  }
  if (memorySummary) {
    sections.push(`Persistent account memory:\n- ${memorySummary}`);
  }
  if (accountMemory?.emotionalThemes.length) {
    sections.push(`Common emotional themes:\n- ${accountMemory.emotionalThemes.join("\n- ")}`);
  }
  if (accountMemory?.recurringIssues.length) {
    sections.push(`Recurring issues:\n- ${accountMemory.recurringIssues.join("\n- ")}`);
  }
  if (commonTriggers.length) {
    sections.push(`Common triggers:\n- ${commonTriggers.join("\n- ")}`);
  }
  if (summaries.length) {
    const history = summaries
      .slice(0, 5)
      .map(
        (summary) =>
          `- Topic: ${summary.mainIssue}; tone: ${summary.emotionalState}; triggers: ${
            summary.possibleTriggers.join(", ") || "not clear"
          }; focus: ${summary.suggestedFocusArea || "ongoing regulation"}`
      )
      .join("\n");
    sections.push(`Recent session history:\n${history}`);
  }
  if (aiTwinProfile?.profileSummary) {
    sections.push(`Observed AI Twin profile:\n- ${aiTwinProfile.profileSummary}`);
  }

  return {
    userName,
    therapistStyle,
    currentMood,
    currentPlan,
    commonTriggers,
    memorySummary,
    promptContext: sections.join("\n\n")
  } satisfies PersonalizationSnapshot;
}

function getPreferredUserName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const firstName = user.user_metadata?.first_name;
  if (typeof firstName === "string" && firstName.trim()) {
    return firstName.trim();
  }

  return user.email?.split("@")[0] || "the user";
}
