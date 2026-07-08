import { CalendarDays, MousePointer2, Pencil, Trash2 } from "lucide-react"

const calendarHelpItems = [
  {
    description: "Drag dates",
    icon: MousePointer2,
    title: "Select",
  },
  {
    description: "Tenant + reason",
    icon: CalendarDays,
    title: "Details",
  },
  {
    description: "Drag to move",
    icon: Pencil,
    title: "Move",
  },
  {
    description: "Click to delete",
    icon: Trash2,
    title: "Delete",
  },
] as const

export function CalendarHelpGuide() {
  return (
    <div className="group/help relative w-fit">
      <button
        className="rounded-sm border-b border-dotted border-muted-foreground/60 pb-0.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:border-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        type="button"
      >
        Guide
      </button>
      <div
        className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-[min(17rem,calc(100vw-2rem))] rounded-lg border bg-popover p-2.5 text-left text-popover-foreground shadow-[0_8px_24px_rgb(0_0_0/0.08)] ring-1 ring-foreground/5 group-focus-within/help:block group-hover/help:block"
        role="tooltip"
      >
        <div className="flex items-center gap-2 border-b pb-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary">
            <CalendarDays className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">Calendar</p>
            <p className="text-xs leading-4 text-muted-foreground">
              Return date excluded
            </p>
          </div>
        </div>
        <div className="mt-2 grid gap-1">
          {calendarHelpItems.map((item) => {
            const Icon = item.icon

            return (
              <div
                className="grid grid-cols-[1rem_4.25rem_1fr] items-center gap-2 rounded-md px-1.5 py-1.5"
                key={item.title}
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold leading-4">{item.title}</p>
                <p className="truncate text-xs leading-4 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
