import { MainLayout } from "@/components/layout/main-layout"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export function SettingsPage() {
  return (
    <MainLayout title="Settings">
      <div className="grid gap-6">
        <SettingsTabs />
      </div>
    </MainLayout>
  )
}
