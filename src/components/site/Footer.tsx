import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { Logo } from "./Logo";
import { settingsQuery } from "@/lib/queries";

export function Footer() {
  const { data: s } = useQuery(settingsQuery);
  const socials = (s?.social_links ?? {}) as Record<string, string>;

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            {s?.tagline ?? "Premium real estate, curated for serious buyers and renters."}
          </p>
          <div className="flex items-center gap-2">
            {socials.instagram && <a href={socials.instagram} aria-label="Instagram" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Instagram className="h-4 w-4" /></a>}
            {socials.facebook && <a href={socials.facebook} aria-label="Facebook" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Facebook className="h-4 w-4" /></a>}
            {socials.linkedin && <a href={socials.linkedin} aria-label="LinkedIn" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Linkedin className="h-4 w-4" /></a>}
            {socials.x && <a href={socials.x} aria-label="X (Twitter)" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Twitter className="h-4 w-4" /></a>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/properties" className="hover:text-foreground">Properties</Link></li>
            <li><Link to="/reviews" className="hover:text-foreground">Property reviews</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Market insights</Link></li>
            <li><Link to="/agents" className="hover:text-foreground">Our agents</Link></li>
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
            {s?.office_address ? <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{s.office_address}</span></li> : null}
            {s?.primary_phone ? <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" /><a href={`tel:${s.primary_phone.replace(/\s/g,"")}`} className="hover:text-foreground">{s.primary_phone}</a></li> : null}
            {s?.primary_email ? <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${s.primary_email}`} className="hover:text-foreground">{s.primary_email}</a></li> : null}
            {s?.business_hours ? <li className="text-xs">{s.business_hours}</li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} {s?.company_name ?? "Bright Edge Agency"}. All rights reserved.</span>
          <span>Powered by{" "}<a href="https://alerotek.co.ke/" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary">ALEROTEK</a>. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
