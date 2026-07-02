import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
  /**
   * "default"  — small uppercase eyebrow + large serif title (original style)
   * "numbered" — large decorative number + thin rule + eyebrow beside it
   * "ruled"    — thin vertical rule left of eyebrow, no number
   */
  variant?: "default" | "numbered" | "ruled";
  /** Used when variant="numbered" */
  step?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  variant = "default",
  step,
}: SectionHeadingProps) {
  const isCenter = align === "center";

  if (variant === "numbered") {
    return (
      <div
        className={`flex flex-col gap-4 ${isCenter ? "items-center text-center" : ""} ${
          action ? "md:flex-row md:items-end md:justify-between" : ""
        }`}
      >
        <div className={isCenter ? "max-w-2xl" : "max-w-2xl"}>
          {/* Number + rule + eyebrow */}
          <div className={`flex items-center gap-4 ${isCenter ? "justify-center" : ""}`}>
            <span
              aria-hidden
              className="font-display text-[4.5rem] font-semibold leading-none tracking-tight text-border select-none"
            >
              {step ?? "01"}
            </span>
            <div className="h-px flex-1 bg-border" aria-hidden />
            {eyebrow ? (
              <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </p>
            ) : null}
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-base text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    );
  }

  if (variant === "ruled") {
    return (
      <div
        className={`flex flex-col gap-4 ${isCenter ? "items-center text-center" : ""} ${
          action ? "md:flex-row md:items-end md:justify-between" : ""
        }`}
      >
        <div className={isCenter ? "max-w-2xl" : "max-w-2xl"}>
          {eyebrow ? (
            <div className={`flex items-center gap-3 ${isCenter ? "justify-center" : ""}`}>
              {/* Thin vertical rule */}
              <span aria-hidden className="h-4 w-px bg-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </p>
            </div>
          ) : null}
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-base text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    );
  }

  // default
  return (
    <div
      className={`flex flex-col gap-3 ${isCenter ? "items-center text-center" : ""} ${
        action ? "md:flex-row md:items-end md:justify-between" : ""
      }`}
    >
      <div className={isCenter ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
