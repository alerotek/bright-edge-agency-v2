import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Bright Edge Agency" },
      { name: "description", content: "How Bright Edge Agency collects, uses, and protects your personal information." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Privacy policy</h1>
      <div className="prose prose-slate mt-6 max-w-none text-foreground/85">
        <p>Last updated: {new Date().getFullYear()}.</p>
        <p>This policy explains what data Bright Edge Agency collects when you use our site or contact us, how we use it, and the choices you have. We follow the Kenya Data Protection Act, 2019.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Contact details you submit through inquiry, contact, or newsletter forms (name, email, phone, message).</li>
          <li>Account information if you sign in (email and the profile fields you provide).</li>
          <li>Standard server logs, used for security and to keep the site running.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To respond to inquiries and arrange viewings.</li>
          <li>To send service updates about properties you've asked about.</li>
          <li>To send our newsletter, only if you've opted in.</li>
        </ul>
        <h2>Sharing</h2>
        <p>We do not sell your data. We share it only with the agent handling your inquiry, and with infrastructure providers strictly necessary to run the site (hosting, email, analytics).</p>
        <h2>Your choices</h2>
        <p>You can request access, correction, or deletion of your data at any time by emailing privacy@brightedge.agency.</p>
      </div>
    </article>
  ),
});
