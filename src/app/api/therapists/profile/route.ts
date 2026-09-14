import { z } from "zod";
import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { screenText } from "@/lib/safety";
import {
  DELIVERY_OPTIONS,
  LANGUAGES,
  MODALITIES,
  SPECIALTIES,
  STATES,
} from "@/lib/therapists";

const deliveryValues = DELIVERY_OPTIONS.map((entry) => entry.value);

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email("That email does not look right.").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  practiceName: z.string().trim().max(160).optional().or(z.literal("")),
  practiceUrl: z
    .string()
    .trim()
    .url("A practice link needs to start with https://")
    .max(300)
    .optional()
    .or(z.literal("")),
  specialties: z.array(z.enum(SPECIALTIES)),
  modalities: z.array(z.enum(MODALITIES)),
  languages: z.array(z.enum(LANGUAGES)).min(1, "Add at least one language."),
  delivery: z
    .array(z.string().refine((value) => deliveryValues.includes(value)))
    .min(1, "Choose telehealth, in person, or both."),
  state: z.enum(STATES),
  bio: z.string().trim().max(1200).optional().or(z.literal("")),
});

/**
 * A practitioner editing their own listing.
 *
 * This matters more than it looks. Specialties, languages, delivery and state
 * are the fields `matches()` uses to decide which requests they are shown —
 * so without this, a practitioner is frozen on the day they applied. Someone
 * who trains in EMDR, stops seeing people in a room, or moves interstate had
 * no way to say so, and their queue would quietly go wrong while they kept
 * paying for it.
 *
 * Runs as the practitioner. The database trigger puts back anything to do with
 * verification, registration or billing no matter what this route sends, so
 * the worst a bad field list here could do is fail to save.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, profileSchema);
  if (!data) return badBody;

  // A bio is read by people who are struggling. Same screen as everything else
  // in this app that one person writes for another to read.
  if (data.bio && screenText(data.bio).level === "crisis") {
    return jsonError("That bio cannot be saved. Take out anything about self-harm or suicide.", 422);
  }

  const supabase = await createSupabaseServerClient();

  const { data: updated, error } = await supabase
    .from("therapists")
    .update({
      full_name: data.fullName,
      contact_email: data.contactEmail,
      phone: data.phone?.trim() || null,
      practice_name: data.practiceName?.trim() || null,
      practice_url: data.practiceUrl?.trim() || null,
      specialties: data.specialties,
      modalities: data.modalities,
      languages: data.languages,
      delivery: data.delivery,
      state: data.state,
      bio: data.bio?.trim() || null,
    })
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !updated) return jsonError("That did not save.", 500);

  return jsonOk({ saved: true });
}
