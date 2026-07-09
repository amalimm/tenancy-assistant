"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const CALENDAR_DENSITY = {
  COMPACT: "compact",
  DEFAULT: "default",
} as const

type CalendarDensity = (typeof CALENDAR_DENSITY)[keyof typeof CALENDAR_DENSITY]

function Calendar({
  className,
  classNames,
  density = CALENDAR_DENSITY.DEFAULT,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  density?: CalendarDensity
}) {
  const isCompact = density === CALENDAR_DENSITY.COMPACT

  return (
    <DayPicker
      className={cn(isCompact ? "p-2" : "p-3", className)}
      classNames={{
        root: isCompact ? "w-fit" : "w-full",
        months: cn("flex flex-col gap-4 md:flex-row", isCompact && "flex-row gap-3"),
        month: cn("space-y-4", isCompact && "space-y-2"),
        month_caption: cn(
          "relative flex items-center justify-center px-8",
          isCompact && "px-6",
        ),
        caption_label: cn("text-sm font-medium", isCompact && "text-xs font-semibold"),
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({
            size: isCompact ? "icon-xs" : "icon-sm",
            variant: "outline",
          }),
          isCompact ? "size-6" : "size-7",
          "bg-transparent p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({
            size: isCompact ? "icon-xs" : "icon-sm",
            variant: "outline",
          }),
          isCompact ? "size-6" : "size-7",
          "bg-transparent p-0 opacity-70 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: cn(
          "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
          isCompact && "w-6 text-xs",
        ),
        week: cn("mt-2 flex w-full", isCompact && "mt-1"),
        day: cn(
          "relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
          isCompact && "size-6 text-xs",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          isCompact ? "size-6 text-xs" : "size-9 text-sm",
          "p-0 font-normal aria-selected:opacity-100",
        ),
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        range_start:
          "rounded-l-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        range_middle:
          "rounded-none bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        range_end:
          "rounded-r-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  )
}

export { Calendar, CALENDAR_DENSITY, type CalendarDensity }
