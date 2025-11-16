"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface EvaluationMetrics {
  totalPredictions: number
  averageConfidence: number
  accuracy: number
  smoothness: number
  responseTime: number
  errorRate: number
  lastPrediction: {
    angle: number
    confidence: number
    timestamp: number
  }
  recentAngles: number[]
  // Additional metrics
  mae?: number // Mean Absolute Error
  rmse?: number // Root Mean Squared Error
  mse?: number // Mean Squared Error
  rSquared?: number // R-squared coefficient
  maxError?: number // Maximum error
  stdDeviation?: number // Standard deviation of predictions
  variance?: number // Variance of predictions
  jitter?: number // Jitter/instability metric
  directionAccuracy?: number // Direction accuracy (left/right/straight)
  meanAngle?: number // Mean angle
  medianAngle?: number // Median angle
  angleRange?: number // Range of angles (max - min)
  predictionRate?: number // Predictions per second
}

type EvaluationMetricsProps = {
  metrics: EvaluationMetrics
  className?: string
}

export function EvaluationMetrics({ metrics, className }: EvaluationMetricsProps) {
  const {
    totalPredictions,
    averageConfidence,
    accuracy,
    smoothness,
    responseTime,
    errorRate,
    lastPrediction,
    recentAngles,
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
  } = metrics

  // Calculate trend for recent angles
  const angleTrend = recentAngles.length >= 2 
    ? recentAngles[recentAngles.length - 1] - recentAngles[recentAngles.length - 2]
    : 0

  // Get confidence level color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  // Get accuracy level color
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return "text-green-600"
    if (accuracy >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  // Get smoothness level color
  const getSmoothnessColor = (smoothness: number) => {
    if (smoothness >= 0.8) return "text-green-600"
    if (smoothness >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  // Get error metric color (lower is better)
  const getErrorColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.5) return "text-green-600"
    if (value <= threshold) return "text-yellow-600"
    return "text-red-600"
  }

  // Get quality color (higher is better, 0-1 scale)
  const getQualityColor = (value: number) => {
    if (value >= 0.8) return "text-green-600"
    if (value >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Prediction */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Current Prediction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Angle</span>
            <span className="text-2xl font-bold">
              {lastPrediction.angle.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <span className={cn("font-semibold", getConfidenceColor(lastPrediction.confidence))}>
              {(lastPrediction.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Response Time</span>
            <span className="text-sm font-mono">
              {responseTime.toFixed(0)}ms
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
          <CardDescription>Real-time evaluation of model performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Accuracy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accuracy</span>
              <span className={cn("text-sm font-semibold", getAccuracyColor(accuracy))}>
                {(accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={accuracy * 100} className="h-2" />
          </div>

          {/* Smoothness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Smoothness</span>
              <span className={cn("text-sm font-semibold", getSmoothnessColor(smoothness))}>
                {(smoothness * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={smoothness * 100} className="h-2" />
          </div>

          {/* Average Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Confidence</span>
              <span className={cn("text-sm font-semibold", getConfidenceColor(averageConfidence))}>
                {(averageConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={averageConfidence * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {totalPredictions}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Predictions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(errorRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Error Rate
              </div>
            </div>
          </div>
          
          {/* Trend indicator */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            <span className="text-sm text-muted-foreground">Trend:</span>
            <Badge 
              variant={Math.abs(angleTrend) < 1 ? "default" : angleTrend > 0 ? "destructive" : "secondary"}
            >
              {Math.abs(angleTrend) < 1 ? "Stable" : angleTrend > 0 ? "Turning Right" : "Turning Left"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistical Metrics */}
      {(mae !== undefined || rmse !== undefined || mse !== undefined) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Error Metrics</CardTitle>
            <CardDescription>Statistical error measurements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mae !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MAE (Mean Absolute Error)</span>
                <span className={cn("text-sm font-semibold", getErrorColor(mae, 5))}>
                  {mae.toFixed(2)}°
                </span>
              </div>
            )}
            {rmse !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">RMSE (Root Mean Squared Error)</span>
                <span className={cn("text-sm font-semibold", getErrorColor(rmse, 7))}>
                  {rmse.toFixed(2)}°
                </span>
              </div>
            )}
            {mse !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MSE (Mean Squared Error)</span>
                <span className={cn("text-sm font-semibold", getErrorColor(mse, 50))}>
                  {mse.toFixed(2)}°²
                </span>
              </div>
            )}
            {maxError !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max Error</span>
                <span className={cn("text-sm font-semibold", getErrorColor(maxError, 15))}>
                  {maxError.toFixed(2)}°
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Model Quality Metrics */}
      {(rSquared !== undefined || directionAccuracy !== undefined || jitter !== undefined) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Model Quality</CardTitle>
            <CardDescription>Advanced model performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rSquared !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">R² (R-squared)</span>
                  <span className={cn("text-sm font-semibold", getQualityColor(rSquared))}>
                    {rSquared.toFixed(3)}
                  </span>
                </div>
                <Progress value={rSquared * 100} className="h-2" />
              </div>
            )}
            {directionAccuracy !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Direction Accuracy</span>
                  <span className={cn("text-sm font-semibold", getQualityColor(directionAccuracy))}>
                    {(directionAccuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={directionAccuracy * 100} className="h-2" />
              </div>
            )}
            {jitter !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stability (1 - Jitter)</span>
                  <span className={cn("text-sm font-semibold", getQualityColor(1 - jitter))}>
                    {((1 - jitter) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={(1 - jitter) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Distribution Metrics */}
      {(stdDeviation !== undefined || variance !== undefined || meanAngle !== undefined || medianAngle !== undefined) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Distribution Metrics</CardTitle>
            <CardDescription>Statistical distribution of predictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {meanAngle !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mean Angle</span>
                <span className="text-sm font-semibold">
                  {meanAngle.toFixed(2)}°
                </span>
              </div>
            )}
            {medianAngle !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Median Angle</span>
                <span className="text-sm font-semibold">
                  {medianAngle.toFixed(2)}°
                </span>
              </div>
            )}
            {stdDeviation !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Standard Deviation</span>
                <span className="text-sm font-semibold">
                  {stdDeviation.toFixed(2)}°
                </span>
              </div>
            )}
            {variance !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Variance</span>
                <span className="text-sm font-semibold">
                  {variance.toFixed(2)}°²
                </span>
              </div>
            )}
            {angleRange !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Angle Range</span>
                <span className="text-sm font-semibold">
                  {angleRange.toFixed(2)}°
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {predictionRate !== undefined && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prediction Rate</span>
              <span className="text-sm font-semibold">
                {predictionRate.toFixed(1)} pred/s
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Angles Chart */}
      {recentAngles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Angles</CardTitle>
            <CardDescription>Last {Math.min(recentAngles.length, 10)} predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-20 space-x-1">
              {recentAngles.slice(-10).map((angle, index) => (
                <div
                  key={index}
                  className="bg-primary rounded-t"
                  style={{
                    height: `${Math.abs(angle) * 2 + 4}px`,
                    width: '8px',
                    opacity: 0.7 + (index / 10) * 0.3
                  }}
                  title={`${angle.toFixed(1)}°`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>-45°</span>
              <span>0°</span>
              <span>+45°</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

