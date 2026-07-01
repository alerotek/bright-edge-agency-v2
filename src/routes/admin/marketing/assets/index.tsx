import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { marketingAssetsQuery } from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/marketing/assets/")({
  component: AdminMarketingAssets,
});

function AdminMarketingAssets() {
  const { data: assets = [] } = useQuery(marketingAssetsQuery);
  const [q, setQ] = useState("");

  const filtered = q
    ? assets.filter((a: any) => a.title?.toLowerCase().includes(q.toLowerCase()))
    : assets;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketing assets</h1>
          <p className="text-sm text-muted-foreground">{assets.length} total</p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/marketing/assets/new"><Plus className="h-4 w-4" /> New asset</Link>
        </Button>
      </div>

      <Input placeholder="Search by title..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Linked to</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No assets found.</TableCell></TableRow>
            ) : (
              filtered.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title || "Untitled"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.asset_type || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.provider || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.property?.title ?? a.agent?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/admin/marketing/assets/$id" params={{ id: a.id }}><Pencil className="h-4 w-4" /></Link>
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
