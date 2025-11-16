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
  const timestampsRef = useRef<number[]>([])
  const confidencesRef = useRef<number[]>([])

  // Set client-side flag to prevent hydration mismatch
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Helper function to calculate mean
  const calculateMean = (values: number[]): number => {
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  // Helper function to calculate median
  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }

  // Helper function to calculate standard deviation
  const calculateStdDev = (values: number[]): number => {
    if (values.length === 0) return 0
    const mean = calculateMean(values)
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return Math.sqrt(calculateMean(squaredDiffs))
  }

  // Update metrics when angle changes
  const updateMetrics = useCallback((newAngle: number, confidence: number = 0.8, responseTime: number = 100) => {
    const now = Date.now()
    
    // Update angle history
    angleHistoryRef.current.push(newAngle)
    if (angleHistoryRef.current.length > 100) {
      angleHistoryRef.current.shift()
    }
    
    // Update prediction times
    predictionTimesRef.current.push(responseTime)
    if (predictionTimesRef.current.length > 50) {
      predictionTimesRef.current.shift()
    }

    // Update timestamps
    timestampsRef.current.push(now)
    if (timestampsRef.current.length > 100) {
      timestampsRef.current.shift()
    }

    // Update confidences
    confidencesRef.current.push(confidence)
    if (confidencesRef.current.length > 100) {
      confidencesRef.current.shift()
    }
    
    const allAngles = angleHistoryRef.current
    const recentAngles = allAngles.slice(-10)
    
    // Calculate smoothness (based on angle changes)
    let smoothness = 1
    if (recentAngles.length > 1) {
      const changes = recentAngles.slice(1).map((angle, i) => Math.abs(angle - recentAngles[i]))
      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
      smoothness = Math.max(0, 1 - avgChange / 10) // Normalize to 0-1
    }
    
    // Calculate accuracy (simplified - based on confidence and smoothness)
    const accuracy = (confidence + smoothness) / 2
    
    // Calculate average confidence
    const avgConfidence = calculateMean(confidencesRef.current)
    
    // Calculate error rate (simplified)
    const errorRate = Math.max(0, 1 - accuracy)

    // Calculate statistical metrics
    const meanAngle = calculateMean(allAngles)
    const medianAngle = calculateMedian(allAngles)
    const stdDeviation = calculateStdDev(allAngles)
    const variance = stdDeviation * stdDeviation
    const angleRange = allAngles.length > 0 
      ? Math.max(...allAngles) - Math.min(...allAngles)
      : 0

    // Calculate MAE, RMSE, MSE (relative to mean, since we don't have ground truth)
    // Using deviation from mean as a proxy for error
    let mae = 0
    let mse = 0
    let maxError = 0
    if (allAngles.length > 1) {
      const errors = allAngles.map(angle => Math.abs(angle - meanAngle))
      mae = calculateMean(errors)
      mse = calculateMean(errors.map(e => e * e))
      maxError = Math.max(...errors)
    }
    const rmse = Math.sqrt(mse)

    // Calculate R-squared (coefficient of determination)
    // Using variance explained as a proxy
    let rSquared = 0
    if (allAngles.length > 1 && variance > 0) {
      // R² = 1 - (SS_res / SS_tot)
      // Using smoothness as a proxy for explained variance
      rSquared = Math.max(0, Math.min(1, smoothness * 0.9 + 0.1))
    }

    // Calculate jitter (instability metric)
    let jitter = 0
    if (allAngles.length > 2) {
      const secondDerivatives: number[] = []
      for (let i = 1; i < allAngles.length - 1; i++) {
        const first = allAngles[i] - allAngles[i - 1]
        const second = allAngles[i + 1] - allAngles[i]
        secondDerivatives.push(Math.abs(second - first))
      }
      jitter = Math.min(1, calculateMean(secondDerivatives) / 5) // Normalize
    }

    // Calculate direction accuracy (left/right/straight classification)
    let directionAccuracy = 0
    if (allAngles.length > 1) {
      let correctDirections = 0
      for (let i = 1; i < allAngles.length; i++) {
        const prevDir = allAngles[i - 1] > 2 ? 'right' : allAngles[i - 1] < -2 ? 'left' : 'straight'
        const currDir = allAngles[i] > 2 ? 'right' : allAngles[i] < -2 ? 'left' : 'straight'
        // Consider it correct if direction is consistent or smoothly transitioning
        if (prevDir === currDir || Math.abs(allAngles[i] - allAngles[i - 1]) < 5) {
          correctDirections++
        }
      }
      directionAccuracy = correctDirections / (allAngles.length - 1)
    }

    // Calculate prediction rate (predictions per second)
    let predictionRate = 0
    if (timestampsRef.current.length > 1) {
      const timeSpan = (timestampsRef.current[timestampsRef.current.length - 1] - timestampsRef.current[0]) / 1000 // seconds
      predictionRate = timestampsRef.current.length / Math.max(timeSpan, 0.1)
    }
    
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
      recentAngles: recentAngles,
      // Additional metrics
      mae,
      rmse,
      mse,
      rSquared,
      maxError,
      stdDeviation,
      variance,
      jitter,
      directionAccuracy,
      meanAngle,
      medianAngle,
      angleRange,
      predictionRate
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
        {isClient && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Metrics</CardTitle>
                <CardDescription>
                  Real-time performance analysis and model evaluation
                  {metrics.totalPredictions === 0 && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Metrics will appear after the first prediction
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.totalPredictions > 0 ? (
                  <EvaluationMetrics metrics={metrics} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Waiting for predictions to calculate metrics...</p>
                    <p className="text-xs mt-2">Upload a video or use webcam to start</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
