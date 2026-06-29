import { Link } from "@tanstack/react-router";
import brightLogo from "../../../images/Bright-logo.PNG";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex shrink-0 ${className}`} aria-label="Bright Edge home">
      <img src={brightLogo} alt="Bright Edge Agency" className="h-10 w-auto object-contain" />
    </Link>
  );
}
