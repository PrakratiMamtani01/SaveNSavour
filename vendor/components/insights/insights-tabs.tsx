"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SustainabilityMetrics } from "@/components/insights/sustainability-metrics"
import { SalesAnalytics } from "@/components/insights/sales-analytics"
import { CustomerEngagement } from "@/components/insights/customer-engagement"
import { ImpactReport } from "@/components/insights/impact-report"

export function InsightsTabs() {
  const [activeTab, setActiveTab] = useState("sustainability")

  return (
    <Tabs defaultValue="sustainability" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="impact">Impact Report</TabsTrigger>
      </TabsList>
      <TabsContent value="sustainability" className="space-y-4">
        <SustainabilityMetrics />
      </TabsContent>
      <TabsContent value="sales" className="space-y-4">
        <SalesAnalytics />
      </TabsContent>
      <TabsContent value="customers" className="space-y-4">
        <CustomerEngagement />
      </TabsContent>
      <TabsContent value="impact" className="space-y-4">
        <ImpactReport />
      </TabsContent>
    </Tabs>
  )
}
