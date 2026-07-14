/**
 * Email OTP Verification Component
 * --------------------------------------------------------------
 * Replaces the old WhatsApp-based OTP with Resend email OTP.
 * Agent enters email → receives code → verifies → phone/email marked verified.
 */

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { sendOtpEmail, verifyOtpCode } from "@/lib/email/send-otp";

interface OtpVerificationProps {
  email: string;
  agentName: string;
  onVerified: () => void;
}

export function OtpVerification({ email, agentName, onVerified }: OtpVerificationProps) {
  const [step, setStep] = useState<"send" | "verify" | "done">("send");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSendCode = async () => {
    setSending(true);
    try {
      const result = await sendOtpEmail({ data: { email, agentName, purpose: "onboarding" } });
      if (result.success) {
        toast.success("Verification code sent to your email");
        setStep("verify");
        // Start cooldown timer (resend disabled for 30s)
        setCooldown(30);
        const timer = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) { clearInterval(timer); return 0; }
            return c - 1;
          });
        }, 1000);
      } else {
        toast.error(result.error || "Failed to send verification code");
      }
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    const parsed = z.string().length(6).safeParse(code);
    if (!parsed.success) {
      toast.error("Please enter the 6-digit code from your email");
      return;
    }
    setVerifying(true);
    try {
      const result = await verifyOtpCode({ data: { email, code: parsed.data, purpose: "onboarding" } });
      if (result.success) {
        toast.success("Email verified successfully!");
        setStep("done");
        onVerified();
      } else {
        toast.error(result.error || "Invalid code. Please try again.");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (step === "done") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Email Verified</CardTitle>
          </div>
          <CardDescription>Your email address has been verified successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4 text-sm">
            <p className="font-medium text-green-800 dark:text-green-300">✓ Verified: {email}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We'll send a 6-digit code to <strong>{email}</strong>. The code expires in 10 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "send" && (
          <Button onClick={handleSendCode} disabled={sending} className="w-full">
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" /> Send Verification Code
              </>
            )}
          </Button>
        )}

        {step === "verify" && (
          <>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Code sent to <strong>{email}</strong>
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground/80">6-digit verification code</label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-[0.3em] font-mono"
                  autoFocus
                />
              </div>
              {code.length === 6 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Code entered. Click verify below.
                </p>
              )}
            </div>

            <Button onClick={handleVerify} disabled={verifying || code.length !== 6} className="w-full">
              {verifying ? (
                "Verifying..."
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" /> Verify Code
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                onClick={handleSendCode}
                disabled={sending || cooldown > 0}
                className="text-xs"
              >
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend code"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}