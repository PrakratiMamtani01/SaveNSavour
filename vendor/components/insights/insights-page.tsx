import { MainLayout } from "@/components/layout/main-layout"
import { InsightsSummary } from "@/components/insights/insights-summary"
import { InsightsTabs } from "@/components/insights/insights-tabs"

export function InsightsPage() {
  return (
    <MainLayout title="Insights">
      <div className="grid gap-6">
        <InsightsSummary />
        <InsightsTabs />
      </div>
    </MainLayout>
  )
}
