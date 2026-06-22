
# Bright Edge Agency — Real Estate Platform (Revised)

A premium, production-ready real estate site + CMS for Bright Edge Agency. Built on the Lovable stack (TanStack Start + Lovable Cloud / Supabase). Exportable to GitHub; a final "export pack" makes Vercel migration straightforward.

## Brand & design

- **Colors:** Teal `#29D3A7` + Indigo `#2F4DCC` duo primaries; accents `#39E67A`, `#1F2D86`; neutrals `#0F172A` / `#F8FAFC` / `#E2E8F0`. Wired as semantic tokens in `src/styles.css`.
- **Type:** Headings **Fraunces** (editorial), body **Inter**, via `@fontsource`.
- **Feel:** Editorial real-estate magazine × modern SaaS — large imagery, generous whitespace, soft shadows, rounded-2xl cards, gradient CTAs, subtle motion.

## Scope (v1 ships all of this)

### Public site
- **Home** — Hero w/ search, featured properties, why-choose, services, **Authority section** (featured property reviews, market insights, investment guides, recent articles), testimonials, WhatsApp + lead CTA, newsletter.
- **Properties** — Grid + filters (location, type, bedrooms, price, status, sale/rent), sort, pagination.
- **Property detail** (`/property/:slug`) — Multi-image gallery (lightbox, prev/next, swipe, keyboard), overview, amenities, features, location, **agent card linking to agent profile**, inquiry form, **WhatsApp CTAs** ("Schedule a viewing", "Chat with an agent", "Request property details"), related properties, related property reviews.
- **Property Reviews** (`/reviews`, `/reviews/:slug`) — Dedicated content type, separate from blog. Rating, schema markup, related property link.
- **Blog** (`/blog`, `/blog/:slug`) — Market insights, investment guides, etc.
- **Agents** (`/agents`, `/agents/:slug`) — Public profiles with bio, photo, contacts, socials, assigned properties.
- **About / Services / Contact / Privacy / Terms.**
- **Mobile floating WhatsApp button** sitewide.
- **SEO:** per-route `head()` with title/description/OG/Twitter, leaf-only canonical, JSON-LD (`RealEstateAgent`, `Residence`, `Article`, `Review`, `Person`, `BreadcrumbList`), dynamic `sitemap.xml`, `robots.txt`.

### Auth
- Google OAuth (Lovable broker) + Email/password.
- **No public registration link** in UI. Auth pages exist; staff accounts created via admin Users panel (invite/create). Default role `user`; role elevation only by `super_admin` via `user_roles` table + `has_role()` SECURITY DEFINER.

### Admin CMS (`/admin/*`, role-gated)
- **Dashboard** — KPI widgets: Total / Active / Featured Properties; New Leads, Leads This Month, Qualified, Won; Most-Viewed Properties; Most-Read Articles; Recent Activity feed.
- **Properties** — CRUD, archive, feature, multi-image upload/reorder/featured-flag, amenities, status, agent assignment, **SEO tab (slug auto + override, meta_title, meta_description)**. Publish blocked until ≥3 images (UI + DB trigger).
- **Property Reviews** — CRUD, draft/publish, feature, rating, SEO metadata, link to property.
- **Blog** — Draft/publish/schedule, categories, tags, featured, rich text, SEO.
- **Agents** — CRUD, photo upload, bio, contacts, socials, slug, assign properties.
- **Leads (CRM)** — Inbox with extended statuses (`new`, `contacted`, `qualified`, `viewing_scheduled`, `offer_made`, `won`, `lost`, `closed`), notes, activity history timeline, filtering, search, CSV export.
- **Testimonials, Newsletter, Users & roles, Media Library, Settings, Activity Logs.**
- **Launch Audit** (`/admin/launch-audit`) — On-demand report scoring Database, Security, SEO, Performance, Accessibility, Mobile, CMS, Leads, Properties; 0–100 score + `READY` / `NOT READY` verdict with reasons.

### Database (Supabase via Lovable Cloud)
Core tables: `profiles`, `user_roles` (enum `app_role`), `properties` (+ `slug` unique, `meta_title`, `meta_description`), `property_categories`, `property_types`, `property_statuses`, `property_images`, `property_documents`, `property_videos`, `amenities`, `property_amenities`, `locations`, `agents` (+ `slug`, `photo`, `bio`, `phone`, `email`, `socials jsonb`), `inquiries` (extended status enum + `notes`, `lead_activities` child table), `contact_requests`, `blog_posts`, `blog_categories`, `blog_tags`, `blog_post_tags`, **`property_reviews`** (+ `slug`, `rating`, `meta_title`, `meta_description`), `comments`, `testimonials`, `newsletter_subscribers`, `saved_properties`, `featured_properties`, `activity_logs`, `settings` (+ `company_whatsapp`).

- RLS on every table; GRANTs in same migration; `anon` SELECT only on published public content.
- Storage buckets: `property-images`, `property-documents` (private), `property-videos`, `blog-images`, `review-images`, `avatars`, `branding-assets`.
- Triggers: slug auto-gen w/ uniqueness, image-count check for property publish, `updated_at`, activity log writer.

### Sample data (seeded via migration; humanized, no lorem)
- 20+ properties (luxury + residential), each 5–10 images, unique slugs + SEO meta.
- 8+ property reviews tied to properties, with ratings.
- 12+ blog articles across categories.
- 6+ agents with profiles + assignments.
- 10+ testimonials, 10+ leads spanning all CRM statuses.
- Imagery: AI-generated brand/hero/about/services + curated Unsplash for properties/blog/reviews/agents.

## Implementation phases (gated — each must be stable before the next)

1. **Database schema** — all tables, enums, indexes, FKs, triggers.
2. **RLS policies + GRANTs** — defense-in-depth.
3. **Authentication** — Google + email/password, `/auth` page, no public-signup link, session wiring.
4. **Role system** — `user_roles`, `has_role()`, admin gate for `/admin/*`.
5. **Property management** — admin CRUD + SEO fields + slug routing.
6. **Property image system** — uploads, reorder, featured, ≥3 publish rule.
7. **Agent management** — admin CRUD + public `/agents` profiles.
8. **Property reviews** — content type + CMS + public pages + schema.
9. **Blog system** — CMS + public pages.
10. **Lead management CRM** — extended statuses, notes, activity, dashboard metrics.
11. **Public website** — Home (authority section), Properties, Property detail (WhatsApp CTAs, gallery), About, Services, Contact, Privacy, Terms, mobile floating WhatsApp.
12. **SEO** — per-route head, JSON-LD, sitemap, robots.
13. **Analytics dashboard** — full widget set.
14. **Export pack** — `vercel.json`, `.env.example`, `README.md` with migration notes.
15. **Launch audit** — admin module + final report.

## Technical notes

- **Stack:** TanStack Start (React 19, Vite 7), Tailwind v4, shadcn/ui, TanStack Query, Zod, react-hook-form, Lovable Cloud (Supabase).
- **Auth gate:** integration-managed `_authenticated/`; `/admin/*` adds role check in `beforeLoad` via `has_role`.
- **Server fns:** `createServerFn` for mutations; public loaders use publishable Supabase client for SSR-safe reads.
- **Slug routing:** `/property/:slug`, `/reviews/:slug`, `/agents/:slug`, `/blog/:slug` — all loader-driven with `notFound()` on miss.
- **WhatsApp:** built as `wa.me/<company_whatsapp>?text=<prefilled>` deep links (no API integration); FAB on mobile, inline CTAs on key pages.
- **Forms:** Zod + react-hook-form, server-side re-validation.
- **Performance:** route splitting, lazy gallery images, `aspect-*` wrappers, image lazy loading.
- **Accessibility:** semantic HTML, single `<main>`, aria-labels on icon buttons, focus rings, ≥44px tap targets, token-based contrast.
- **Launch audit logic:** programmatic checks against DB (counts, missing slugs, properties <3 images, missing SEO meta, unfilled settings, RLS-disabled tables via `pg_tables`, etc.) + static checks for SEO/a11y essentials. Score = weighted pass rate.

## Out of v1 (callable later)
- Transactional email (Resend) for inquiries — leads still stored + visible in CRM.
- Real maps integration (styled placeholder until a key is added).
- Two-way WhatsApp Business API (deep links only for v1).
- Payments, saved-search alerts, i18n.

## Export pack details
- `vercel.json` with SPA rewrites.
- `.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`.
- `README.md`: setup, Supabase project bootstrap, running migrations, seeding, Vercel adapter swap notes for TanStack Start.
