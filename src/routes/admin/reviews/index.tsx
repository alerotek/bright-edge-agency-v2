import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminReviewsQuery, adminLocationsQuery } from "@/lib/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/reviews/")({
  component: AdminReviews,
});

function AdminReviews() {
  const { data: reviews = [] } = useQuery(adminReviewsQuery);
  const { data: locations = [] } = useQuery(adminLocationsQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">{reviews.length} total</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No reviews yet.</TableCell></TableRow>
            ) : (
              reviews.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.rating ? `${r.rating}/5` : "—"}</TableCell>
                  <TableCell><Badge variant={r.status === "published" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{r.published_at ? formatDate(r.published_at) : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
