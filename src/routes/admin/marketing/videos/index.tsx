import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { useState } from "react";
import { socialVideosQuery } from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/marketing/videos/")({
  component: AdminSocialVideos,
});

function AdminSocialVideos() {
  const { data: videos = [] } = useQuery(socialVideosQuery);
  const [q, setQ] = useState("");

  const filtered = q
    ? videos.filter((v: any) => v.title?.toLowerCase().includes(q.toLowerCase()))
    : videos;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Social videos</h1>
          <p className="text-sm text-muted-foreground">{videos.length} total</p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/marketing/videos/new"><Plus className="h-4 w-4" /> New video</Link>
        </Button>
      </div>

      <Input placeholder="Search by title..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Linked to</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No videos found.</TableCell></TableRow>
            ) : (
              filtered.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.title || "Untitled"}</TableCell>
                  <TableCell className="text-muted-foreground">{v.provider || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={v.published ? "default" : "secondary"}>{v.published ? "Published" : "Draft"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.property?.title ?? v.agent?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/admin/marketing/videos/$id" params={{ id: v.id }}><Pencil className="h-4 w-4" /></Link>
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
