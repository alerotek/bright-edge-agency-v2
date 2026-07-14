/**
 * Marketplace Listing Badge
 * Displays ownership, representation, and verification info on property cards and pages
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, Building2, User, Home, Briefcase } from "lucide-react";

export type ListingOwnerType = "bright_edge" | "independent_agent" | "home_owner" | "developer" | "property_management";
export type RepresentationType = "bright_edge_exclusive" | "owner_direct" | "third_party_agency" | "independent_agent";

interface ListingBadgeProps {
  ownerType: ListingOwnerType;
  representationType: RepresentationType;
  listedByName?: string | null;
  representedEntityName?: string | null;
  verified?: boolean;
  size?: "sm" | "md" | "lg";
}

const ownerConfig: Record<ListingOwnerType, { label: string; icon: typeof ShieldCheck; color: string }> = {
  bright_edge: { label: "Bright Edge Agency", icon: Building2, color: "bg-primary text-primary-foreground" },
  independent_agent: { label: "Independent Agent", icon: User, color: "bg-blue-500 text-white" },
  home_owner: { label: "Home Owner", icon: Home, color: "bg-green-500 text-white" },
  developer: { label: "Developer", icon: Building2, color: "bg-purple-500 text-white" },
  property_management: { label: "Property Management", icon: Briefcase, color: "bg-orange-500 text-white" },
};

const repConfig: Record<RepresentationType, string> = {
  bright_edge_exclusive: "Bright Edge Exclusive",
  owner_direct: "Owner Direct",
  third_party_agency: "Third Party Agency",
  independent_agent: "Independent Agent",
};

export function ListingBadge({
  ownerType,
  representationType,
  listedByName,
  representedEntityName,
  verified,
  size = "sm",
}: ListingBadgeProps) {
  const config = ownerConfig[ownerType] ?? ownerConfig.bright_edge;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Owner Type Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${config.color} ${size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"} border-0`}>
              <config.icon className={`${size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} mr-1`} />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            <p className="font-medium">Listed By: {listedByName ?? config.label}</p>
            {representedEntityName && <p className="text-muted-foreground">Representing: {representedEntityName}</p>}
            <p>Represents: {repConfig[representationType]}</p>
          </TooltipContent>
        </Tooltip>

        {/* Verification Badge */}
        {verified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={`${size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"} border-green-300 text-green-700 bg-green-50`}>
                <ShieldCheck className={`${size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} mr-0.5`} />
                Verified
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Identity & documents verified</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Listed By text for detail pages */}
        {size === "lg" && (
          <div className="w-full mt-1 text-xs text-muted-foreground">
            <span className="font-medium">Listed By:</span> {listedByName ?? config.label}
            {representedEntityName && (
              <>
                <span className="mx-1">·</span>
                <span className="font-medium">Representing:</span> {representedEntityName}
              </>
            )}
            <span className="mx-1">·</span>
            <span className="font-medium">Type:</span> {repConfig[representationType]}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ─── Fee Display Component ─── */

interface FeesDisplayProps {
  viewingFee?: number | null;
  houseHuntingFee?: number | null;
  agencyCommission?: number | null;
  bookingFee?: number | null;
  securityDeposit?: number | null;
  serviceCharge?: number | null;
  negotiable?: boolean;
}

export function FeesDisplay({
  viewingFee,
  houseHuntingFee,
  agencyCommission,
  bookingFee,
  securityDeposit,
  serviceCharge,
  negotiable,
}: FeesDisplayProps) {
  const fees = [
    { label: "Viewing Fee", value: viewingFee },
    { label: "House Hunting Fee", value: houseHuntingFee },
    { label: "Agency Commission", value: agencyCommission },
    { label: "Booking Fee", value: bookingFee },
    { label: "Security Deposit", value: securityDeposit },
    { label: "Service Charge", value: serviceCharge },
  ].filter((f) => f.value && f.value > 0);

  if (fees.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-display text-lg font-semibold mb-3">Fees & Charges</h3>
      <div className="space-y-2">
        {fees.map((fee) => (
          <div key={fee.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{fee.label}</span>
            <span className="font-semibold">KES {fee.value!.toLocaleString()}</span>
          </div>
        ))}
      </div>
      {negotiable !== undefined && (
        <p className="mt-3 text-xs text-muted-foreground">
          {negotiable ? "✓ Fees negotiable" : "✗ Fees are fixed"}
        </p>
      )}
    </div>
  );
}

/* ─── Reputation Stars ─── */

interface ReputationStarsProps {
  score: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
}

export function ReputationStars({ score, totalReviews, size = "md" }: ReputationStarsProps) {
  const starSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${starSize} ${star <= Math.round(score) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {totalReviews !== undefined && (
        <span className="text-xs text-muted-foreground ml-1">({totalReviews})</span>
      )}
    </div>
  );
}