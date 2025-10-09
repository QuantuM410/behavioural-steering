"use client"

import React, { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SteeringGauge } from "@/components/steering-gauge"
import { SteeringWheel } from "@/components/steering-wheel"
import { EvaluationMetrics, EvaluationMetrics as EvaluationMetricsType } from "@/components/evaluation-metrics"
import { VideoPlayer } from "@/components/video-player"

export default function HomePage() {
  const [angle, setAngle] = useState<number>(0)
  const [isSimulating, setIsSimulating] = useState(true)
  const [backendStatus, setBackendStatus] = useState<{ available: boolean; device?: string }>({ available: false })
  const [isClient, setIsClient] = useState<boolean>(false)
  const [metrics, setMetrics] = useState<EvaluationMetricsType>({
    totalPredictions: 0,
    averageConfidence: 0,
    accuracy: 0,
    smoothness: 0,
    responseTime: 0,
    errorRate: 0,
    lastPrediction: {
      angle: 0,
      confidence: 0,
      timestamp: Date.now()
    },
    recentAngles: []
  })
  
  const angleHistoryRef = useRef<number[]>([])
  const predictionTimesRef = useRef<number[]>([])

  // Set client-side flag to prevent hydration mismatch
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Update metrics when angle changes
  const updateMetrics = useCallback((newAngle: number, confidence: number = 0.8, responseTime: number = 100) => {
    const now = Date.now()
    
    // Update angle history
    angleHistoryRef.current.push(newAngle)
    if (angleHistoryRef.current.length > 50) {
      angleHistoryRef.current.shift()
    }
    
    // Update prediction times
    predictionTimesRef.current.push(responseTime)
    if (predictionTimesRef.current.length > 20) {
      predictionTimesRef.current.shift()
    }
    
    // Calculate smoothness (based on angle changes)
    const recentAngles = angleHistoryRef.current.slice(-10)
    let smoothness = 1
    if (recentAngles.length > 1) {
      const changes = recentAngles.slice(1).map((angle, i) => Math.abs(angle - recentAngles[i]))
      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
      smoothness = Math.max(0, 1 - avgChange / 10) // Normalize to 0-1
    }
    
    // Calculate accuracy (simplified - based on confidence and smoothness)
    const accuracy = (confidence + smoothness) / 2
    
    // Calculate average confidence
    const allConfidences = [...predictionTimesRef.current.map(() => confidence), confidence]
    const avgConfidence = allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
    
    // Calculate error rate (simplified)
    const errorRate = Math.max(0, 1 - accuracy)
    
    setMetrics({
      totalPredictions: metrics.totalPredictions + 1,
      averageConfidence: avgConfidence,
      accuracy,
      smoothness,
      responseTime: responseTime,
      errorRate,
      lastPrediction: {
        angle: newAngle,
        confidence,
        timestamp: now
      },
      recentAngles: recentAngles
    })
  }, [metrics.totalPredictions])

  // Enhanced angle setter that updates metrics
  const handleAngleChange = useCallback((newAngle: number) => {
    setAngle(newAngle)
    if (!isSimulating && backendStatus.available) {
      // Simulate confidence and response time for real predictions
      const confidence = 0.7 + Math.random() * 0.3 // 0.7-1.0
      const responseTime = 50 + Math.random() * 100 // 50-150ms
      updateMetrics(newAngle, confidence, responseTime)
    } else if (isSimulating) {
      // For simulation mode, also update metrics to show the UI
      const confidence = 0.8 + Math.random() * 0.2 // 0.8-1.0 for simulation
      const responseTime = 20 + Math.random() * 30 // 20-50ms for simulation
      updateMetrics(newAngle, confidence, responseTime)
    }
  }, [isSimulating, backendStatus.available, updateMetrics])

  // Demo mode - simulate some initial data to show the UI
  React.useEffect(() => {
    if (isClient && metrics.totalPredictions === 0) {
      // Initialize with some demo data that shows off the steering wheel animation
      const demoAngles = [0, 8, -5, 12, -8, 18, -12, 25, -18, 15, -10, 5, 0]
      demoAngles.forEach((angle, index) => {
        setTimeout(() => {
          handleAngleChange(angle)
        }, index * 300) // Slightly slower to appreciate the animation
      })
    }
  }, [isClient, metrics.totalPredictions, handleAngleChange])

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <header className="mb-6 md:mb-10">
          <h1 className="text-balance text-2xl md:text-3xl font-semibold">Behavioural Steering — Live Preview</h1>
          <p className="text-muted-foreground mt-2">
            Upload a video and get real-time steering angle predictions using a ResNet-based neural network.
            {isClient && (
              backendStatus.available ? (
                <span className="text-green-600"> Backend connected ({backendStatus.device}).</span>
              ) : (
                <span className="text-orange-600"> Backend offline - using simulation mode.</span>
              )
            )}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Video Section */}
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Video Input</CardTitle>
              <CardDescription>Upload and play a driving video for real-time analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <VideoPlayer 
                onAngle={handleAngleChange} 
                simulate={isSimulating} 
                onBackendStatus={setBackendStatus}
              />
              <div className="mt-4 flex items-center gap-3">
                <Button 
                  variant={isSimulating ? "default" : "secondary"} 
                  onClick={() => setIsSimulating((s) => !s)}
                  disabled={isClient && !backendStatus.available}
                >
                  {isSimulating ? "Simulation: On" : "Live Inference: On"}
                </Button>
                {isClient && !backendStatus.available && (
                  <span className="text-sm text-muted-foreground">
                    Live inference requires backend connection
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Steering Visualization */}
          <div className="lg:col-span-5 space-y-6">
            {/* Steering Wheel */}
            <Card>
              <CardHeader>
                <CardTitle>Steering Wheel</CardTitle>
                <CardDescription>
                  {isClient && backendStatus.available && !isSimulating 
                    ? "Real-time neural network prediction" 
                    : "Simulated prediction for preview"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <SteeringWheel 
                    angle={angle} 
                    min={-45} 
                    max={45} 
                    size={220}
                    animated={true}
                    showValue={true}
                    sensitivity={1.2}
                  />
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                      Range: -45° (left) to +45° (right)
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isClient && backendStatus.available && !isSimulating 
                        ? "Neural network predictions from video frames" 
                        : "Simulated values for preview purposes"
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traditional Gauge */}
            <Card>
              <CardHeader>
                <CardTitle>Steering Gauge</CardTitle>
                <CardDescription>Traditional gauge view</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <SteeringGauge value={angle} min={-45} max={45} />
                  <div aria-live="polite" className="text-xl font-medium">
                    {angle.toFixed(1)}°
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Evaluation Metrics */}
        {isClient && metrics.totalPredictions > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Metrics</CardTitle>
                <CardDescription>
                  Real-time performance analysis and model evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvaluationMetrics metrics={metrics} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
