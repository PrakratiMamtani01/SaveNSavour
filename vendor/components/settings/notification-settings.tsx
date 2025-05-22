"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications from SaveN&apos;Savor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-order">New Order Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive an email when a new order is placed.</p>
              </div>
              <Switch id="new-order" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order-pickup">Order Pickup Reminders</Label>
                <p className="text-sm text-muted-foreground">Receive an email when an order is ready for pickup.</p>
              </div>
              <Switch id="order-pickup" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order-completed">Order Completion Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive an email when an order is completed.</p>
              </div>
              <Switch id="order-completed" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-summary">Weekly Summary Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your orders and sustainability impact.
                </p>
              </div>
              <Switch id="weekly-summary" defaultChecked />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Push Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-new-order">New Order Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive a push notification when a new order is placed.</p>
              </div>
              <Switch id="push-new-order" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-pickup-reminder">Pickup Reminders</Label>
                <p className="text-sm text-muted-foreground">Receive a push notification for upcoming order pickups.</p>
              </div>
              <Switch id="push-pickup-reminder" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-inventory">Inventory Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a push notification when inventory is running low.
                </p>
              </div>
              <Switch id="push-inventory" defaultChecked />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button>Save Preferences</Button>
      </CardFooter>
    </Card>
  )
}
