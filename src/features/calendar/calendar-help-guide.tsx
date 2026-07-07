import { CalendarDays, Move, MousePointer2 } from "lucide-react"

const calendarHelpItems = [
  {
    description: "Drag across dates.",
    icon: MousePointer2,
    title: "Select",
  },
  {
    description: "Tenant and optional reason.",
    icon: CalendarDays,
    title: "Details",
  },
  {
    description: "Drag to move. Click to delete.",
    icon: Move,
    title: "Edit",
  },
] as const

export function CalendarHelpGuide() {
  return (
    <div className="group/help relative w-fit">
      <button
        className="rounded-sm border-b border-dotted border-muted-foreground/70 pb-0.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:border-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        type="button"
      >
        Guide
      </button>
      <div
        className="pointer-events-none absolute right-0 top-full z-30 mt-3 hidden w-[min(20rem,calc(100vw-2rem))] rounded-lg border bg-popover p-3 text-left text-popover-foreground shadow-lg ring-1 ring-foreground/10 group-focus-within/help:block group-hover/help:block"
        role="tooltip"
      >
        <div className="flex items-start gap-2 border-b pb-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
            <CalendarDays className="size-4" />
          </div>
          <div>
            <p className="font-medium">Calendar</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Return dates are excluded.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {calendarHelpItems.map((item) => {
            const Icon = item.icon

            return (
              <div className="flex gap-2" key={item.title}>
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-5">{item.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
