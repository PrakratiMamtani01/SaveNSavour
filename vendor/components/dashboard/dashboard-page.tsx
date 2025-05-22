import { MainLayout } from "@/components/layout/main-layout"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { InventorySummary } from "@/components/dashboard/inventory-summary"

export function DashboardPage() {
  return (
    <MainLayout title="Dashboard">
      <div className="grid gap-6">
        <DashboardStats />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="md:col-span-1 lg:col-span-4">
            <RecentOrders />
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <div className="grid gap-6">
              <QuickActions />
              <InventorySummary />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
