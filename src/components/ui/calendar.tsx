"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col gap-4",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center px-8",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ size: "icon-sm", variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ size: "icon-sm", variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-70 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100",
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

export { Calendar }
