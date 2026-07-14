# Bright Edge Estate — Task Completion List

## ✅ PHASE 1: Email Infrastructure (Resend) — COMPLETE
- [x] Install `resend` npm package
- [x] Create `src/lib/email/client.ts` — Resend email client with API key management
- [x] Create `src/lib/email/templates.ts` — HTML/text templates for OTP and inquiry notifications
- [x] Create `src/lib/email/index.ts` — barrel export
- [x] Update `.env.example` with RESEND_API_KEY and other env vars

## ✅ PHASE 2: Email OTP (Replaces WhatsApp OTP) — COMPLETE
- [x] Create `src/lib/email/send-otp.ts` — Server functions `sendOtpEmail()` and `verifyOtpCode()`
- [x] Create `supabase/migrations/20260700000001_otp_codes.sql` — OTP database table with hashing
- [x] Create `src/components/agent/OtpVerification.tsx` — Email OTP verification component (send code, enter code, verify, resend cooldown)
- [x] Integrate `OtpVerification` into `OnboardingWizard.tsx` as Step 2 (between Personal Info and Document Upload)
- [x] Remove old WhatsApp OTP reference — validation step now uses `emailVerified` state from OTP component

## ✅ PHASE 3: Authorization & Security — PARTIALLY DONE
- [x] Fix admin route role enforcement in `src/routes/admin.tsx` (checks `user_roles` table, redirects agents to `/agent`, signs out unauthorized users)
- [x] Create `src/integrations/supabase/client.server.ts` — Server-side Supabase client (service role key, bypasses RLS for admin ops)
- [ ] **Pending:** Add `beforeLoad` to agent routes (`/agent/index`, `/agent/enquiries`, `/agent/onboarding`)
- [ ] **Pending:** Add password reset flow on `/auth` page

## ✅ PHASE 4: Inquiry Server Functions — COMPLETE
- [x] Create `src/lib/server-functions/inquiry.ts` — `submitInquiry()` and `updateInquiryStatus()` server functions
- [x] Update `src/components/site/InquiryForm.tsx` to use `submitInquiry` server function instead of direct DB insert
- [x] Add activity logging on inquiry submission
- [x] Add email notification to agent/admin on new inquiry via Resend

## ✅ PHASE 5: Database Migrations — PARTIALLY DONE
- [x] Create `supabase/migrations/20260700000001_otp_codes.sql` — OTP codes table with hash storage, expiry, and cleanup function
- [x] Create `supabase/migrations/20260700000002_v2_missing_tables.sql` — All missing V2 tables with RLS policies:
  - agent_applications, agent_documents, agent_social_accounts, agent_areas
  - marketing_assets, social_videos, short_links, property_qr_codes, lead_sources, projects
- [ ] **Pending:** Run migrations against Supabase project
- [ ] **Pending:** Regenerate Supabase types (`npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`)

## ⏳ PHASE 6: Property Validation Enforcement — NOT STARTED
- [ ] Connect `validateProperty()` from `lib/validation/index.ts` to property form submission
- [ ] Create server function `validateAndSaveProperty()` that runs validation before DB write
- [ ] Add live validation preview in the agent property creation form

## ⏳ PHASE 7: Data Fetching Patterns — NOT STARTED
- [ ] Configure SSR with proper data dehydration/hydration
- [ ] Add pagination to property listings (server-side with `range()`)
- [ ] Add view counter increment for properties and blog posts

## ⏳ PHASE 8: Error Boundaries & Loading States — NOT STARTED
- [ ] Add route-level error boundaries
- [ ] Add skeleton loading components on list pages
- [ ] Move hardcoded hero images to settings/config

## ⏳ PHASE 9: API Rate Limiting — NOT STARTED
- [ ] Add rate limiting to public forms (inquiry, contact)
- [ ] Create Supabase Edge Function for rate-limited endpoints

## ⏳ PHASE 10: CI/CD & Monitoring — NOT STARTED
- [ ] Set up GitHub Actions for lint + type-check
- [ ] Integrate error monitoring (Sentry)
- [ ] Add CSP headers in middleware

## 📋 COMPLETED FILES SUMMARY

| New File | Purpose |
|----------|---------|
| `src/lib/email/client.ts` | Resend email client |
| `src/lib/email/templates.ts` | Email HTML/text templates |
| `src/lib/email/send-otp.ts` | OTP server functions |
| `src/lib/email/index.ts` | Email barrel export |
| `src/integrations/supabase/client.server.ts` | Server-side Supabase client |
| `src/components/agent/OtpVerification.tsx` | Email OTP UI component |
| `src/lib/server-functions/inquiry.ts` | Inquiry server functions |
| `supabase/migrations/20260700000001_otp_codes.sql` | OTP codes migration |
| `supabase/migrations/20260700000002_v2_missing_tables.sql` | V2 tables migration |

| Modified File | Change |
|---------------|--------|
| `src/components/agent/OnboardingWizard.tsx` | OTP verification as Step 2, reordered steps 1-6 |
| `src/components/site/InquiryForm.tsx` | Uses `submitInquiry()` server function |
| `src/routes/admin.tsx` | Role-based authorization check |
| `.env.example` | Added RESEND_API_KEY and Supabase server keys |