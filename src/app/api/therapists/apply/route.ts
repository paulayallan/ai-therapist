import { z } from "zod";
import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LANGUAGES,
  MODALITIES,
  REGISTRATION_TYPES,
  SPECIALTIES,
  STATES,
  registrationBodyFor,
} from "@/lib/therapists";

const registrationValues: string[] = REGISTRATION_TYPES.map((entry) => entry.value);

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Tell us your name as it appears on the register.").max(120),
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

  registrationType: z
    .string()
    .refine((value) => registrationValues.includes(value), "Choose the registration you hold."),
  registrationNumber: z
    .string()
    .trim()
    .min(4, "We need your registration number to check the public register.")
    .max(40),

  specialties: z.array(z.enum(SPECIALTIES)).max(SPECIALTIES.length).default([]),
  modalities: z.array(z.enum(MODALITIES)).max(MODALITIES.length).default([]),
  languages: z.array(z.enum(LANGUAGES)).min(1, "Add at least one language.").max(LANGUAGES.length),
  delivery: z
    .array(z.enum(["telehealth", "in_person"]))
    .min(1, "Choose telehealth, in person, or both."),
  state: z.enum(STATES, { errorMap: () => ({ message: "Choose the state you practise in." }) }),
  bio: z.string().trim().max(1200).optional().or(z.literal("")),
});

/**
 * A practitioner applying to be listed.
 *
 * This writes a `pending` row and nothing more. It cannot write a verified one:
 * the insert policy rejects any row that arrives already verified, and the
 * update trigger puts the verification columns back on anything that is not
 * service_role. So the worst an applicant can do here is queue themselves for a
 * human to check — which is the entire point.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, applicationSchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("therapists")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return jsonError(
      existing.status === "rejected"
        ? "This account already has an application that was not accepted. Get in touch rather than reapplying."
        : "You have already applied. Your application is on your dashboard.",
      409,
    );
  }

  const { data: created, error } = await supabase
    .from("therapists")
    .insert({
      user_id: user.id,
      full_name: data.fullName,
      contact_email: data.contactEmail,
      phone: data.phone?.trim() || null,
      practice_name: data.practiceName?.trim() || null,
      practice_url: data.practiceUrl?.trim() || null,
      registration_body: registrationBodyFor(data.registrationType),
      registration_type: data.registrationType,
      registration_number: data.registrationNumber,
      specialties: data.specialties,
      modalities: data.modalities,
      languages: data.languages,
      delivery: data.delivery,
      state: data.state,
      bio: data.bio?.trim() || null,
      // Both deliberately false at this point. Nothing is listed until a person
      // has opened the register and looked.
      accepting_clients: false,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return jsonError("That did not save. Try again in a moment.", 500);

  return jsonOk({ id: created.id });
}
