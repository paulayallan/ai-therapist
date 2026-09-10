/**
 * Science check — explanations of what is actually happening in the body
 * during anxiety and panic.
 *
 * These ship with the app rather than being generated, for two reasons: they
 * work with no API key, and an explanation of a mechanism should be written
 * once and checked, not improvised per request.
 *
 * Two rules run through all of them:
 *  - Explain the mechanism; do not reassure by overstating certainty. "This is
 *    harmless" is a medical claim and is never made here.
 *  - Where a symptom can have a physical cause, say plainly that it is worth a
 *    doctor ruling that out.
 */

export type ScienceTopic = {
  id: string;
  question: string;
  tag: string;
  explanation: string[];
  takeaway: string;
  caveat: string;
};

export const SCIENCE_TOPICS: ScienceTopic[] = [
  {
    id: "tight-chest",
    question: "Why does my chest feel tight?",
    tag: "Body sensations",
    explanation: [
      "When your body reads a situation as threatening, breathing changes shape before you notice it. It moves up out of the diaphragm and into the chest and shoulders — smaller, faster breaths using muscles that were never built for continuous work.",
      "Those muscles fatigue quickly, and fatigued muscles ache. That ache is often what people describe as tightness, pressure, or a band around the chest.",
      "There is a second layer on top of the first. Anxiety turns up your attention to internal sensations — the technical word is interoception. A tightness you would have ignored on an ordinary Tuesday becomes the thing you cannot stop monitoring, and monitoring it keeps the muscles engaged.",
      "This is why slowing the out-breath tends to help more than trying to take a deep breath in. A longer exhale lets the diaphragm take over again, and the accessory muscles get to stop working.",
    ],
    takeaway:
      "Chest tightness during anxiety is usually tired breathing muscles plus turned-up attention — which is why it eases from the breath out, not the breath in.",
    caveat:
      "Chest pain, pressure or tightness can also be cardiac or respiratory, and anxiety does not rule that out. If it is new, severe, comes with exertion, or spreads to your arm, jaw or back, treat it as a medical emergency. If it recurs, get it checked properly once so you are not diagnosing yourself each time.",
  },
  {
    id: "racing-heart",
    question: "Why is my heart racing when nothing is happening?",
    tag: "Body sensations",
    explanation: [
      "Your threat system does not wait for evidence. It works on speed, because for most of human history the cost of reacting to a false alarm was small and the cost of missing a real one was not.",
      "When it fires, adrenaline and noradrenaline enter the bloodstream within seconds. Heart rate rises, the heart contracts harder, and blood is redirected toward large muscles. This happens whether the trigger is a car swerving at you or a thought about next Tuesday — the system cannot tell the difference between an actual event and a vividly imagined one.",
      "Nothing has to be happening around you for this to occur. The trigger can be a memory, an anticipation, a sensation you noticed and interpreted, or a slightly bad night's sleep leaving the whole system more reactive.",
      "The uncomfortable part is that noticing the racing itself often adds to it. Attention on the heartbeat is itself a mild stressor, which is one reason grounding — deliberately moving attention outward — tends to work.",
    ],
    takeaway:
      "A racing heart with no visible cause is usually your threat system responding to a thought rather than an event. It is doing its job, badly calibrated.",
    caveat:
      "Palpitations can also come from thyroid problems, anaemia, arrhythmias, caffeine, alcohol, some medications, and other physical causes. If this is frequent or new, it is worth one proper medical check rather than years of wondering.",
  },
  {
    id: "panic-curve",
    question: "Why does panic peak and then come down?",
    tag: "Panic",
    explanation: [
      "Panic feels open-ended while you are inside it — as though it could keep climbing forever. It does not, and the reason is chemical rather than psychological.",
      "The surge is driven by adrenaline, which the body metabolises and clears. It cannot be sustained indefinitely because the supply and the receptors both have limits. Most panic episodes peak within about ten minutes and then decline, whatever you do or do not do.",
      "There is also a counter-system. The parasympathetic branch of your nervous system exists to bring arousal back down, and it engages on its own. It is slower than the alarm, which is why the come-down feels sluggish compared to how fast it arrived.",
      "This is the single most useful thing to know about panic, because the belief that it will escalate without limit is itself one of the things that keeps it going. Knowing the shape of the curve does not stop the episode, but it changes what you do while you are on it.",
    ],
    takeaway:
      "Panic has a ceiling and a downslope built into its chemistry. It peaks, typically within about ten minutes, and then falls — even when it does not feel like it will.",
    caveat:
      "Anxiety that stays high for hours or days is a different pattern from panic, and worth talking to a professional about rather than managing alone.",
  },
  {
    id: "dizzy-tingling",
    question: "Why do I get dizzy or tingly when I'm anxious?",
    tag: "Body sensations",
    explanation: [
      "This one has an unusually clean explanation. When breathing speeds up beyond what your body actually needs, you blow off more carbon dioxide than you produce. Blood CO₂ drops — the term is hypocapnia.",
      "Lower CO₂ makes the blood slightly more alkaline, and that causes blood vessels serving the brain to narrow. Less blood flow to the brain produces light-headedness, visual changes, and a sense of unreality.",
      "The same shift affects how calcium behaves at your nerve endings, which is what produces tingling — usually fingers, toes and around the mouth.",
      "Note what is not happening: you are not short of oxygen. It is the opposite problem. This is why breathing harder makes it worse and why slowing down resolves it, usually within a few minutes.",
    ],
    takeaway:
      "Dizziness and tingling during anxiety usually come from over-breathing lowering your CO₂ — not from a lack of oxygen. Slowing the breath reverses it.",
    caveat:
      "Dizziness has plenty of other causes — inner ear, blood pressure, blood sugar, medication, dehydration. If it happens outside anxious moments, or you actually faint, get it looked at.",
  },
  {
    id: "overthinking",
    question: "Why does overthinking feel like I'm solving something?",
    tag: "Thinking",
    explanation: [
      "Rumination borrows the machinery of problem-solving. It has the same shape — turning something over, examining angles, searching for the answer — and so it registers as productive work.",
      "The difference is the question. Real problem-solving works on questions with answers available now. Rumination works on questions that cannot be answered from where you are sitting: what they meant, what will happen, whether you are enough.",
      "Because there is no answer to arrive at, there is no natural stopping point. The loop runs until something interrupts it — sleep, distraction, or exhaustion.",
      "It is also self-reinforcing in a way that is easy to miss. Thinking it through feels marginally better than not thinking about it, and that relief teaches your brain that the loop was useful. So it runs again next time.",
    ],
    takeaway:
      "Overthinking feels productive because it uses the same mechanism as problem-solving — applied to questions that have no answer yet, so it never reaches an end.",
    caveat:
      "This is a description of a common pattern, not a diagnosis. Persistent rumination that runs your days is worth working through with someone rather than alone.",
  },
  {
    id: "sleep-anxiety",
    question: "Why does one bad night make everything worse?",
    tag: "Sleep",
    explanation: [
      "Sleep and anxiety push on each other in both directions, which is what makes a bad week compound rather than average out.",
      "Going one way: short sleep increases reactivity in the brain's threat-detection circuitry while reducing the regulatory control the prefrontal cortex normally provides. The alarm gets louder and the brake gets weaker at the same time. Things that would have been mildly annoying land as genuinely difficult.",
      "Going the other way: anxiety delays sleep onset and fragments the sleep you do get. The quiet of lying in bed removes every distraction that was holding the thoughts off during the day.",
      "So a single bad night is not just tiredness — it is a temporarily worse-calibrated threat system. That is worth knowing on a hard morning, because the day tends to feel like evidence about your life when it is mostly evidence about your sleep.",
    ],
    takeaway:
      "Short sleep makes the threat system more reactive and the regulating system weaker. A hard day after a bad night is often about the night.",
    caveat:
      "Ongoing insomnia is treatable and responds well to CBT-I specifically. If it has run for weeks, that is worth raising with a GP rather than managing with sleep hygiene tips.",
  },
  {
    id: "unreal",
    question: "Why do I feel detached, like things aren't real?",
    tag: "Panic",
    explanation: [
      "This is usually described as derealisation — the world seeming flat, distant, filmed, or somehow not quite solid — or depersonalisation, feeling detached from yourself.",
      "It shows up commonly at high anxiety and during panic, and it frightens people more than almost any other symptom, because it feels like something is happening to the mind rather than the body.",
      "The honest position is that the mechanism is not fully settled. The leading account treats it as a response to extreme arousal — a kind of protective distancing when the system is overwhelmed. Over-breathing and reduced blood flow to the brain, as described above, likely contribute to it as well.",
      "What is better established is the pattern: it is common, it is strongly associated with high anxiety states, and it typically resolves as arousal comes down. Grounding through the senses tends to help, which fits the idea that it is partly about attention detaching from the immediate environment.",
    ],
    takeaway:
      "Feeling unreal is a recognised feature of high anxiety, not a sign of losing your grip. The mechanism is not fully settled, but it usually lifts as arousal falls.",
    caveat:
      "Persistent detachment that continues outside anxious episodes, or that follows trauma, is a different thing and should be discussed with a professional.",
  },
  {
    id: "avoidance",
    question: "Why does avoiding it make it worse over time?",
    tag: "Thinking",
    explanation: [
      "Avoidance works. That is exactly the problem with it — the relief is immediate and real, which is what makes it so hard to stop doing.",
      "Every time you avoid something that felt threatening and the feared outcome does not occur, two things get reinforced: that the situation was genuinely dangerous, and that avoiding it was what saved you. Your brain has no way to learn otherwise, because it never got to see what would have happened.",
      "So the set of avoided things tends to grow rather than shrink. Each act of avoidance narrows the range of situations that feel manageable, and the narrowing itself becomes something to be anxious about.",
      "This is why treatments for anxiety generally involve approaching things gradually rather than waiting to feel ready. The feeling of readiness is usually a result of doing the thing, not a prerequisite for it.",
    ],
    takeaway:
      "Avoidance gives real short-term relief and, by doing so, teaches your brain the thing was dangerous. The range of avoided things then tends to grow.",
    caveat:
      "Working through avoidance is best done gradually and, for anything significant, with a professional. Forcing yourself into something overwhelming can entrench the fear rather than reduce it.",
  },
];

export function getScienceTopic(id: string): ScienceTopic | undefined {
  return SCIENCE_TOPICS.find((topic) => topic.id === id);
}

export const SCIENCE_TAGS = ["Body sensations", "Panic", "Thinking", "Sleep"] as const;
