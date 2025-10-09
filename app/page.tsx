"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SteeringGauge } from "@/components/steering-gauge"
import { VideoPlayer } from "@/components/video-player"

export default function HomePage() {
  const [angle, setAngle] = useState<number>(0)
  const [isSimulating, setIsSimulating] = useState(true)
  const [backendStatus, setBackendStatus] = useState<{ available: boolean; device?: string }>({ available: false })

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <header className="mb-6 md:mb-10">
          <h1 className="text-balance text-2xl md:text-3xl font-semibold">Behavioural Steering — Live Preview</h1>
          <p className="text-muted-foreground mt-2">
            Upload a video and get real-time steering angle predictions using a ResNet-based neural network.
            {backendStatus.available ? (
              <span className="text-green-600"> Backend connected ({backendStatus.device}).</span>
            ) : (
              <span className="text-orange-600"> Backend offline - using simulation mode.</span>
            )}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-5">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Video</CardTitle>
              <CardDescription>Upload and play a driving video</CardDescription>
            </CardHeader>
            <CardContent>
              <VideoPlayer 
                onAngle={(v) => setAngle(v)} 
                simulate={isSimulating} 
                onBackendStatus={setBackendStatus}
              />
              <div className="mt-4 flex items-center gap-3">
                <Button 
                  variant={isSimulating ? "default" : "secondary"} 
                  onClick={() => setIsSimulating((s) => !s)}
                  disabled={!backendStatus.available}
                >
                  {isSimulating ? "Simulation: On" : "Live Inference: On"}
                </Button>
                {!backendStatus.available && (
                  <span className="text-sm text-muted-foreground">
                    Live inference requires backend connection
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Steering Angle</CardTitle>
              <CardDescription>
                {backendStatus.available && !isSimulating 
                  ? "Real-time neural network prediction" 
                  : "Simulated prediction for preview"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <SteeringGauge value={angle} min={-45} max={45} />
                <div aria-live="polite" className="text-xl font-medium">
                  {angle.toFixed(1)}°
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Range: -45° (left) to +45° (right). 
                  {backendStatus.available && !isSimulating 
                    ? " Neural network predictions from video frames." 
                    : " Simulated values for preview purposes."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
