import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { settingsQuery } from "@/lib/queries";
import { buildWhatsappLink } from "@/lib/format";

export function WhatsAppFAB() {
  const { data: s } = useQuery(settingsQuery);
  if (!s?.company_whatsapp) return null;
  const href = buildWhatsappLink(
    s.company_whatsapp,
    `Hello ${s.company_name ?? "Bright Edge"} — I'd like more information.`,
  );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_-8px_rgba(37,211,102,0.55)] transition-transform hover:scale-105 md:bottom-8 md:right-8"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
