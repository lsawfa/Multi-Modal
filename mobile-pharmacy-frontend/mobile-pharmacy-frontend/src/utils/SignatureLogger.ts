/**
 * Signature Logger Engine
 * Captures dynamic trajectory data from digital signatures
 * Records coordinates (x, y) with timestamps for kinematic analysis
 */

export interface SignaturePoint {
  x: number;
  y: number;
  t: number; // timestamp in milliseconds (performance.now())
  absolute_t: number; // absolute timestamp (Date.now())
  pressure: number; // pointer pressure (0-1)
  tilt_x: number; // pen tilt X (-90 to 90)
  tilt_y: number; // pen tilt Y (-90 to 90)
  pointer_type: 'mouse' | 'pen' | 'touch';
}

export interface SignatureStroke {
  stroke_id: number;
  start_timestamp: number;
  end_timestamp: number | null;
  points: SignaturePoint[];
  duration_ms: number;
}

export interface SignatureKinematics {
  total_distance: number;
  average_velocity: number;
  max_velocity: number;
  average_acceleration: number;
  max_acceleration: number;
  stroke_count: number;
  total_points: number;
}

export interface SignatureTrajectory {
  session_id: string;
  start_timestamp: number;
  end_timestamp: number | null;
  canvas_width: number;
  canvas_height: number;
  strokes: SignatureStroke[];
  kinematics: SignatureKinematics;
}

export interface SignatureExportData {
  session_id: string;
  export_timestamp: number;
  recording_duration_ms: number | null;
  signature_trajectory: SignatureTrajectory;
  raw_points: SignaturePoint[];
  stroke_count: number;
  total_points: number;
  kinematics: SignatureKinematics;
  image_data_url?: string; // Optional: final signature as PNG
}

class SignatureLogger {
  private sessionId: string;
  private strokes: SignatureStroke[] = [];
  private currentStroke: SignatureStroke | null = null;
  private allPoints: SignaturePoint[] = [];
  private isRecording: boolean = false;
  private startTime: number | null = null;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;

  // Throttle config (50 samples/second for smooth drawing)
  private readonly THROTTLE_INTERVAL = 20; // 50 samples/sec
  private lastPointTime: number = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Start recording signature
   */
  start(canvasWidth: number, canvasHeight: number): void {
    // Always allow re-initialization with new dimensions
    this.sessionId = this.generateSessionId();
    this.isRecording = true;
    this.startTime = performance.now();
    this.strokes = [];
    this.allPoints = [];
    this.currentStroke = null;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    console.log(`[SignatureLogger] Started recording. Canvas: ${canvasWidth}x${canvasHeight}, isRecording: ${this.isRecording}`);
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (!this.isRecording) return;

    // Close any open stroke
    if (this.currentStroke) {
      this.endStroke();
    }

    this.isRecording = false;
    console.log(`[SignatureLogger] Stopped recording. Total strokes: ${this.strokes.length}, Total points: ${this.allPoints.length}`);
  }

  /**
   * Begin a new stroke (pointer down)
   */
  beginStroke(
    x: number,
    y: number,
    pressure: number = 0.5,
    tiltX: number = 0,
    tiltY: number = 0,
    pointerType: 'mouse' | 'pen' | 'touch' = 'touch'
  ): void {
    if (!this.isRecording) {
      console.warn('[SignatureLogger] beginStroke called but not recording! Auto-starting...');
      // Auto-start if not recording
      this.isRecording = true;
      this.startTime = performance.now();
    }

    const now = performance.now();
    const absoluteNow = Date.now();

    // Close any existing stroke
    if (this.currentStroke) {
      this.endStroke();
    }

    const point: SignaturePoint = {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      t: now,
      absolute_t: absoluteNow,
      pressure,
      tilt_x: tiltX,
      tilt_y: tiltY,
      pointer_type: pointerType,
    };

    this.currentStroke = {
      stroke_id: this.strokes.length + 1,
      start_timestamp: now,
      end_timestamp: null,
      points: [point],
      duration_ms: 0,
    };

    this.allPoints.push(point);
    this.lastPointTime = now;
  }

  /**
   * Add point to current stroke (pointer move)
   */
  addPoint(
    x: number,
    y: number,
    pressure: number = 0.5,
    tiltX: number = 0,
    tiltY: number = 0,
    pointerType: 'mouse' | 'pen' | 'touch' = 'touch'
  ): boolean {
    if (!this.isRecording || !this.currentStroke) return false;

    const now = performance.now();

    // Throttle check
    if (now - this.lastPointTime < this.THROTTLE_INTERVAL) {
      return false;
    }

    const absoluteNow = Date.now();

    const point: SignaturePoint = {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      t: now,
      absolute_t: absoluteNow,
      pressure,
      tilt_x: tiltX,
      tilt_y: tiltY,
      pointer_type: pointerType,
    };

    this.currentStroke.points.push(point);
    this.allPoints.push(point);
    this.lastPointTime = now;

    return true;
  }

  /**
   * End current stroke (pointer up)
   */
  endStroke(): void {
    if (!this.currentStroke) {
      // No current stroke - this is normal when called as safety check
      return;
    }

    const now = performance.now();
    this.currentStroke.end_timestamp = now;
    this.currentStroke.duration_ms = now - this.currentStroke.start_timestamp;

    console.log(`[SignatureLogger] Stroke ${this.currentStroke.stroke_id} ended: ${this.currentStroke.points.length} points`);
    
    this.strokes.push(this.currentStroke);
    this.currentStroke = null;
  }

  /**
   * Calculate kinematics from recorded data
   */
  calculateKinematics(): SignatureKinematics {
    // Include current stroke in stroke count
    const strokeCount = this.strokes.length + (this.currentStroke && this.currentStroke.points.length > 0 ? 1 : 0);
    
    if (this.allPoints.length < 2) {
      return {
        total_distance: 0,
        average_velocity: 0,
        max_velocity: 0,
        average_acceleration: 0,
        max_acceleration: 0,
        stroke_count: strokeCount,
        total_points: this.allPoints.length,
      };
    }

    let totalDistance = 0;
    const velocities: number[] = [];
    const accelerations: number[] = [];

    // Combine completed strokes with current stroke
    const allStrokes = [...this.strokes];
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      allStrokes.push(this.currentStroke);
    }

    // Calculate per-stroke kinematics
    for (const stroke of allStrokes) {
      const strokeVelocities: number[] = [];
      
      for (let i = 1; i < stroke.points.length; i++) {
        const p1 = stroke.points[i - 1];
        const p2 = stroke.points[i];

        // Distance
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        totalDistance += distance;

        // Time delta in seconds
        const dt = (p2.t - p1.t) / 1000;
        if (dt > 0) {
          // Velocity (pixels per second)
          const velocity = distance / dt;
          velocities.push(velocity);
          strokeVelocities.push(velocity);
        }
      }

      // Calculate acceleration from velocities within this stroke only
      for (let i = 1; i < strokeVelocities.length; i++) {
        const v1 = strokeVelocities[i - 1];
        const v2 = strokeVelocities[i];
        // Use stroke points at corresponding indices
        const p1 = stroke.points[i]; // i corresponds to strokeVelocities index
        const p2 = stroke.points[i + 1];
        if (p1 && p2) {
          const dt = (p2.t - p1.t) / 1000;
          if (dt > 0) {
            const acceleration = Math.abs(v2 - v1) / dt;
            accelerations.push(acceleration);
          }
        }
      }
    }

    const avgVelocity = velocities.length > 0
      ? velocities.reduce((a, b) => a + b, 0) / velocities.length
      : 0;
    const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : 0;

    const avgAcceleration = accelerations.length > 0
      ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length
      : 0;
    const maxAcceleration = accelerations.length > 0 ? Math.max(...accelerations) : 0;

    return {
      total_distance: Math.round(totalDistance * 100) / 100,
      average_velocity: Math.round(avgVelocity * 100) / 100,
      max_velocity: Math.round(maxVelocity * 100) / 100,
      average_acceleration: Math.round(avgAcceleration * 100) / 100,
      max_acceleration: Math.round(maxAcceleration * 100) / 100,
      stroke_count: strokeCount,
      total_points: this.allPoints.length,
    };
  }

  /**
   * Get signature trajectory
   */
  getTrajectory(): SignatureTrajectory {
    const now = performance.now();
    const kinematics = this.calculateKinematics();

    // Include current stroke if exists
    const allStrokes = [...this.strokes];
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      allStrokes.push({
        ...this.currentStroke,
        end_timestamp: now,
        duration_ms: now - this.currentStroke.start_timestamp,
      });
    }

    return {
      session_id: this.sessionId,
      start_timestamp: this.startTime || 0,
      end_timestamp: this.isRecording ? null : now,
      canvas_width: this.canvasWidth,
      canvas_height: this.canvasHeight,
      strokes: allStrokes,
      kinematics,
    };
  }

  /**
   * Get all raw points
   */
  getRawPoints(): SignaturePoint[] {
    return [...this.allPoints];
  }

  /**
   * Export all data
   */
  getExportData(imageDataUrl?: string): SignatureExportData {
    const now = performance.now();
    const duration = this.startTime ? now - this.startTime : null;
    const kinematics = this.calculateKinematics();
    
    // Include current stroke in stroke count
    const strokeCount = this.strokes.length + (this.currentStroke && this.currentStroke.points.length > 0 ? 1 : 0);

    console.log(`[SignatureLogger] getExportData - strokes: ${this.strokes.length}, currentStroke: ${this.currentStroke ? this.currentStroke.points.length : 'null'}, allPoints: ${this.allPoints.length}`);

    return {
      session_id: this.sessionId,
      export_timestamp: Date.now(),
      recording_duration_ms: duration,
      signature_trajectory: this.getTrajectory(),
      raw_points: this.getRawPoints(),
      stroke_count: strokeCount,
      total_points: this.allPoints.length,
      kinematics,
      image_data_url: imageDataUrl,
    };
  }

  /**
   * Clear all data (for canvas clear)
   */
  clear(): void {
    this.strokes = [];
    this.allPoints = [];
    this.currentStroke = null;
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();

    console.log('[SignatureLogger] Data cleared');
  }

  /**
   * Check if has any strokes
   */
  hasSignature(): boolean {
    return this.strokes.length > 0 || (this.currentStroke !== null && this.currentStroke.points.length > 0);
  }

  /**
   * Check if recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

// Export singleton instance
const signatureLogger = new SignatureLogger();
export { SignatureLogger };
export default signatureLogger;
