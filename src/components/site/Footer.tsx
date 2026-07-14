import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Twitter } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/queries";
import { buildWhatsappLink } from "@/lib/format";

export function Footer() {
  const { data: s } = useQuery(settingsQuery);
  const socials = (s?.social_links ?? {}) as Record<string, string>;

  return (
    <footer className="border-t border-border">
      {/* ── CTA band ── */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 sm:flex-row sm:items-center lg:px-8">
          <div className="max-w-lg">
            <p className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Your next home is one<br className="hidden sm:block" /> conversation away.
            </p>
            <p className="mt-3 text-sm text-white/70">
              Tell us what you're looking for. We'll shortlist matches inside 48 hours.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/contact">Start a brief</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <a
                href={buildWhatsappLink(
                  s?.company_whatsapp,
                  "Hi Bright Edge, I'd like to discuss a property search.",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp us
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Links grid ── */}
      <div className="bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              {s?.tagline ?? "Premium real estate, curated for serious buyers and renters."}
            </p>
            <div className="flex items-center gap-2">
              {socials.instagram && (
                <a href={socials.instagram} aria-label="Instagram" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {socials.facebook && (
                <a href={socials.facebook} aria-label="Facebook" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {socials.linkedin && (
                <a href={socials.linkedin} aria-label="LinkedIn" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {socials.x && (
                <a href={socials.x} aria-label="X (Twitter)" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/properties" className="hover:text-foreground">Properties</Link></li>
              <li><Link to="/reviews" className="hover:text-foreground">Property reviews</Link></li>
              <li><Link to="/blog" className="hover:text-foreground">Market insights</Link></li>
              <li><Link to="/agents" className="hover:text-foreground">Our agents</Link></li>
              <li>
                <Link to="/join" className="font-medium text-accent hover:text-accent/80">
                  Become an Agent →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About us</Link></li>
              <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Get in touch</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {s?.office_address ? (
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{s.office_address}</span>
                </li>
              ) : null}
              {s?.primary_phone ? (
                <li className="flex gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                  <a href={`tel:${s.primary_phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                    {s.primary_phone}
                  </a>
                </li>
              ) : null}
              {s?.primary_email ? (
                <li className="flex gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <a href={`mailto:${s.primary_email}`} className="hover:text-foreground">
                    {s.primary_email}
                  </a>
                </li>
              ) : null}
              {s?.business_hours ? (
                <li className="text-xs">{s.business_hours}</li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} {s?.company_name ?? "Bright Edge Agency"}. All rights reserved.</span>
            <span>
              Powered by{" "}
              <a href="https://alerotek.co.ke/" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary">
                ALEROTEK
              </a>
              . All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
