import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminLocationsQuery } from "@/lib/admin-queries";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/admin/locations/")({
  component: AdminLocations,
});

function AdminLocations() {
  const qc = useQueryClient();
  const { data: locations = [] } = useQuery(adminLocationsQuery);
  const [name, setName] = useState("");

  const addLocation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("locations").insert({ name, slug: slugify(name) });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "locations"] });
      setName("");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
        <p className="text-sm text-muted-foreground">{locations.length} total</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add location</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); addLocation.mutate(); }} className="flex gap-2">
            <Input placeholder="e.g. Westlands" value={name} onChange={(e) => setName(e.target.value)} required />
            <Button type="submit" disabled={addLocation.isPending}>Add</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Region</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">No locations yet.</TableCell></TableRow>
            ) : (
              locations.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{l.region ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
