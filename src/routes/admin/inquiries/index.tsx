import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminInquiriesQuery } from "@/lib/admin-queries";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/inquiries/")({
  component: AdminInquiries,
});

const statuses = ["new", "contacted", "qualified", "viewing_scheduled", "viewing_completed", "negotiation", "offer_received", "won", "lost", "closed", "archived"];

function AdminInquiries() {
  const { data: inquiries = [] } = useQuery(adminInquiriesQuery);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? inquiries : inquiries.filter((i: any) => i.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads & Inquiries</h1>
          <p className="text-sm text-muted-foreground">{inquiries.length} total · {inquiries.filter((i: any) => i.status === "new").length} new</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed">No inquiries found.</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((inq: any) => (
            <Card key={inq.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{inq.full_name}</h3>
                        <Badge variant="outline" className="font-mono text-[10px]">{inq.lead_id}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {inq.email} · {inq.phone}
                      </p>
                    </div>
                    <Badge variant={inq.status === 'new' ? 'default' : 'secondary'}>
                      {inq.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase font-medium">Interest</p>
                      <p className="font-medium text-primary">{inq.property?.title ?? inq.property_id ?? "General Inquiry"}</p>
                      <Badge variant="outline" className="mt-1 capitalize">{inq.inquiry_type?.replace("_", " ")}</Badge>
                    </div>
                    {inq.inquiry_type === 'viewing_request' && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs uppercase font-medium">Preferred Viewing</p>
                        <p className="font-medium">{inq.preferred_viewing_date} · {inq.preferred_viewing_time}</p>
                      </div>
                    )}
                    {inq.budget_kes && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs uppercase font-medium">Budget</p>
                        <p className="font-medium text-accent">KES {inq.budget_kes.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {inq.message && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm italic">
                      "{inq.message}"
                    </div>
                  )}
                </div>

                <div className="bg-muted/30 p-6 sm:w-64 border-t sm:border-t-0 sm:border-l flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs uppercase font-medium">Source & Date</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{inq.source?.replace("_", " ")}</Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDate(inq.created_at)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs uppercase font-medium">Assigned Agent</p>
                    <p className="text-sm font-medium">{inq.agent?.full_name ?? "Unassigned"}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/admin/inquiries/$id" params={{ id: inq.id }}>Manage Lead</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
