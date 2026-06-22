export function formatPrice(
  price: number | string | null | undefined,
  currency = "KES",
  period?: string | null,
): string {
  if (price === null || price === undefined) return "Price on request";
  const n = typeof price === "string" ? Number(price) : price;
  if (!Number.isFinite(n)) return "Price on request";
  const formatted = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
  return period ? `${formatted}/${period}` : formatted;
}

export function buildWhatsappLink(
  number: string | null | undefined,
  message?: string,
): string {
  if (!number) return "#";
  const clean = number.replace(/[^0-9]/g, "");
  const params = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${params}`;
}

export function truncate(s: string | null | undefined, n = 160): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
