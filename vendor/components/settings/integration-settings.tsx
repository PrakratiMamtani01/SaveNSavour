"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

export function IntegrationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Connect SaveN&apos;Savor with other services and platforms.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Payment Integrations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stripe">Stripe</Label>
                <p className="text-sm text-muted-foreground">Process payments through Stripe.</p>
              </div>
              <Switch id="stripe" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-key">Stripe API Key</Label>
              <Input id="stripe-key" type="password" value="sk_test_••••••••••••••••••••••••" disabled />
              <p className="text-xs text-muted-foreground">Contact support to update your API key.</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Map Integrations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="google-maps">Google Maps</Label>
                <p className="text-sm text-muted-foreground">Display your location on Google Maps.</p>
              </div>
              <Switch id="google-maps" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-maps-key">Google Maps API Key</Label>
              <Input id="google-maps-key" type="password" value="AIza••••••••••••••••••••••••••••" disabled />
              <p className="text-xs text-muted-foreground">Contact support to update your API key.</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social Media Integrations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="facebook">Facebook</Label>
                <p className="text-sm text-muted-foreground">Share your sustainability impact on Facebook.</p>
              </div>
              <Switch id="facebook" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="instagram">Instagram</Label>
                <p className="text-sm text-muted-foreground">Share your sustainability impact on Instagram.</p>
              </div>
              <Switch id="instagram" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="twitter">Twitter</Label>
                <p className="text-sm text-muted-foreground">Share your sustainability impact on Twitter.</p>
              </div>
              <Switch id="twitter" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button>Save Integration Settings</Button>
      </CardFooter>
    </Card>
  )
}
