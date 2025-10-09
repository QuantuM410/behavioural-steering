"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState, useRef } from "react"

type SteeringWheelProps = {
  angle: number
  min?: number
  max?: number
  size?: number
  className?: string
  showValue?: boolean
  animated?: boolean
  sensitivity?: number
}

export function SteeringWheel({ 
  angle, 
  min = -45, 
  max = 45, 
  size = 200,
  className,
  showValue = true,
  animated = true,
  sensitivity = 1.0
}: SteeringWheelProps) {
  const clamped = Math.max(min, Math.min(max, angle))
  const [displayAngle, setDisplayAngle] = useState(clamped)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number>()
  const lastAngleRef = useRef(clamped)
  
  // Convert angle to rotation with enhanced mapping
  const normalizedAngle = (clamped - min) / (max - min) // 0 to 1
  const rotation = (normalizedAngle - 0.5) * 180 * sensitivity // -90 to 90 degrees with sensitivity
  
  // Smooth animation effect
  useEffect(() => {
    if (!animated) {
      setDisplayAngle(clamped)
      return
    }

    const angleDiff = Math.abs(clamped - lastAngleRef.current)
    if (angleDiff < 0.1) return // Skip tiny changes

    setIsAnimating(true)
    
    const startAngle = lastAngleRef.current
    const endAngle = clamped
    const duration = Math.min(300, Math.max(100, angleDiff * 10)) // Dynamic duration based on angle change
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentAngle = startAngle + (endAngle - startAngle) * easeOutCubic
      
      setDisplayAngle(currentAngle)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        lastAngleRef.current = clamped
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [clamped, animated])

  // Wheel dimensions
  const centerX = size / 2
  const centerY = size / 2
  const radius = size * 0.4
  const spokeLength = radius * 0.7
  
  // Spoke positions (3 spokes at 120-degree intervals)
  const spokes = [
    { angle: 0, x: centerX + spokeLength, y: centerY },
    { angle: 120, x: centerX + spokeLength * Math.cos(Math.PI * 2 / 3), y: centerY + spokeLength * Math.sin(Math.PI * 2 / 3) },
    { angle: 240, x: centerX + spokeLength * Math.cos(Math.PI * 4 / 3), y: centerY + spokeLength * Math.sin(Math.PI * 4 / 3) }
  ]
  
  // Center hub
  const hubRadius = size * 0.08
  
  // Markings for reference
  const markings = [-30, -15, 0, 15, 30].map(mark => {
    const markAngle = (mark - min) / (max - min) * 180 - 90
    const markRadius = radius + 10
    const x = centerX + markRadius * Math.cos(markAngle * Math.PI / 180)
    const y = centerY + markRadius * Math.sin(markAngle * Math.PI / 180)
    return { angle: mark, x, y, markAngle }
  })

  // Calculate current rotation based on display angle
  const currentNormalizedAngle = (displayAngle - min) / (max - min)
  const currentRotation = (currentNormalizedAngle - 0.5) * 180 * sensitivity

  return (
    <div 
      className={cn("relative flex flex-col items-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Steering Wheel SVG */}
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full h-full"
        style={{ 
          transform: `rotate(${currentRotation}deg)`,
          transition: isAnimating ? 'none' : 'transform 0.1s ease-out',
          filter: isAnimating ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))' : 'none'
        }}
      >
        {/* Outer rim with gradient */}
        <defs>
          <radialGradient id="rimGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity="0.4"/>
          </radialGradient>
          <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1"/>
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7"/>
          </radialGradient>
        </defs>
        
        {/* Outer rim */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="url(#rimGradient)"
          strokeWidth="4"
          className="opacity-80"
        />
        
        {/* Inner rim */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius * 0.85}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          className="opacity-50"
        />
        
        {/* Spokes with enhanced styling */}
        {spokes.map((spoke, index) => (
          <g key={index}>
            {/* Spoke shadow */}
            <line
              x1={centerX + 1}
              y1={centerY + 1}
              x2={spoke.x + 1}
              y2={spoke.y + 1}
              stroke="hsl(var(--foreground))"
              strokeWidth="4"
              strokeLinecap="round"
              className="opacity-20"
            />
            {/* Main spoke */}
            <line
              x1={centerX}
              y1={centerY}
              x2={spoke.x}
              y2={spoke.y}
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-90"
            />
          </g>
        ))}
        
        {/* Center hub with gradient */}
        <circle
          cx={centerX}
          cy={centerY}
          r={hubRadius}
          fill="url(#hubGradient)"
          className="opacity-95"
        />
        
        {/* Center dot with highlight */}
        <circle
          cx={centerX}
          cy={centerY}
          r={hubRadius * 0.4}
          fill="hsl(var(--primary-foreground))"
          className="opacity-90"
        />
        
        {/* Center highlight */}
        <circle
          cx={centerX - hubRadius * 0.2}
          cy={centerY - hubRadius * 0.2}
          r={hubRadius * 0.15}
          fill="hsl(var(--primary-foreground))"
          className="opacity-60"
        />
      </svg>
      
      {/* Reference markings */}
      <div className="absolute inset-0 pointer-events-none">
        {markings.map((mark, index) => (
          <div
            key={index}
            className="absolute text-xs font-medium text-muted-foreground transition-all duration-200"
            style={{
              left: mark.x - 10,
              top: mark.y - 8,
              transform: `rotate(${-currentRotation}deg)`,
              opacity: isAnimating ? 0.7 : 1
            }}
          >
            {mark.angle}°
          </div>
        ))}
      </div>
      
      {/* Angle value display */}
      {showValue && (
        <div className="mt-4 text-center">
          <div className={cn(
            "text-2xl font-bold transition-all duration-200",
            isAnimating ? "text-primary scale-105" : "text-foreground"
          )}>
            {displayAngle.toFixed(1)}°
          </div>
          <div className="text-sm text-muted-foreground">
            {displayAngle < 0 ? 'Left' : displayAngle > 0 ? 'Right' : 'Straight'}
          </div>
        </div>
      )}
      
      {/* Enhanced direction indicator */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div 
          className={cn(
            "w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-primary transition-all duration-200",
            isAnimating && "drop-shadow-lg"
          )}
          style={{
            transform: `rotate(${currentRotation}deg)`,
            filter: isAnimating ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none'
          }}
        />
      </div>
      
      {/* Animation indicator */}
      {isAnimating && (
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary rounded-full animate-pulse opacity-80" />
      )}
    </div>
  )
}
