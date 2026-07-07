import type { ReactNode } from "react"

interface DashboardSectionsProps {
  admin?: ReactNode
  calendar: ReactNode
  electric: ReactNode
}

export function DashboardSections({
  admin,
  calendar,
  electric,
}: DashboardSectionsProps) {
  return (
    <div className="grid gap-5">
      <div className="scroll-mt-24">{calendar}</div>
      <div className="scroll-mt-24" id="electric">
        {electric}
      </div>
      {admin ? (
        <div className="scroll-mt-24" id="admin">
          {admin}
        </div>
      ) : null}
    </div>
  )
}
