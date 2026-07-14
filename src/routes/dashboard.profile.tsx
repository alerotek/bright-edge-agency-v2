import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Save
} from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().trim().min(3, "Enter your full name"),
  bio: z.string().trim().max(500).optional(),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
  whatsapp: z.string().trim().min(9, "Enter your WhatsApp number"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export const Route = createFileRoute("/dashboard/profile")({
  component: AgentProfile,
});

function AgentProfile() {
  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return data;
    },
  });

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: agent?.full_name || "",
      bio: agent?.bio || "",
      phone: agent?.phone || "",
      whatsapp: agent?.whatsapp || "",
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("agents")
      .update({
        full_name: values.full_name,
        bio: values.bio,
        phone: values.phone,
        whatsapp: values.whatsapp,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated successfully");
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading profile...</div>;

  if (!agent) return <div className="p-12 text-center text-muted-foreground">Profile not found</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your agent profile and verification status.</p>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className={agent.verification_status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}>
                  {agent.verification_status}
                </Badge>
                {agent.public_badge && (
                  <Badge variant="outline">Public Badge Active</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {agent.verification_status === 'verified' 
                  ? 'Your account is verified and your profile is visible to the public.'
                  : 'Your account is pending verification. Complete your onboarding to get verified.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...form.register("full_name")} className="mt-1" />
              {form.formState.errors.full_name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...form.register("bio")}
                rows={3}
                placeholder="Tell clients about your experience and expertise..."
                className="mt-1 resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} className="mt-1" />
                {form.formState.errors.phone && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" {...form.register("whatsapp")} className="mt-1" />
                {form.formState.errors.whatsapp && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.whatsapp.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={agent.email} disabled className="mt-1 bg-muted" />
              </div>

              <div>
                <Label htmlFor="license">License Number</Label>
                <Input id="license" value={agent.license_number || "Not provided"} disabled className="mt-1 bg-muted" />
              </div>
            </div>

            <div>
              <Label htmlFor="areas">Areas of Operation</Label>
              <Input id="areas" value={agent.areas_of_operation || "Not provided"} disabled className="mt-1 bg-muted" />
            </div>

            <Button type="submit" className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Contact Info Display */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{agent.phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{agent.email}</span>
          </div>
          {agent.address && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{agent.address}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
