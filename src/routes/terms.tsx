import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Bright Edge Agency" },
      { name: "description", content: "Terms governing your use of the Bright Edge Agency website." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: () => (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Terms of use</h1>
      <div className="prose prose-slate mt-6 max-w-none text-foreground/85">
        <p>By using this site you agree to these terms. Listings are believed accurate at the time of publication but are not warranted; price, availability, and features are subject to change. Photographs are representative. All transactions are subject to a separate written agreement with Bright Edge Agency. Nothing on this site constitutes a binding offer.</p>
        <p>Content is © Bright Edge Agency unless otherwise indicated. You may share links to our pages; you may not republish content without written permission.</p>
        <p>For questions, contact legal@brightedge.agency.</p>
      </div>
    </article>
  ),
});
