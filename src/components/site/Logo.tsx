import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import brightLogo from "../../../images/Bright-logo.PNG";

export function Logo({ className = "" }: { className?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      to="/"
      className={`group inline-flex shrink-0 items-center gap-2.5 ${className}`}
      aria-label="Bright Edge home"
    >
      <div className="relative">
        <img
          src={brightLogo}
          alt=""
          className={`h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105 sm:h-14 ${
            scrolled ? "drop-shadow-[0_0_8px_rgba(41,211,167,0.3)]" : ""
          }`}
        />
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Bright <span className="text-primary">Edge</span>
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
          Agency
        </span>
      </div>
    </Link>
  );
}