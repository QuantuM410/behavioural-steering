const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface PredictionRequest {
  image: string // base64 encoded
  throttle?: number
  speed?: number
}

export interface PredictionResponse {
  steering_angle: number
  steering_angle_degrees: number
  throttle: number
  speed: number
  device: string
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  device: string
  cuda_available: boolean
}

export interface VideoPredictionResponse {
  predictions: Array<{
    frame: number
    timestamp: number
    steering_angle: number
    steering_angle_degrees: number
    throttle: number
    speed: number
    error?: string
  }>
  total_frames: number
  fps: number
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorMessage
    } catch {
      // Use default error message if JSON parsing fails
    }
    throw new ApiError(errorMessage, response.status, response)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new ApiError('Failed to parse response JSON', response.status, response)
  }
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/health`)
    return handleResponse<HealthResponse>(response)
  }

  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const response = await fetch(`${this.baseUrl}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    return handleResponse<PredictionResponse>(response)
  }

  async predictVideo(
    file: File,
    throttle: number = 0.5,
    speed: number = 20.0
  ): Promise<VideoPredictionResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('throttle', throttle.toString())
    formData.append('speed', speed.toString())

    const response = await fetch(`${this.baseUrl}/api/predict-video`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse<VideoPredictionResponse>(response)
  }

  async isBackendAvailable(): Promise<boolean> {
    try {
      await this.health()
      return true
    } catch {
      return false
    }
  }
}

// Utility functions for image processing
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1] // Remove data:image/jpeg;base64, prefix
}

export function videoFrameToCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  width: number = 224,
  height: number = 224
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // Set canvas size
  canvas.width = width
  canvas.height = height

  // Draw video frame to canvas
  ctx.drawImage(video, 0, 0, width, height)
}

export function extractVideoFrame(
  video: HTMLVideoElement,
  width: number = 224,
  height: number = 224
): string {
  const canvas = document.createElement('canvas')
  videoFrameToCanvas(video, canvas, width, height)
  return canvasToBase64(canvas)
}

// Default API client instance
export const apiClient = new ApiClient()
