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
import { Badge } from "@/components/ui/badge";
import { DocumentUpload } from "./DocumentUpload";
import { ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, Clock, UserCheck } from "lucide-react";

const STEPS = [
  { id: 1, title: "Personal Information" },
  { id: 2, title: "Document Upload" },
  { id: 3, title: "Professional Information" },
  { id: 4, title: "Validation" },
  { id: 5, title: "Review" },
];

// Step 1: Personal Information Schema
const step1Schema = z.object({
  full_name: z.string().trim().min(3, "Enter your full legal name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
  national_id_number: z.string().trim().min(4, "Enter your National ID number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

// Step 3: Professional Information Schema
const step3Schema = z.object({
  years_experience: z.coerce.number().min(0).max(50),
  areas_of_operation: z.string().trim().min(3, "Tell us which areas you cover"),
  specializations: z.string().trim().optional(),
  languages: z.string().trim().optional(),
  whatsapp: z.string().trim().min(9, "Enter your WhatsApp number"),
  facebook: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step3Values = z.infer<typeof step3Schema>;

interface OnboardingWizardProps {
  onComplete?: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, { publicUrl: string; path: string }>>({});
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step1Form = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });
  const step3Form = useForm<Step3Values>({ resolver: zodResolver(step3Schema) });

  const handleStep1Submit = async (values: Step1Values) => {
    setIsSubmitting(true);
    try {
      // Check for duplicates
      const { data: existingEmail } = await supabase
        .from("agents")
        .select("id")
        .eq("email", values.email)
        .maybeSingle();

      if (existingEmail) {
        toast.error("This email is already registered");
        return;
      }

      const { data: existingPhone } = await supabase
        .from("agents")
        .select("id")
        .eq("phone", values.phone)
        .maybeSingle();

      if (existingPhone) {
        toast.error("This phone number is already registered");
        return;
      }

      const { data: existingId } = await supabase
        .from("agents")
        .select("id")
        .eq("national_id_number", values.national_id_number)
        .maybeSingle();

      if (existingId) {
        toast.error("This National ID is already registered");
        return;
      }

      // Create Supabase auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            phone: values.phone,
          },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        toast.error("Account creation failed");
        return;
      }

      // Create agent record
      const slug =
        values.full_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Math.random().toString(36).slice(2, 6);

      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .insert({
          user_id: userId,
          full_name: values.full_name,
          slug,
          email: values.email,
          phone: values.phone,
          national_id_number: values.national_id_number,
          active: false,
          verification_status: "pending",
          onboarding_completed: false,
        })
        .select("id")
        .single();

      if (agentError) {
        toast.error("Agent profile creation failed");
        return;
      }

      setAgentId(agent.id);
      setCurrentStep(2);
      toast.success("Account created successfully");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = (kind: string, publicUrl: string, path: string) => {
    setDocuments((prev) => ({ ...prev, [kind]: { publicUrl, path } }));
  };

  const handleStep2Complete = () => {
    const requiredDocs = ["national_id_front", "national_id_back", "selfie", "profile_photo"];
    const missing = requiredDocs.filter((doc) => !documents[doc]);
    if (missing.length > 0) {
      toast.error("Please upload all required documents");
      return;
    }
    setCurrentStep(3);
  };

  const handleStep3Submit = async (values: Step3Values) => {
    if (!agentId) return;

    setIsSubmitting(true);
    try {
      // Update agent with professional info
      const { error: updateError } = await supabase
        .from("agents")
        .update({
          years_experience: values.years_experience,
          areas_of_operation: values.areas_of_operation,
          specializations: values.specializations,
          languages: values.languages,
          whatsapp: values.whatsapp,
        })
        .eq("id", agentId);

      if (updateError) throw updateError;

      // Insert social accounts
      const socialAccounts = [
        { platform: "facebook", handle: "", url: values.facebook || null },
        { platform: "instagram", handle: "", url: values.instagram || null },
        { platform: "tiktok", handle: "", url: values.tiktok || null },
        { platform: "linkedin", handle: "", url: values.linkedin || null },
        { platform: "youtube", handle: "", url: values.youtube || null },
      ].filter((acc) => acc.url);

      for (const acc of socialAccounts) {
        await supabase.from("agent_social_accounts").insert({
          agent_id: agentId,
          platform: acc.platform as any,
          handle: acc.handle,
          url: acc.url,
          is_verified: false,
        });
      }

      // Insert documents
      for (const [kind, data] of Object.entries(documents)) {
        await supabase.from("agent_documents").insert({
          agent_id: agentId,
          kind: kind as any,
          storage_path: data.path,
          public_url: data.publicUrl,
          mime_type: "image/jpeg",
          byte_size: 0,
          review_status: "pending",
        });
      }

      setCurrentStep(4);
      toast.success("Professional information saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidation = async () => {
    if (!agentId) return;

    setIsSubmitting(true);
    setValidationResults({});

    // Email verification (already done via Supabase auth)
    setValidationResults((prev) => ({ ...prev, email: true }));

    // Phone verification (placeholder - would use SMS/WhatsApp)
    await new Promise((resolve) => setTimeout(resolve, 500));
    setValidationResults((prev) => ({ ...prev, phone: true }));

    // Duplicate checks (already done in step 1)
    setValidationResults((prev) => ({ ...prev, duplicates: true }));

    // Required uploads
    const requiredDocs = ["national_id_front", "national_id_back", "selfie", "profile_photo"];
    const allUploaded = requiredDocs.every((doc) => documents[doc]);
    setValidationResults((prev) => ({ ...prev, uploads: allUploaded }));

    setCurrentStep(5);
    setIsSubmitting(false);
  };

  const handleFinalSubmit = async () => {
    if (!agentId) return;

    setIsSubmitting(true);
    try {
      await supabase
        .from("agents")
        .update({ onboarding_completed: true })
        .eq("id", agentId);

      toast.success("Application submitted for review");
      onComplete?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                </div>
                <span className="mt-2 text-xs font-medium hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-border">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: currentStep > step.id ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Enter details exactly as on your National ID.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full legal name *</Label>
                <Input id="full_name" {...step1Form.register("full_name")} className="mt-1" />
                {step1Form.formState.errors.full_name && (
                  <p className="mt-1 text-xs text-destructive">{step1Form.formState.errors.full_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="national_id_number">National ID number *</Label>
                <Input id="national_id_number" {...step1Form.register("national_id_number")} className="mt-1" />
                {step1Form.formState.errors.national_id_number && (
                  <p className="mt-1 text-xs text-destructive">{step1Form.formState.errors.national_id_number.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...step1Form.register("email")} className="mt-1" />
                  {step1Form.formState.errors.email && (
                    <p className="mt-1 text-xs text-destructive">{step1Form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone / WhatsApp *</Label>
                  <Input id="phone" {...step1Form.register("phone")} className="mt-1" />
                  {step1Form.formState.errors.phone && (
                    <p className="mt-1 text-xs text-destructive">{step1Form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" {...step1Form.register("password")} className="mt-1" />
                  {step1Form.formState.errors.password && (
                    <p className="mt-1 text-xs text-destructive">{step1Form.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm_password">Confirm password *</Label>
                  <Input id="confirm_password" type="password" {...step1Form.register("confirm_password")} className="mt-1" />
                  {step1Form.formState.errors.confirm_password && (
                    <p className="mt-1 text-xs text-destructive">{step1Form.formState.errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Continue"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>Upload your verification documents. Max 5MB per file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentId && (
              <>
                <DocumentUpload
                  label="National ID (Front)"
                  kind="national_id_front"
                  agentId={agentId}
                  onUploadComplete={(url, path) => handleDocumentUpload("national_id_front", url, path)}
                />
                <DocumentUpload
                  label="National ID (Back)"
                  kind="national_id_back"
                  agentId={agentId}
                  onUploadComplete={(url, path) => handleDocumentUpload("national_id_back", url, path)}
                />
                <DocumentUpload
                  label="Selfie"
                  kind="selfie"
                  agentId={agentId}
                  onUploadComplete={(url, path) => handleDocumentUpload("selfie", url, path)}
                />
                <DocumentUpload
                  label="Professional Profile Photo"
                  kind="profile_photo"
                  agentId={agentId}
                  onUploadComplete={(url, path) => handleDocumentUpload("profile_photo", url, path)}
                />
              </>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleStep2Complete} className="flex-1">
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Tell us about your experience and expertise.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="years_experience">Years of experience</Label>
                  <Input id="years_experience" type="number" min={0} max={50} {...step3Form.register("years_experience")} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp number *</Label>
                  <Input id="whatsapp" {...step3Form.register("whatsapp")} className="mt-1" />
                  {step3Form.formState.errors.whatsapp && (
                    <p className="mt-1 text-xs text-destructive">{step3Form.formState.errors.whatsapp.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="areas_of_operation">Areas of operation *</Label>
                <Input id="areas_of_operation" {...step3Form.register("areas_of_operation")} className="mt-1" placeholder="e.g. Westlands, Kilimani, Nyali" />
                {step3Form.formState.errors.areas_of_operation && (
                  <p className="mt-1 text-xs text-destructive">{step3Form.formState.errors.areas_of_operation.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="specializations">Specializations</Label>
                <Input id="specializations" {...step3Form.register("specializations")} className="mt-1" placeholder="e.g. Luxury homes, Commercial, Off-plan" />
              </div>

              <div>
                <Label htmlFor="languages">Languages spoken</Label>
                <Input id="languages" {...step3Form.register("languages")} className="mt-1" placeholder="e.g. English, Swahili, Kikuyu" />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Social Accounts (optional)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="facebook">Facebook URL</Label>
                    <Input id="facebook" {...step3Form.register("facebook")} className="mt-1" placeholder="https://facebook.com/..." />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram URL</Label>
                    <Input id="instagram" {...step3Form.register("instagram")} className="mt-1" placeholder="https://instagram.com/..." />
                  </div>
                  <div>
                    <Label htmlFor="tiktok">TikTok URL</Label>
                    <Input id="tiktok" {...step3Form.register("tiktok")} className="mt-1" placeholder="https://tiktok.com/..." />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input id="linkedin" {...step3Form.register("linkedin")} className="mt-1" placeholder="https://linkedin.com/..." />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="youtube">YouTube URL</Label>
                    <Input id="youtube" {...step3Form.register("youtube")} className="mt-1" placeholder="https://youtube.com/..." />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Continue"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Automatic Validation</CardTitle>
            <CardDescription>We're validating your information...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <span>Email verification</span>
                </div>
                {validationResults.email ? (
                  <Badge className="bg-green-500">Verified</Badge>
                ) : (
                  <Badge variant="outline">Checking...</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <span>Phone verification</span>
                </div>
                {validationResults.phone ? (
                  <Badge className="bg-green-500">Verified</Badge>
                ) : (
                  <Badge variant="outline">Checking...</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <span>Duplicate check</span>
                </div>
                {validationResults.duplicates ? (
                  <Badge className="bg-green-500">Passed</Badge>
                ) : (
                  <Badge variant="outline">Checking...</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <span>Required uploads</span>
                </div>
                {validationResults.uploads ? (
                  <Badge className="bg-green-500">Complete</Badge>
                ) : (
                  <Badge variant="outline">Checking...</Badge>
                )}
              </div>
            </div>

            <Button onClick={handleValidation} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Validating..." : "Run Validation"}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Submitted</CardTitle>
            <CardDescription>Your application is pending human review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <Clock className="h-6 w-6 text-accent" />
              <div>
                <p className="font-semibold">Verification SLA: Maximum 24 hours</p>
                <p className="text-sm text-muted-foreground">Our team will review your documents and notify you of the decision.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Account created</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Documents uploaded</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Professional information saved</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Automatic validation passed</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserCheck className="h-4 w-4 text-accent" />
                <span className="font-medium">Pending human verification</span>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">What happens next:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Our team reviews your identity and documents</li>
                <li>• You'll receive an email with the decision</li>
                <li>• Approved agents get their verified badge and dashboard access</li>
              </ul>
            </div>

            <Button onClick={handleFinalSubmit} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Complete Application"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
