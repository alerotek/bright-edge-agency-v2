/**
 * V2 Agent Onboarding State Machine
 * --------------------------------------------------------------
 * 9-step wizard. Each step is gated by the previous one.
 * State is kept in a single object on the client; persistence
 * happens at the final submit (we do not autosave to the DB
 * because documents are in R2 and partial state would be confusing).
 *
 * Transitions are explicit and validated server-side on submit.
 */

export type OnboardingStep =
  | "apply"
  | "email_verified"
  | "phone_verified"
  | "identity_uploaded"
  | "selfie_uploaded"
  | "areas_selected"
  | "socials_linked"
  | "profile_completed"
  | "auto_validated"
  | "pending_review"
  | "verified";

export const STEP_ORDER: OnboardingStep[] = [
  "apply",
  "email_verified",
  "phone_verified",
  "identity_uploaded",
  "selfie_uploaded",
  "areas_selected",
  "socials_linked",
  "profile_completed",
  "auto_validated",
  "pending_review",
  "verified",
];

export const STEP_LABELS: Record<OnboardingStep, string> = {
  apply: "Apply",
  email_verified: "Email verification",
  phone_verified: "Phone verification",
  identity_uploaded: "National ID",
  selfie_uploaded: "Selfie & photo",
  areas_selected: "Areas of operation",
  socials_linked: "Social media",
  profile_completed: "Profile details",
  auto_validated: "Automatic validation",
  pending_review: "Pending human review",
  verified: "Verified agent",
};

export type SocialPlatformKey =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "website";

export type SocialAccountDraft = {
  platform: SocialPlatformKey;
  handle: string;
  url: string;
};

export type AreaDraft = {
  country: string;
  county: string;
  town: string;
  neighbourhood: string;
};

export type DocumentDraft = {
  kind: "national_id_front" | "national_id_back" | "selfie" | "profile_photo";
  storage_path: string;
  public_url: string;
  mime_type?: string;
  byte_size?: number;
};

export type AgentOnboardingState = {
  // Step 1 — Apply (collected at sign-up via Supabase)
  email: string;
  fullName: string;
  phone: string;

  // Step 2 — Email verified (handled by Supabase auth)
  emailVerified: boolean;
  emailVerifiedAt: string | null;

  // Step 3 — Phone verified (WhatsApp code fallback)
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  whatsappOtpCode: string | null;

  // Step 4 — National ID
  identityDocuments: DocumentDraft[];   // front + back

  // Step 5 — Selfie + profile photo
  selfie: DocumentDraft | null;
  profilePhoto: DocumentDraft | null;

  // Step 6 — Areas
  areas: AreaDraft[];

  // Step 7 — Socials
  socials: SocialAccountDraft[];

  // Step 8 — Profile details
  licenseNumber: string;
  licenseExpiry: string;            // ISO date
  bio: string;
  position: string;
  yearsExperience: number | null;
  languages: string[];              // e.g. ["English", "Swahili"]
  specializations: string[];        // e.g. ["Luxury homes", "Commercial"]
  teamName: string;

  // Step 9 — Auto validation (server-driven)
  autoValidationScore: number | null;
  autoValidationIssues: string[];

  // Step 10 — Pending review
  submittedAt: string | null;

  // Step 11 — Verified
  verifiedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
};

export const initialOnboardingState: AgentOnboardingState = {
  email: "",
  fullName: "",
  phone: "",
  emailVerified: false,
  emailVerifiedAt: null,
  phoneVerified: false,
  phoneVerifiedAt: null,
  whatsappOtpCode: null,
  identityDocuments: [],
  selfie: null,
  profilePhoto: null,
  areas: [],
  socials: [],
  licenseNumber: "",
  licenseExpiry: "",
  bio: "",
  position: "",
  yearsExperience: null,
  languages: [],
  specializations: [],
  teamName: "",
  autoValidationScore: null,
  autoValidationIssues: [],
  submittedAt: null,
  verifiedAt: null,
  reviewedBy: null,
  reviewNotes: null,
};

/**
 * Returns the index (0..10) of the first incomplete step, or
 * 10 ("verified") if everything is complete.
 */
export function currentStepIndex(state: AgentOnboardingState): number {
  if (state.verifiedAt) return STEP_ORDER.indexOf("verified");
  if (state.submittedAt) return STEP_ORDER.indexOf("pending_review");

  if (!state.email || !state.fullName) return STEP_ORDER.indexOf("apply");
  if (!state.emailVerified) return STEP_ORDER.indexOf("email_verified");
  if (!state.phoneVerified) return STEP_ORDER.indexOf("phone_verified");
  if (state.identityDocuments.length < 2)
    return STEP_ORDER.indexOf("identity_uploaded");
  if (!state.selfie || !state.profilePhoto)
    return STEP_ORDER.indexOf("selfie_uploaded");
  if (state.areas.length === 0) return STEP_ORDER.indexOf("areas_selected");
  if (state.socials.length === 0) return STEP_ORDER.indexOf("socials_linked");
  if (!state.bio || !state.licenseNumber)
    return STEP_ORDER.indexOf("profile_completed");
  return STEP_ORDER.indexOf("auto_validated");
}

/**
 * Server-side final validation. Returns the list of blocking issues.
 * If the list is empty, the agent can be submitted for review.
 */
export function validateForSubmit(
  state: AgentOnboardingState,
): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!state.emailVerified) issues.push("Email is not verified.");
  if (!state.phoneVerified) issues.push("Phone number is not verified.");
  if (state.identityDocuments.length < 2)
    issues.push("Upload both sides of the National ID.");
  if (!state.selfie) issues.push("Upload a selfie.");
  if (!state.profilePhoto) issues.push("Upload a profile photo.");
  if (state.areas.length === 0) issues.push("Select at least one area of operation.");
  if (state.socials.length === 0) issues.push("Link at least one social account.");
  if (!state.bio || state.bio.length < 40)
    issues.push("Write a bio of at least 40 characters.");
  if (!state.licenseNumber) issues.push("Provide a license number.");
  if (!state.fullName || state.fullName.trim().length < 2)
    issues.push("Provide your full name.");

  return { ok: issues.length === 0, issues };
}
