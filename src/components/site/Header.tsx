import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/queries";

const NAV = [
  { to: "/properties", label: "Properties" },
  { to: "/reviews", label: "Reviews" },
  { to: "/blog", label: "Insights" },
  { to: "/agents", label: "Agents" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const JOIN_LINK = { to: "/join", label: "Become an Agent" } as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: settings } = useQuery(settingsQuery);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors ${
        scrolled ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent bg-background/0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {settings?.primary_phone ? (
            <a
              href={`tel:${settings.primary_phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden lg:inline">{settings.primary_phone}</span>
            </a>
          ) : null}
          {/* Join CTA — highlighted in the nav */}
          <Button asChild variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10">
            <Link to={JOIN_LINK.to}>{JOIN_LINK.label}</Link>
          </Button>
          <Button asChild>
            <Link to="/contact">Get in touch</Link>
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground/80 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-border bg-background lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-3 text-base font-medium text-foreground/85 hover:bg-secondary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={JOIN_LINK.to}
              className="rounded-md px-3 py-3 text-base font-medium text-accent hover:bg-accent/10"
              onClick={() => setOpen(false)}
            >
              {JOIN_LINK.label}
            </Link>
            <Button asChild className="mt-2">
              <Link to="/contact" onClick={() => setOpen(false)}>Get in touch</Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
