import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Home, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(3, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(9, "Enter your phone number"),
  property_address: z.string().trim().min(5, "Enter the property address"),
  property_type: z.string().trim().min(3, "Property type is required"),
  listing_type: z.enum(["sale", "rent"]),
  price: z.coerce.number().min(1, "Enter the expected price"),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  message: z.string().trim().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/list-property")({
  head: () => ({
    meta: [
      { title: "List Your Property | Bright Edge Agency" },
      {
        name: "description",
        content: "List your property with Bright Edge Agency. Professional marketing, verified agents, and qualified leads.",
      },
    ],
    links: [{ rel: "canonical", href: "/list-property" }],
  }),
  component: ListPropertyPage,
});

function ListPropertyPage() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase.from("contact_requests").insert({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        subject: `Property Listing Request - ${values.listing_type.toUpperCase()}`,
        message: `
Property Address: ${values.property_address}
Property Type: ${values.property_type}
Listing Type: ${values.listing_type}
Expected Price: KES ${values.price.toLocaleString()}
Bedrooms: ${values.bedrooms || 'N/A'}
Bathrooms: ${values.bathrooms || 'N/A'}

Additional Notes:
${values.message || 'None'}
        `.trim(),
        status: "new",
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success("Property listing request submitted successfully!");
    } catch (error: any) {
      toast.error("Failed to submit request", {
        description: error.message || "Please try again or contact us directly.",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/30 py-20">
        <div className="mx-auto max-w-2xl px-4">
          <Card className="text-center">
            <CardContent className="p-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="font-display text-3xl font-semibold">Request Submitted</h2>
              <p className="mt-4 text-muted-foreground">
                Our team will review your property details and contact you within 24 hours to discuss the next steps.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button asChild variant="outline">
                  <Link to="/">Return Home</Link>
                </Button>
                <Button asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-semibold">List Your Property</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Get professional marketing and access to qualified buyers and renters
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              Tell us about your property and we'll connect you with a verified Bright Edge agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" {...form.register("full_name")} placeholder="Your name" />
                    {form.formState.errors.full_name && (
                      <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" {...form.register("phone")} placeholder="+254 XXX XXX XXX" />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" {...form.register("email")} placeholder="you@email.com" />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Property Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="property_address">Property Address *</Label>
                  <Input id="property_address" {...form.register("property_address")} placeholder="Full address including area" />
                  {form.formState.errors.property_address && (
                    <p className="text-xs text-destructive">{form.formState.errors.property_address.message}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="property_type">Property Type *</Label>
                    <Input id="property_type" {...form.register("property_type")} placeholder="e.g. Apartment, House, Villa" />
                    {form.formState.errors.property_type && (
                      <p className="text-xs text-destructive">{form.formState.errors.property_type.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="listing_type">Listing Type *</Label>
                    <select
                      id="listing_type"
                      {...form.register("listing_type")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                    {form.formState.errors.listing_type && (
                      <p className="text-xs text-destructive">{form.formState.errors.listing_type.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Expected Price (KES) *</Label>
                  <Input id="price" type="number" {...form.register("price")} placeholder="e.g. 15000000" />
                  {form.formState.errors.price && (
                    <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input id="bedrooms" type="number" min={0} {...form.register("bedrooms")} placeholder="e.g. 3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input id="bathrooms" type="number" min={0} {...form.register("bathrooms")} placeholder="e.g. 2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Additional Details (Optional)</Label>
                  <Textarea
                    id="message"
                    {...form.register("message")}
                    rows={3}
                    placeholder="Any additional information about your property..."
                    className="resize-none"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Submit Request <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By submitting this form, you agree to be contacted by a Bright Edge agent regarding your property listing.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Professional Marketing</p>
              <p className="text-sm text-muted-foreground">High-quality photos and listings</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Wide Reach</p>
              <p className="text-sm text-muted-foreground">Access to our buyer network</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Verified Agents</p>
              <p className="text-sm text-muted-foreground">Work with trusted professionals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
