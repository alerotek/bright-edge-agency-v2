import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { adminPropertiesQuery } from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/admin/properties/")({
  component: AdminProperties,
});

function AdminProperties() {
  const { data: properties = [] } = useQuery(adminPropertiesQuery);
  const [q, setQ] = useState("");

  const filtered = q
    ? properties.filter((p: any) => p.title?.toLowerCase().includes(q.toLowerCase()))
    : properties;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-sm text-muted-foreground">{properties.length} total</p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/properties/new"><Plus className="h-4 w-4" /> New property</Link>
        </Button>
      </div>

      <Input placeholder="Search by title..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No properties found.</TableCell></TableRow>
            ) : (
              filtered.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground">{p.location?.name ?? "—"}</TableCell>
                  <TableCell>{formatPrice(p.price, p.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={p.publish_status === "published" ? "default" : "secondary"}>
                      {p.publish_status === "published" ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                      {p.publish_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.agent?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/admin/properties/$id" params={{ id: p.id }}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
