import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Shield, 
  Briefcase, 
  Upload, 
  Camera, 
  Loader2,
  Lock,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Agent Onboarding | Bright Edge Agency" },
      { name: "description", content: "Apply to become a verified Bright Edge agent. Professional onboarding and verification." },
    ],
  }),
  component: ApplyWizard,
});

// ─── Schema Definitions ────────────────────────────────────

const step1Schema = z.object({
  full_name: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(9, "Valid phone number is required"),
  national_id_number: z.string().min(5, "National ID is required"),
});

const step3Schema = z.object({
  years_experience: z.coerce.number().min(0),
  areas_of_operation: z.string().min(3, "Specify your areas"),
  property_specializations: z.string().min(3, "Specify your specializations"),
  languages_spoken: z.string().min(2, "List languages spoken"),
  whatsapp_number: z.string().min(9, "WhatsApp number is required"),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step3Values = z.infer<typeof step3Schema>;

// ─── Main Wizard Component ─────────────────────────────────

function ApplyWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    id_front?: string;
    id_back?: string;
    selfie?: string;
    profile_photo?: string;
  }>({});
  const [formData, setFormData] = useState<Partial<Step1Values & Step3Values>>({});

  const totalSteps = 4; // 1: Personal, 2: Verification, 3: Professional, 4: Success/Pending
  const progress = (step / totalSteps) * 100;

  const form1 = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });
  const form3 = useForm<Step3Values>({ resolver: zodResolver(step3Schema) });

  const onNextStep1 = async (values: Step1Values) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await (supabase.rpc as any)("check_application_duplicates", {
        _email: values.email,
        _phone: values.phone,
        _national_id: values.national_id_number
      });

      if (error) throw error;
      
      const res = data[0];
      if (res.email_exists) { form1.setError("email", { message: "Email already used" }); return; }
      if (res.phone_exists) { form1.setError("phone", { message: "Phone already used" }); return; }
      if (res.id_exists) { form1.setError("national_id_number", { message: "National ID already used" }); return; }

      setFormData({ ...formData, ...values });
      setStep(2);
    } catch (err) {
      toast.error("Validation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onNextStep2 = () => {
    if (!uploadedFiles.id_front || !uploadedFiles.selfie || !uploadedFiles.profile_photo) {
      toast.error("Please upload all required documents");
      return;
    }
    setStep(3);
  };

  const onFinalSubmit = async (values: Step3Values) => {
    setIsSubmitting(true);
    try {
      const finalData = { ...formData, ...values };
      const { error } = await supabase.from("agent_applications").insert({
        full_name: finalData.full_name,
        email: finalData.email,
        phone: finalData.phone,
        national_id_number: finalData.national_id_number,
        national_id_front_url: uploadedFiles.id_front,
        national_id_back_url: uploadedFiles.id_back,
        selfie_url: uploadedFiles.selfie,
        profile_photo_url: uploadedFiles.profile_photo,
        years_experience: values.years_experience,
        areas_of_operation: [values.areas_of_operation],
        property_specializations: [values.property_specializations],
        languages_spoken: [values.languages_spoken],
        whatsapp_number: values.whatsapp_number,
        social_accounts: {
          facebook: values.facebook,
          instagram: values.instagram,
          tiktok: values.tiktok,
          linkedin: values.linkedin,
          youtube: values.youtube
        },
        status: "pending"
      } as any);

      if (error) throw error;
      setStep(4);
    } catch (err) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof uploadedFiles) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `agent-onboarding/${fileName}`;

    try {
      const { error } = await supabase.storage.from("public").upload(filePath, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("public").getPublicUrl(filePath);
      setUploadedFiles(prev => ({ ...prev, [type]: publicUrl }));
      toast.success("Uploaded successfully");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-semibold">Join Bright Edge</h1>
          <p className="mt-2 text-sm text-muted-foreground">Complete your application to become a verified agent.</p>
          <div className="mt-8 flex items-center gap-4">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Step {step} of {totalSteps}
            </span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-8 flex items-center gap-3 border-b pb-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">Personal Information</h2>
              </div>
              <form onSubmit={form1.handleSubmit(onNextStep1)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input {...form1.register("full_name")} placeholder="Legal Name" />
                    {form1.formState.errors.full_name && <p className="text-xs text-destructive">{form1.formState.errors.full_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">National ID Number</label>
                    <Input {...form1.register("national_id_number")} placeholder="ID or Passport" />
                    {form1.formState.errors.national_id_number && <p className="text-xs text-destructive">{form1.formState.errors.national_id_number.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input type="email" {...form1.register("email")} placeholder="name@agency.com" />
                    {form1.formState.errors.email && <p className="text-xs text-destructive">{form1.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input {...form1.register("phone")} placeholder="+254 XXX XXX XXX" />
                    {form1.formState.errors.phone && <p className="text-xs text-destructive">{form1.formState.errors.phone.message}</p>}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Next Step"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-8 flex items-center gap-3 border-b pb-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">Verification Documents</h2>
              </div>
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">National ID (Front) *</label>
                    <div className="relative aspect-[3/2] overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, "id_front")} accept="image/*" disabled={isSubmitting} />
                      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                        {uploadedFiles.id_front ? (
                          <img src={uploadedFiles.id_front} className="h-full w-full object-cover rounded-lg" alt="ID Front" />
                        ) : (
                          <><Upload className="h-8 w-8 text-muted-foreground" /><span className="mt-2 text-xs text-muted-foreground">Click to upload</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">National ID (Back)</label>
                    <div className="relative aspect-[3/2] overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, "id_back")} accept="image/*" disabled={isSubmitting} />
                      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                        {uploadedFiles.id_back ? (
                          <img src={uploadedFiles.id_back} className="h-full w-full object-cover rounded-lg" alt="ID Back" />
                        ) : (
                          <><Upload className="h-8 w-8 text-muted-foreground" /><span className="mt-2 text-xs text-muted-foreground">Optional upload</span></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Selfie with ID *</label>
                    <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, "selfie")} accept="image/*" disabled={isSubmitting} />
                      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                        {uploadedFiles.selfie ? (
                          <img src={uploadedFiles.selfie} className="h-full w-full object-cover rounded-lg" alt="Selfie" />
                        ) : (
                          <><Camera className="h-8 w-8 text-muted-foreground" /><span className="mt-2 text-xs text-muted-foreground">Holding your ID</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Profile Photo *</label>
                    <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, "profile_photo")} accept="image/*" disabled={isSubmitting} />
                      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                        {uploadedFiles.profile_photo ? (
                          <img src={uploadedFiles.profile_photo} className="h-full w-full object-cover rounded-lg" alt="Profile" />
                        ) : (
                          <><User className="h-8 w-8 text-muted-foreground" /><span className="mt-2 text-xs text-muted-foreground">Professional photo</span></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isSubmitting}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" onClick={onNextStep2} disabled={isSubmitting}>
                    Next Step <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-8 flex items-center gap-3 border-b pb-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">Professional Profile</h2>
              </div>
              <form onSubmit={form3.handleSubmit(onFinalSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Years of Experience</label>
                    <Input type="number" {...form3.register("years_experience")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">WhatsApp Number</label>
                    <Input {...form3.register("whatsapp_number")} placeholder="+254 XXX XXX XXX" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Areas of Operation</label>
                  <Input {...form3.register("areas_of_operation")} placeholder="e.g. Westlands, Kilimani, Karen" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Specializations</label>
                  <Input {...form3.register("property_specializations")} placeholder="e.g. Luxury Apartments, Commercial" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Languages Spoken</label>
                  <Input {...form3.register("languages_spoken")} placeholder="e.g. English, Swahili" />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={isSubmitting}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete Application"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Clock className="h-10 w-10" />
            </div>
            <h2 className="mt-8 font-display text-3xl font-semibold">Application Pending</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Your application has been submitted successfully and is now pending human review. 
              Our team will verify your identity and credentials within the next 24 hours.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="outline">
                <Link to="/">Back to Homepage</Link>
              </Button>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secure SSL Encryption · Your data is stored securely</span>
          </div>
        )}
      </div>
    </div>
  );
}
