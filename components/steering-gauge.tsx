"use client"
import { cn } from "@/lib/utils"

type GaugeProps = {
  value: number
  min?: number
  max?: number
  className?: string
}

export function SteeringGauge({ value, min = -45, max = 45, className }: GaugeProps) {
  const clamped = Math.max(min, Math.min(max, value))
  // Map angle to [0..1] then to degrees [180..0] (left to right across a semicircle)
  const t = (clamped - min) / (max - min) // 0..1
  const pointerDeg = 180 - 180 * t // 180 (left) to 0 (right)

  // Gauge dimensions
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 12

  // Arc path for the semi-circle (180°)
  const startX = cx - r
  const startY = cy
  const endX = cx + r
  const endY = cy
  const largeArcFlag = 0
  const sweepFlag = 1
  const arcPath = `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`

  // Pointer end
  const rad = (Math.PI / 180) * pointerDeg
  const px = cx + r * Math.cos(rad)
  const py = cy - r * Math.sin(rad)

  // Ticks
  const ticks = [-45, -30, -15, 0, 15, 30, 45]
  const tickElements = ticks.map((a) => {
    const ta = 180 - 180 * ((a - min) / (max - min))
    const tr = (Math.PI / 180) * ta
    const ix = cx + (r - 10) * Math.cos(tr)
    const iy = cy - (r - 10) * Math.sin(tr)
    const ox = cx + (r + 2) * Math.cos(tr)
    const oy = cy - (r + 2) * Math.sin(tr)
    return (
      <line key={a} x1={ix} y1={iy} x2={ox} y2={oy} stroke="currentColor" strokeWidth={2} opacity={a === 0 ? 1 : 0.7} />
    )
  })

  return (
    <div
      className={cn("w-full max-w-sm rounded-lg border bg-card text-card-foreground p-4", className)}
      role="img"
      aria-label={`Steering gauge showing ${clamped.toFixed(1)} degrees`}
    >
      <svg viewBox={`0 0 ${size} ${size / 1.15}`} className="w-full text-muted-foreground">
        <path d={arcPath} fill="none" stroke="currentColor" strokeWidth={10} strokeLinecap="round" />
        {tickElements}
        <line x1={cx} y1={cy} x2={px} y2={py} stroke="hsl(var(--primary))" strokeWidth={6} strokeLinecap="round" />
      </svg>
      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>{min}°</span>
        <span>0°</span>
        <span>{max}°</span>
      </div>
    </div>
  )
}
