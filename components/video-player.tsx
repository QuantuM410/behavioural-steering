"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient, extractVideoFrame } from "@/lib/api-client"

type VideoPlayerProps = {
  onAngle?: (value: number) => void
  simulate?: boolean
  onBackendStatus?: (status: { available: boolean; device?: string }) => void
}

export function VideoPlayer({ onAngle, simulate = true, onBackendStatus }: VideoPlayerProps) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = React.useState<boolean>(false)
  const [backendDevice, setBackendDevice] = React.useState<string>("")
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [lastPrediction, setLastPrediction] = React.useState<number>(0)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const predictionIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Check backend availability on mount
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const health = await apiClient.health()
        setBackendAvailable(true)
        setBackendDevice(health.device)
        onBackendStatus?.({ available: true, device: health.device })
      } catch {
        setBackendAvailable(false)
        setBackendDevice("")
        onBackendStatus?.({ available: false })
      }
    }
    checkBackend()
  }, [onBackendStatus])

  // Prediction logic
  const makePrediction = async (video: HTMLVideoElement) => {
    if (isProcessing || !backendAvailable) return

    try {
      setIsProcessing(true)
      const frameBase64 = extractVideoFrame(video)
      const response = await apiClient.predict({
        image: frameBase64,
        throttle: 0.5,
        speed: 20.0
      })
      
      const angleDegrees = response.steering_angle_degrees
      setLastPrediction(angleDegrees)
      onAngle?.(angleDegrees)
    } catch (error) {
      console.error("Prediction error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  React.useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const handleTimeUpdate = () => {
      if (simulate && !backendAvailable) {
        // Fallback simulation when backend is not available
        const t = v.currentTime
        const angle = 30 * Math.sin(t / 1.5) // range approx -30..+30
        onAngle?.(angle)
      }
    }

    v.addEventListener("timeupdate", handleTimeUpdate)
    return () => {
      v.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [simulate, onAngle, backendAvailable])

  // Real-time prediction when not simulating
  React.useEffect(() => {
    const v = videoRef.current
    if (!v || simulate || !backendAvailable) return

    // Clear existing interval
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current)
    }

    // Start prediction interval (10 FPS)
    predictionIntervalRef.current = setInterval(() => {
      if (v.currentTime > 0 && !v.paused) {
        makePrediction(v)
      }
    }, 100) // 100ms = 10 FPS

    return () => {
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current)
      }
    }
  }, [simulate, backendAvailable, objectUrl])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
  }

  const clearVideo = () => {
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    onAngle?.(0)
    setLastPrediction(0)
    
    // Clear prediction interval
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Backend Status */}
      <div className="flex items-center gap-2">
        <Badge variant={backendAvailable ? "default" : "destructive"}>
          {backendAvailable ? `Backend: ${backendDevice}` : "Backend: Offline"}
        </Badge>
        {isProcessing && <Badge variant="outline">Processing...</Badge>}
        {!simulate && backendAvailable && <Badge variant="secondary">Live Inference</Badge>}
      </div>

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <span className="sr-only">Upload video</span>
          <input
            type="file"
            accept="video/*"
            onChange={onFileChange}
            className="rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
          />
        </label>
        <Button variant="secondary" onClick={clearVideo} disabled={!objectUrl}>
          Clear
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {objectUrl ? (
            <video ref={videoRef} src={objectUrl} className="h-auto w-full rounded-md" controls playsInline />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center text-sm text-muted-foreground">
              {"Upload a video to start the preview"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
