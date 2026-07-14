import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  LifeBuoy, 
  MessageSquare, 
  Phone, 
  Mail,
  Send,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/support")({
  component: AgentSupport,
});

function AgentSupport() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Support request submitted. We'll respond within 24 hours.");
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <LifeBuoy className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Request Submitted</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
          Our support team will get back to you within 24 hours.
        </p>
        <Button onClick={() => setSubmitted(false)} className="mt-4">
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Support</h1>
        <p className="text-sm text-muted-foreground">Get help with your account and listings.</p>
      </div>

      {/* Contact Options */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phone Support</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Call us during business hours for immediate assistance.
            </p>
            <p className="font-medium">+254 790 595 990</p>
            <p className="text-xs text-muted-foreground mt-1">Mon-Fri 8am-6pm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Support</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Send us an email and we'll respond within 24 hours.
            </p>
            <p className="font-medium">support@brightedge.co.ke</p>
            <p className="text-xs text-muted-foreground mt-1">Response within 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Chat with us on WhatsApp for quick responses.
            </p>
            <p className="font-medium">+254 790 595 990</p>
            <p className="text-xs text-muted-foreground mt-1">Available 24/7</p>
          </CardContent>
        </Card>
      </div>

      {/* Support Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Submit a Support Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Brief description of your issue" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select id="category" className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Select a category</option>
                <option value="account">Account & Login</option>
                <option value="listings">Property Listings</option>
                <option value="leads">Lead Management</option>
                <option value="billing">Billing & Payments</option>
                <option value="technical">Technical Issues</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="Describe your issue in detail..."
                className="mt-1 resize-none"
              />
            </div>

            <Button type="submit" className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">How do I add a new property listing?</h3>
            <p className="text-sm text-muted-foreground">
              Go to My Listings and click "Add New Listing". Fill in the property details, upload images, and submit for review.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">How do I get verified?</h3>
            <p className="text-sm text-muted-foreground">
              Complete the onboarding process by uploading your documents. Our team reviews applications within 24 hours.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">How do I view my leads?</h3>
            <p className="text-sm text-muted-foreground">
              All your leads are available in the "My Leads" section. You can filter by status and view detailed information.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">How do commissions work?</h3>
            <p className="text-sm text-muted-foreground">
              Bright Edge operates on a commission-share model. Commission details are available in the Billing section.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
