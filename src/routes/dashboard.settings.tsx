import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Lock, 
  User, 
  Globe,
  Shield
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  component: AgentSettings,
});

function AgentSettings() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive email updates about new leads and inquiries</p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive SMS alerts for urgent inquiries</p>
            </div>
            <Switch id="sms-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="whatsapp-notifications">WhatsApp Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified via WhatsApp for new leads</p>
            </div>
            <Switch id="whatsapp-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing-emails">Marketing Emails</Label>
              <p className="text-xs text-muted-foreground">Receive marketing updates and tips</p>
            </div>
            <Switch id="marketing-emails" />
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select id="timezone" className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option>Africa/Nairobi</option>
              <option>UTC</option>
              <option>Africa/Cairo</option>
              <option>Africa/Johannesburg</option>
            </select>
          </div>

          <div>
            <Label htmlFor="language">Language</Label>
            <select id="language" className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option>English</option>
              <option>Swahili</option>
            </select>
          </div>

          <div>
            <Label htmlFor="currency">Default Currency</Label>
            <select id="currency" className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option>KES - Kenyan Shilling</option>
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" className="mt-1" />
          </div>

          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public-profile">Public Profile</Label>
              <p className="text-xs text-muted-foreground">Make your profile visible to the public</p>
            </div>
            <Switch id="public-profile" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-contact">Show Contact Information</Label>
              <p className="text-xs text-muted-foreground">Display your phone and email on your profile</p>
            </div>
            <Switch id="show-contact" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-listings">Show All Listings</Label>
              <p className="text-xs text-muted-foreground">Display all your listings on your profile</p>
            </div>
            <Switch id="show-listings" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save All Settings</Button>
      </div>
    </div>
  );
}
