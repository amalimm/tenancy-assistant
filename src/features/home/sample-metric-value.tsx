"use client"

import { useEffect, useState } from "react"

type SampleMetricValueProps = {
  className?: string
  value: string
}

const randomDigit = () => String(Math.floor(Math.random() * 10))

const scrambleDigits = (value: string) =>
  value.replace(/\d/g, () => randomDigit())

export function SampleMetricValue({
  className,
  value,
}: SampleMetricValueProps) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let scrambleTimer: number | undefined

    const runScramble = () => {
      let frame = 0
      setDisplayValue(scrambleDigits(value))
      scrambleTimer = window.setInterval(() => {
        frame += 1

        if (frame >= 8) {
          if (scrambleTimer) {
            window.clearInterval(scrambleTimer)
          }
          setDisplayValue(value)
          return
        }

        setDisplayValue(scrambleDigits(value))
      }, 56)
    }

    const startTimer = window.setTimeout(runScramble, 450)
    const loopTimer = window.setInterval(runScramble, 9000)

    return () => {
      window.clearTimeout(startTimer)
      window.clearInterval(loopTimer)

      if (scrambleTimer) {
        window.clearInterval(scrambleTimer)
      }
    }
  }, [value])

  return (
    <span className={className}>
      <span aria-hidden="true">{displayValue}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
