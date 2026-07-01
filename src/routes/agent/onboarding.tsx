import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { currentAgentQuery } from "@/lib/agent-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  AgentOnboardingState,
  initialOnboardingState,
  STEP_ORDER,
  STEP_LABELS,
  currentStepIndex,
  validateForSubmit,
  AreaDraft,
  SocialAccountDraft,
  DocumentDraft,
} from "@/lib/agent-onboarding/state";
import {
  generateOtpCode,
  buildWhatsappOtpLink,
  verifyOtpCode,
} from "@/lib/agent-onboarding/otp";
import { uploadAgentImage } from "@/lib/agent-onboarding/documents";
import { toast } from "sonner";
import {
  Check,
  Upload,
  User,
  Smartphone,
  MapPin,
  Share2,
  FileText,
  AlertCircle,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Mail,
  Camera,
  Shield,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "@/integrations/supabase/types-v2"; // Trigger module augmentation

export const Route = createFileRoute("/agent/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: "/agent/onboarding" } });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(currentAgentQuery),
  component: AgentOnboarding,
});

function AgentOnboarding() {
  const { data: agent } = useQuery(currentAgentQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [state, setState] = useState<AgentOnboardingState>(initialOnboardingState);
  const [activeStep, setActiveStep] = useState(0);
  const [otpInput, setOtpInput] = useState("");
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Sync initial state from agent data and session
  useEffect(() => {
    const syncData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (agent && user) {
        setState((prev) => ({
          ...prev,
          email: agent.email || user.email || "",
          fullName: agent.full_name || user.user_metadata?.full_name || "",
          phone: agent.phone || user.phone || "",
          emailVerified: !!user.email_confirmed_at,
          emailVerifiedAt: user.email_confirmed_at || null,
          position: agent.position || "",
          bio: agent.bio || "",
          licenseNumber: agent.license_number || "",
          licenseExpiry: agent.license_expiry || "",
          teamName: agent.team_name || "",
        }));
      }
    };
    syncData();
  }, [agent]);

  const index = currentStepIndex(state);
  const { ok: canSubmit, issues: validationIssues } = useMemo(() => validateForSubmit(state), [state]);

  // Allow user to navigate to any step up to their current progress or current active step
  const canNavigateTo = (stepIdx: number) => stepIdx <= index || stepIdx === activeStep;

  const updateState = (updates: Partial<AgentOnboardingState>) => {
    setState((s) => ({ ...s, ...updates }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!agent) throw new Error("No agent profile found to update.");
      const { ok, issues } = validateForSubmit(state);
      if (!ok) throw new Error(issues.join(" "));

      // 1. Update Agent Table with core details
      const { error: agentError } = await (supabase.from("agents") as any).update({
        bio: state.bio,
        position: state.position,
        license_number: state.licenseNumber,
        license_expiry: state.licenseExpiry || null,
        team_name: state.teamName,
        phone: state.phone,
        specializations: state.specializations,
        languages: state.languages,
        years_experience: state.yearsExperience,
        onboarding_completed: true,
        verification_status: "under_review",
      }).eq("id", (agent as any).id);
      if (agentError) throw agentError;

      // 2. Batch insert Areas
      if (state.areas.length > 0) {
        const { error: areaError } = await (supabase.from("agent_areas") as any).insert(
          state.areas.map(a => ({
            agent_id: (agent as any).id,
            country: a.country,
            county: a.county,
            town: a.town,
            neighbourhood: a.neighbourhood
          }))
        );
        if (areaError) throw areaError;
      }

      // 3. Batch insert Socials
      if (state.socials.length > 0) {
        const { error: socialError } = await (supabase.from("agent_social_accounts") as any).insert(
          state.socials.map(s => ({
            agent_id: (agent as any).id,
            platform: s.platform,
            handle: s.handle,
            url: s.url
          }))
        );
        if (socialError) throw socialError;
      }

      // 4. Create the verification record with document links
      const { error: verifError } = await (supabase.from("agent_verifications") as any).insert({
        agent_id: (agent as any).id,
        status: "under_review",
        documents: [
          ...state.identityDocuments,
          state.selfie,
          state.profilePhoto
        ].filter(Boolean)
      });
      if (verifError) throw verifError;

      // 5. Final verification step log
      await (supabase.from("agent_verification_steps") as any).insert(
        STEP_ORDER.map(step => ({
          agent_id: (agent as any).id,
          step,
          status: "completed"
        }))
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent", "current"] });
      toast.success("Onboarding submitted for review!");
      updateState({ submittedAt: new Date().toISOString() });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit onboarding");
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: "national_id_front" | "national_id_back" | "selfie" | "profile_photo") => {
    const file = e.target.files?.[0];
    if (!file || !agent) return;

    setIsUploading(kind);
    try {
      const result = await uploadAgentImage({ agentId: (agent as any).id, kind, file });
      const doc: DocumentDraft = {
        kind,
        storage_path: result.path,
        public_url: result.publicUrl,
        mime_type: file.type,
        byte_size: file.size,
      };

      if (kind === "national_id_front" || kind === "national_id_back") {
        updateState({
          identityDocuments: [
            ...state.identityDocuments.filter(d => d.kind !== kind),
            doc
          ]
        });
      } else if (kind === "selfie") {
        updateState({ selfie: doc });
      } else if (kind === "profile_photo") {
        updateState({ profilePhoto: doc });
      }
      toast.success(`${kind.replace(/_/g, " ")} uploaded!`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(null);
    }
  };

  const nextStep = () => {
    if (activeStep < STEP_ORDER.length - 1) {
      setActiveStep(activeStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const progress = ((activeStep + 1) / STEP_ORDER.length) * 100;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Agent Onboarding</h1>
        <p className="mt-3 text-lg text-muted-foreground">Complete your professional profile to join the Bright Edge network.</p>
      </div>

      <div className="mb-10 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">{STEP_LABELS[STEP_ORDER[activeStep]]}</span>
          <span className="text-muted-foreground font-medium">Step {activeStep + 1} of {STEP_ORDER.length}</span>
        </div>
        <Progress value={progress} className="h-2.5 rounded-full" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Step Navigation Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1.5">
            {STEP_ORDER.map((step, i) => {
              const isCompleted = i < index;
              const isActive = i === activeStep;
              const isLocked = !canNavigateTo(i);

              return (
                <button
                  key={step}
                  disabled={isLocked}
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all text-left",
                    isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    isLocked && "opacity-40 cursor-not-allowed grayscale",
                    isCompleted && !isActive && "text-primary/80"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isActive ? "border-primary-foreground bg-primary-foreground text-primary" : "border-muted-foreground/30",
                    isCompleted && !isActive && "bg-primary border-primary text-primary-foreground"
                  )}>
                    {isCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </div>
                  {STEP_LABELS[step]}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Step Content Area */}
        <main className="min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeStep === 0 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    Welcome & Basic Info
                  </CardTitle>
                  <CardDescription>Verify your identity and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Legal Full Name</Label>
                    <Input id="fullName" value={state.fullName} disabled className="bg-muted/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={state.email} disabled className="bg-muted/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input id="phone" value={state.phone} onChange={(e) => updateState({ phone: e.target.value })} placeholder="+254..." />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={nextStep} className="w-full py-6 text-base shadow-sm">
                    Continue to Verification
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeStep === 1 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    Email Verification
                  </CardTitle>
                  <CardDescription>Confirming your email authenticity.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className={cn(
                    "mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-colors",
                    state.emailVerified ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {state.emailVerified ? <Check className="h-10 w-10" strokeWidth={2.5} /> : <AlertCircle className="h-10 w-10" />}
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {state.emailVerified ? "Email Confirmed" : "Action Required"}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    {state.emailVerified
                      ? `Your email (${state.email}) has been successfully verified.`
                      : "We've sent a verification link to your email. Please click it to continue."}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
                  <Button onClick={nextStep} disabled={!state.emailVerified} className="flex-[2]">
                    Continue to Phone Verification
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeStep === 2 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Phone Verification
                  </CardTitle>
                  <CardDescription>Connect via WhatsApp to receive your security code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {!state.phoneVerified ? (
                    <>
                      <div className="rounded-2xl bg-muted/50 p-6 text-center space-y-4">
                        <p className="text-sm font-medium">Step 1: Get Code</p>
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-green-600 bg-white text-green-600 hover:bg-green-50 hover:text-green-700 shadow-sm"
                          onClick={() => {
                            const code = generateOtpCode();
                            updateState({ whatsappOtpCode: code });
                            window.open(buildWhatsappOtpLink({
                              agentName: state.fullName,
                              agentPhone: state.phone,
                              code
                            }), "_blank");
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Send Code via WhatsApp
                        </Button>
                      </div>

                      <div className="flex flex-col items-center space-y-6 pt-2">
                        <Label className="text-sm font-medium">Step 2: Enter 6-digit Code</Label>
                        <InputOTP maxLength={6} value={otpInput} onChange={setOtpInput}>
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} className="h-12 w-10 rounded-lg border-2" />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                        <Button
                          className="w-full shadow-md"
                          disabled={otpInput.length !== 6}
                          onClick={() => {
                            if (verifyOtpCode(otpInput, state.whatsappOtpCode || "")) {
                              updateState({ phoneVerified: true, phoneVerifiedAt: new Date().toISOString() });
                              toast.success("Phone verified!");
                            } else {
                              toast.error("Invalid verification code");
                            }
                          }}
                        >
                          Verify Number
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-10 w-10" strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-semibold tracking-tight">Phone Verified</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{state.phone}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
                  <Button onClick={nextStep} disabled={!state.phoneVerified} className="flex-[2]">
                    Continue to ID Upload
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeStep === 3 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    National ID
                  </CardTitle>
                  <CardDescription>Upload clear photos of your official identification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <DocumentUploadField
                      label="Front View"
                      kind="national_id_front"
                      doc={state.identityDocuments.find(d => d.kind === "national_id_front")}
                      onUpload={(e) => handleFileUpload(e, "national_id_front")}
                      isUploading={isUploading === "national_id_front"}
                    />
                    <DocumentUploadField
                      label="Back View"
                      kind="national_id_back"
                      doc={state.identityDocuments.find(d => d.kind === "national_id_back")}
                      onUpload={(e) => handleFileUpload(e, "national_id_back")}
                      isUploading={isUploading === "national_id_back"}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
                  <Button onClick={nextStep} disabled={state.identityDocuments.length < 2} className="flex-[2]">
                    Continue to Photo Verification
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeStep === 4 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-primary" />
                    Selfie & Photo
                  </CardTitle>
                  <CardDescription>A live selfie and your professional profile image.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <DocumentUploadField
                      label="Identity Selfie"
                      kind="selfie"
                      doc={state.selfie}
                      onUpload={(e) => handleFileUpload(e, "selfie")}
                      isUploading={isUploading === "selfie"}
                      description="Ensure your face is clearly visible."
                    />
                    <DocumentUploadField
                      label="Professional Portrait"
                      kind="profile_photo"
                      doc={state.profilePhoto}
                      onUpload={(e) => handleFileUpload(e, "profile_photo")}
                      isUploading={isUploading === "profile_photo"}
                      description="This will be visible on your listings."
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
                  <Button onClick={nextStep} disabled={!state.selfie || !state.profilePhoto} className="flex-[2]">
                    Continue to Operating Areas
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeStep === 5 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    Areas of Operation
                  </CardTitle>
                  <CardDescription>Select the regions where you provide real estate services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <AreaForm onAdd={(area) => updateState({ areas: [...state.areas, area] })} />

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold tracking-tight">Active Coverage</Label>
                    {state.areas.length === 0 ? (
                      <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted bg-muted/10">
                        <p className="text-sm text-muted-foreground italic">Add your first area above to continue.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {state.areas.map((area, i) => (
                          <div key={i} className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground leading-none">{area.neighbourhood}, {area.town}</p>
                              <p className="text-xs font-medium text-muted-foreground">{area.county}, {area.country}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:bg-destructive/10"
                              onClick={() => updateState({ areas: state.areas.filter((_, idx) => idx !== i) })}
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
                  <Button onClick={nextStep} disabled={state.areas.length === 0} className="flex-[2]">
                    Continue to Social Links
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeStep === 6 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Share2 className="h-5 w-5 text-primary" />
                    Social Media
                  </CardTitle>
                  <CardDescription>Link your professional social channels to boost credibility.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <SocialForm onAdd={(social) => updateState({ socials: [...state.socials, social] })} />

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold tracking-tight">Linked Profiles</Label>
                    {state.socials.length === 0 ? (
                      <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted bg-muted/10">
                        <p className="text-sm text-muted-foreground italic">Connect at least one social profile.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {state.socials.map((social, i) => (
                          <div key={i} className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary">
                                <SocialIcon platform={social.platform} />
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold uppercase text-xs tracking-wider text-primary">{social.platform}</p>
                                <p className="text-sm font-medium text-foreground">{social.handle}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:bg-destructive/10"
                              onClick={() => updateState({ socials: state.socials.filter((_, idx) => idx !== i) })}
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
                  <Button onClick={nextStep} disabled={state.socials.length === 0} className="flex-[2]">
                    Continue to Final Details
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeStep === 7 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    Professional Details
                  </CardTitle>
                  <CardDescription>Tell us more about your experience and expertise.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="licenseNumber">Real Estate License #</Label>
                      <Input id="licenseNumber" value={state.licenseNumber} onChange={(e) => updateState({ licenseNumber: e.target.value })} placeholder="REA/12345" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="licenseExpiry">License Expiry Date</Label>
                      <Input id="licenseExpiry" type="date" value={state.licenseExpiry} onChange={(e) => updateState({ licenseExpiry: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Professional Bio (Min 40 chars)</Label>
                    <Textarea
                      id="bio"
                      value={state.bio}
                      onChange={(e) => updateState({ bio: e.target.value })}
                      rows={5}
                      className="resize-none"
                      placeholder="Share your background, achievements, and unique value proposition..."
                    />
                    <div className="flex items-center justify-between px-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      <span>{state.bio.length < 40 ? "Minimum required length" : "Length looks good"}</span>
                      <span className={cn(state.bio.length < 40 ? "text-destructive" : "text-primary")}>
                        {state.bio.length} / 40
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="position">Position / Role</Label>
                      <Input id="position" value={state.position} onChange={(e) => updateState({ position: e.target.value })} placeholder="e.g. Senior Sales Executive" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input id="experience" type="number" value={state.yearsExperience || ""} onChange={(e) => updateState({ yearsExperience: parseInt(e.target.value) || null })} placeholder="e.g. 5" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="languages">Languages Spoken</Label>
                    <Input
                      id="languages"
                      value={state.languages.join(", ")}
                      onChange={(e) => updateState({ languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      placeholder="English, Swahili, etc."
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
                  <Button onClick={nextStep} disabled={state.bio.length < 40 || !state.licenseNumber} className="flex-[2]">
                    Review Application
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeStep >= 8 && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    Final Submission
                  </CardTitle>
                  <CardDescription>Review your application summary before submitting for review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 py-6">
                  {!state.submittedAt ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold tracking-tight text-foreground text-center">Ready to Apply</h3>
                        <p className="mx-auto max-w-sm text-sm text-muted-foreground text-center">
                          Your application will be manually reviewed by our compliance team.
                        </p>
                      </div>

                      {!canSubmit && (
                        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
                          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                            <XCircle className="h-4 w-4" />
                            <span>Blocking Issues ({validationIssues.length})</span>
                          </div>
                          <ul className="grid gap-1.5 list-disc list-inside">
                            {validationIssues.map((issue, i) => (
                              <li key={i} className="text-xs text-destructive/80 font-medium">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="rounded-2xl bg-muted/30 p-5 text-left text-sm space-y-3 border shadow-inner">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Full Name:</span>
                          <span className="font-semibold">{state.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Coverage:</span>
                          <span className="font-semibold">{state.areas.length} Areas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Social Accounts:</span>
                          <span className="font-semibold">{state.socials.length} Linked</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary animate-in zoom-in-50 duration-500">
                        <Check className="h-12 w-12" strokeWidth={3} />
                      </div>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">Thank You, {state.fullName.split(" ")[0]}!</h3>
                      <p className="mt-4 max-w-md text-base text-muted-foreground">
                        Your professional profile is now in our system and under review. We'll notify you via email once your account is fully verified.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-4">
                  {!state.submittedAt ? (
                    <>
                      <Button variant="outline" onClick={prevStep} className="flex-1">Back</Button>
                      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit} className="flex-[2] py-6 text-lg shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]">
                        {mutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                        Submit Application
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => navigate({ to: "/" })} className="w-full py-6 text-lg shadow-sm">
                      Go to Agency Home
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function DocumentUploadField({ label, kind, doc, onUpload, isUploading, description }: {
  label: string;
  kind: string;
  doc: DocumentDraft | null | undefined;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-foreground/80">{label}</Label>
      <div className={cn(
        "relative flex aspect-[16/10] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted transition-all duration-300 hover:border-primary/40 hover:bg-primary/5",
        doc && "border-primary/40 bg-primary/5",
        isUploading && "animate-pulse"
      )}>
        {doc ? (
          <>
            <img src={doc.public_url} alt={label} className="h-full w-full rounded-2xl object-cover p-1" />
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Label className="cursor-pointer rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black shadow-lg transition-transform active:scale-95">
                Change Image
                <Input type="file" className="hidden" accept="image/*" onChange={onUpload} />
              </Label>
            </div>
          </>
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-8 text-center">
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Uploading...</span>
              </div>
            ) : (
              <>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary shadow-inner">
                  <Upload className="h-7 w-7" />
                </div>
                <p className="text-sm font-bold text-foreground">Click to upload image</p>
                <p className="mt-1.5 max-w-[140px] text-[10px] font-medium leading-relaxed text-muted-foreground uppercase tracking-widest">
                  {description || "JPG, PNG or WEBP up to 8MB"}
                </p>
              </>
            )}
            <Input type="file" className="hidden" accept="image/*" onChange={onUpload} disabled={isUploading} />
          </label>
        )}
      </div>
    </div>
  );
}

function AreaForm({ onAdd }: { onAdd: (area: AreaDraft) => void }) {
  const [form, setForm] = useState<AreaDraft>({
    country: "Kenya",
    county: "",
    town: "",
    neighbourhood: "",
  });

  return (
    <div className="grid gap-5 rounded-2xl border border-primary/10 bg-primary/5 p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">County</Label>
          <Input className="bg-white shadow-sm" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="e.g. Nairobi" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Town</Label>
          <Input className="bg-white shadow-sm" value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} placeholder="e.g. Kilimani" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Neighbourhood</Label>
        <Input className="bg-white shadow-sm" value={form.neighbourhood} onChange={(e) => setForm({ ...form, neighbourhood: e.target.value })} placeholder="e.g. Argwings Kodhek" />
      </div>
      <Button
        className="w-full shadow-md"
        disabled={!form.county || !form.town || !form.neighbourhood}
        onClick={() => {
          onAdd(form);
          setForm({ country: "Kenya", county: "", town: "", neighbourhood: "" });
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Coverage Area
      </Button>
    </div>
  );
}

function SocialForm({ onAdd }: { onAdd: (social: SocialAccountDraft) => void }) {
  const [form, setForm] = useState<SocialAccountDraft>({
    platform: "instagram",
    handle: "",
    url: "",
  });

  const platforms: SocialAccountDraft["platform"][] = ["instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok", "website"];

  return (
    <div className="grid gap-5 rounded-2xl border border-primary/10 bg-primary/5 p-6">
      <div className="grid gap-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform</Label>
        <select
          className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={form.platform}
          onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
        >
          {platforms.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Handle</Label>
          <Input className="bg-white shadow-sm" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="@username" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full URL</Label>
          <Input className="bg-white shadow-sm" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
        </div>
      </div>
      <Button
        className="w-full shadow-md"
        disabled={!form.handle || !form.url}
        onClick={() => {
          onAdd(form);
          setForm({ platform: "instagram", handle: "", url: "" });
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> Link Social Account
      </Button>
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "facebook": return <Facebook className="h-5 w-5" />;
    case "instagram": return <Instagram className="h-5 w-5" />;
    case "twitter": return <Twitter className="h-5 w-5" />;
    case "linkedin": return <Linkedin className="h-5 w-5" />;
    case "youtube": return <Youtube className="h-5 w-5" />;
    default: return <Globe className="h-5 w-5" />;
  }
}
