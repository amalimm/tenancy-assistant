"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { CalendarDays, ReceiptText, Users } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const DASHBOARD_TAB = {
  BILLING: "billing",
  CALENDAR: "calendar",
  TENANTS: "tenants",
} as const

export type DashboardTab = (typeof DASHBOARD_TAB)[keyof typeof DASHBOARD_TAB]

interface DashboardTabsContextValue {
  setActiveTab: (tab: DashboardTab) => void
}

interface DashboardTabsProps {
  billing: ReactNode
  calendar: ReactNode
  tenants: ReactNode
}

const DashboardTabsContext = createContext<DashboardTabsContextValue | null>(
  null,
)

const isDashboardTab = (value: string): value is DashboardTab =>
  Object.values(DASHBOARD_TAB).includes(value as DashboardTab)

export function DashboardTabs({
  billing,
  calendar,
  tenants,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    DASHBOARD_TAB.CALENDAR,
  )

  const handleValueChange = (value: string) => {
    if (isDashboardTab(value)) {
      setActiveTab(value)
    }
  }

  return (
    <DashboardTabsContext.Provider value={{ setActiveTab }}>
      <Tabs onValueChange={handleValueChange} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-fit">
          <TabsTrigger value={DASHBOARD_TAB.CALENDAR}>
            <CalendarDays />
            Calendar
          </TabsTrigger>
          <TabsTrigger value={DASHBOARD_TAB.TENANTS}>
            <Users />
            Tenants
          </TabsTrigger>
          <TabsTrigger value={DASHBOARD_TAB.BILLING}>
            <ReceiptText />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4" value={DASHBOARD_TAB.CALENDAR}>
          {calendar}
        </TabsContent>
        <TabsContent className="mt-4" value={DASHBOARD_TAB.TENANTS}>
          {tenants}
        </TabsContent>
        <TabsContent className="mt-4" value={DASHBOARD_TAB.BILLING}>
          {billing}
        </TabsContent>
      </Tabs>
    </DashboardTabsContext.Provider>
  )
}

export function useDashboardTabs() {
  const context = useContext(DashboardTabsContext)

  if (!context) {
    throw new Error("useDashboardTabs must be used inside DashboardTabs.")
  }

  return context
}
