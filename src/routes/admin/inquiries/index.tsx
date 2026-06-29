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

const statuses = ["new", "contacted", "qualified", "viewing_scheduled", "offer_made", "won", "lost", "closed"];

function AdminInquiries() {
  const { data: inquiries = [] } = useQuery(adminInquiriesQuery);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? inquiries : inquiries.filter((i: any) => i.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
          <p className="text-sm text-muted-foreground">{inquiries.length} total · {inquiries.filter((i: any) => i.status === "new").length} new</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No inquiries found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq: any) => (
            <Card key={inq.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{inq.full_name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{inq.email}{inq.phone ? ` · ${inq.phone}` : ""}</p>
                </div>
                <Badge>{inq.status.replace("_", " ")}</Badge>
              </CardHeader>
              <CardContent className="space-y-1">
                {inq.property && <p className="text-xs text-muted-foreground">Property: {inq.property}</p>}
                {inq.message && <p className="text-sm">{inq.message}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(inq.created_at)} · source: {inq.source}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
