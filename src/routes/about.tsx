import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Bright Edge Agency" },
      { name: "description", content: "Bright Edge Agency is a Nairobi-based real estate practice covering luxury, residential, and investment property across Kenya." },
      { property: "og:title", content: "About | Bright Edge Agency" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">About us</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">A real estate practice, not a marketplace</h1>
      <div className="prose prose-slate mt-6 max-w-none text-foreground/85">
        <p>Bright Edge Agency was founded in 2018 in Nairobi with a simple thesis: real estate done well is closer to professional services than to advertising. Every listing on our site is walked, photographed, and pricing-checked by an agent before it appears. Every inquiry is logged into a working pipeline and seen through to a written outcome.</p>
        <p>We work across four practice areas, luxury sales in Karen, Runda, and the coast; residential apartments and townhouses in Westlands, Kilimani, Lavington, and Kileleshwa; executive and corporate rentals; and structured investment opportunities including off-plan and buy-to-let.</p>
        <p>Our six agents have an average of nine years in the market. We close roughly seventy transactions a year, and our average days-on-market is 61 against a city benchmark of 92.</p>
        <h2>What you can expect from us</h2>
        <ul>
          <li>A written brief after the first conversation, so we and you agree on what we're looking for.</li>
          <li>Three to five qualified shortlists inside forty-eight hours.</li>
          <li>Honest pricing advice, including when to walk away.</li>
          <li>Title, structural, and management-company due diligence before exchange.</li>
          <li>A debrief after every viewing and a written closing summary.</li>
        </ul>
      </div>
      <div className="mt-10">
        <Link to="/contact" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Talk to us
        </Link>
      </div>
    </article>
  );
}
