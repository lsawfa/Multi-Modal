/**
 * Image Interaction Logger
 * Captures gesture-based interactions: pinch-to-zoom, scroll-wheel zoom, pan/drag
 * Uses Pointer Events API for unified mouse and touch input
 */

export interface GestureEvent {
  event_type: 'zoom' | 'pan' | 'pan_start' | 'pan_end' | 'pinch_start' | 'pinch_end' | 'wheel_zoom';
  timestamp: number;
  absolute_timestamp: number;
  scale_factor: number;
  pan_offset: {
    x: number;
    y: number;
  };
  pointer_count: number;
  delta?: {
    scale: number;
    x: number;
    y: number;
  };
  pointer_positions?: Array<{ id: number; x: number; y: number }>;
}

export interface InteractionSession {
  session_id: string;
  image_id: string;
  start_timestamp: number;
  end_timestamp: number | null;
  initial_scale: number;
  max_scale_reached: number;
  min_scale_reached: number;
  total_zoom_actions: number;
  total_pan_actions: number;
  gesture_events: GestureEvent[];
}

export interface ImageInteractionExportData {
  session_id: string;
  image_id: string;
  export_timestamp: number;
  recording_duration_ms: number | null;
  total_gesture_events: number;
  zoom_analytics: {
    max_scale: number;
    min_scale: number;
    zoom_in_count: number;
    zoom_out_count: number;
    average_zoom_level: number;
  };
  pan_analytics: {
    total_pan_distance: number;
    pan_action_count: number;
  };
  raw_data: GestureEvent[];
}

class ImageInteractionLogger {
  private gestureEvents: GestureEvent[] = [];
  private sessionId: string;
  private imageId: string = '';
  private startTime: number | null = null;
  private isRecording: boolean = false;

  // Current transform state
  private currentScale: number = 1;
  private currentPanX: number = 0;
  private currentPanY: number = 0;

  // Scale limits
  private minScale: number = 0.5;
  private maxScale: number = 5;

  // Analytics tracking
  private maxScaleReached: number = 1;
  private minScaleReached: number = 1;
  private zoomInCount: number = 0;
  private zoomOutCount: number = 0;
  private totalPanDistance: number = 0;
  private panActionCount: number = 0;

  // Multi-touch tracking
  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private initialPinchDistance: number = 0;
  private initialPinchScale: number = 1;
  private isPanning: boolean = false;
  private isPinching: boolean = false;
  private lastPanX: number = 0;
  private lastPanY: number = 0;

  // Throttle config (20 samples/second)
  private readonly THROTTLE_INTERVAL = 50;
  private lastEventTime: number = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Start recording image interactions
   */
  start(imageId: string): void {
    if (this.isRecording) return;

    this.imageId = imageId;
    this.isRecording = true;
    this.startTime = performance.now();
    this.gestureEvents = [];
    this.resetAnalytics();

    console.log(`[ImageInteractionLogger] Started recording for image: ${imageId}`);
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.activePointers.clear();

    console.log(`[ImageInteractionLogger] Stopped recording. Total events: ${this.gestureEvents.length}`);
  }

  /**
   * Reset analytics counters
   */
  private resetAnalytics(): void {
    this.currentScale = 1;
    this.currentPanX = 0;
    this.currentPanY = 0;
    this.maxScaleReached = 1;
    this.minScaleReached = 1;
    this.zoomInCount = 0;
    this.zoomOutCount = 0;
    this.totalPanDistance = 0;
    this.panActionCount = 0;
  }

  /**
   * Check if should record event (throttling)
   */
  private shouldRecordEvent(): boolean {
    const now = performance.now();
    if (now - this.lastEventTime >= this.THROTTLE_INTERVAL) {
      this.lastEventTime = now;
      return true;
    }
    return false;
  }

  /**
   * Record a gesture event
   */
  private recordEvent(
    eventType: GestureEvent['event_type'],
    delta?: { scale: number; x: number; y: number }
  ): void {
    if (!this.isRecording) return;

    const event: GestureEvent = {
      event_type: eventType,
      timestamp: performance.now(),
      absolute_timestamp: Date.now(),
      scale_factor: Math.round(this.currentScale * 1000) / 1000,
      pan_offset: {
        x: Math.round(this.currentPanX * 100) / 100,
        y: Math.round(this.currentPanY * 100) / 100,
      },
      pointer_count: this.activePointers.size,
      delta: delta,
      pointer_positions: Array.from(this.activePointers.entries()).map(([id, pos]) => ({
        id,
        x: Math.round(pos.x),
        y: Math.round(pos.y),
      })),
    };

    this.gestureEvents.push(event);
  }

  /**
   * Handle pointer down event
   */
  handlePointerDown(pointerId: number, x: number, y: number): void {
    this.activePointers.set(pointerId, { x, y });

    if (this.activePointers.size === 1) {
      // Single pointer - pan start
      this.isPanning = true;
      this.lastPanX = x;
      this.lastPanY = y;
      this.recordEvent('pan_start');
    } else if (this.activePointers.size === 2) {
      // Two pointers - pinch start
      this.isPanning = false;
      this.isPinching = true;
      this.initialPinchDistance = this.getPointerDistance();
      this.initialPinchScale = this.currentScale;
      this.recordEvent('pinch_start');
    }
  }

  /**
   * Handle pointer move event
   */
  handlePointerMove(pointerId: number, x: number, y: number): void {
    if (!this.activePointers.has(pointerId)) return;

    this.activePointers.set(pointerId, { x, y });

    if (this.isPinching && this.activePointers.size === 2) {
      // Pinch zoom
      this.handlePinchZoom();
    } else if (this.isPanning && this.activePointers.size === 1) {
      // Pan
      this.handlePan(x, y);
    }
  }

  /**
   * Handle pointer up event
   */
  handlePointerUp(pointerId: number): void {
    this.activePointers.delete(pointerId);

    if (this.isPinching && this.activePointers.size < 2) {
      this.isPinching = false;
      this.recordEvent('pinch_end');

      // If one pointer remains, switch to panning
      if (this.activePointers.size === 1) {
        const remaining = this.activePointers.entries().next().value;
        if (remaining) {
          this.isPanning = true;
          this.lastPanX = remaining[1].x;
          this.lastPanY = remaining[1].y;
        }
      }
    } else if (this.isPanning && this.activePointers.size === 0) {
      this.isPanning = false;
      this.recordEvent('pan_end');
    }
  }

  /**
   * Handle pinch zoom gesture
   */
  private handlePinchZoom(): void {
    if (!this.shouldRecordEvent()) return;

    const currentDistance = this.getPointerDistance();
    const scaleDelta = currentDistance / this.initialPinchDistance;
    const newScale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.initialPinchScale * scaleDelta)
    );

    const previousScale = this.currentScale;
    this.currentScale = newScale;

    // Update analytics
    if (newScale > previousScale) {
      this.zoomInCount++;
    } else if (newScale < previousScale) {
      this.zoomOutCount++;
    }

    this.maxScaleReached = Math.max(this.maxScaleReached, newScale);
    this.minScaleReached = Math.min(this.minScaleReached, newScale);

    this.recordEvent('zoom', {
      scale: newScale - previousScale,
      x: 0,
      y: 0,
    });
  }

  /**
   * Handle pan gesture
   */
  private handlePan(x: number, y: number): void {
    if (!this.shouldRecordEvent()) return;

    const deltaX = x - this.lastPanX;
    const deltaY = y - this.lastPanY;

    this.currentPanX += deltaX;
    this.currentPanY += deltaY;

    // Calculate pan distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    this.totalPanDistance += distance;
    this.panActionCount++;

    this.lastPanX = x;
    this.lastPanY = y;

    this.recordEvent('pan', {
      scale: 0,
      x: deltaX,
      y: deltaY,
    });
  }

  /**
   * Handle wheel zoom (mouse)
   */
  handleWheelZoom(deltaY: number, centerX: number, centerY: number): void {
    if (!this.isRecording) return;
    if (!this.shouldRecordEvent()) return;

    const zoomFactor = deltaY > 0 ? 0.9 : 1.1; // Zoom out/in
    const previousScale = this.currentScale;
    const newScale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.currentScale * zoomFactor)
    );

    this.currentScale = newScale;

    // Update analytics
    if (newScale > previousScale) {
      this.zoomInCount++;
    } else if (newScale < previousScale) {
      this.zoomOutCount++;
    }

    this.maxScaleReached = Math.max(this.maxScaleReached, newScale);
    this.minScaleReached = Math.min(this.minScaleReached, newScale);

    this.recordEvent('wheel_zoom', {
      scale: newScale - previousScale,
      x: centerX,
      y: centerY,
    });
  }

  /**
   * Get distance between two pointers
   */
  private getPointerDistance(): number {
    if (this.activePointers.size < 2) return 0;

    const pointers = Array.from(this.activePointers.values());
    const dx = pointers[1].x - pointers[0].x;
    const dy = pointers[1].y - pointers[0].y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Set scale programmatically (for external zoom controls)
   */
  setScale(scale: number): void {
    const previousScale = this.currentScale;
    this.currentScale = Math.max(this.minScale, Math.min(this.maxScale, scale));

    if (this.currentScale > previousScale) {
      this.zoomInCount++;
    } else if (this.currentScale < previousScale) {
      this.zoomOutCount++;
    }

    this.maxScaleReached = Math.max(this.maxScaleReached, this.currentScale);
    this.minScaleReached = Math.min(this.minScaleReached, this.currentScale);

    this.recordEvent('zoom', {
      scale: this.currentScale - previousScale,
      x: 0,
      y: 0,
    });
  }

  /**
   * Set pan offset programmatically
   */
  setPan(x: number, y: number): void {
    const deltaX = x - this.currentPanX;
    const deltaY = y - this.currentPanY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    this.currentPanX = x;
    this.currentPanY = y;
    this.totalPanDistance += distance;
    this.panActionCount++;

    this.recordEvent('pan', {
      scale: 0,
      x: deltaX,
      y: deltaY,
    });
  }

  /**
   * Get current transform state
   */
  getTransform(): { scale: number; panX: number; panY: number } {
    return {
      scale: this.currentScale,
      panX: this.currentPanX,
      panY: this.currentPanY,
    };
  }

  /**
   * Get all gesture events
   */
  getGestureEvents(): GestureEvent[] {
    return [...this.gestureEvents];
  }

  /**
   * Get zoom analytics
   */
  getZoomAnalytics(): {
    max_scale: number;
    min_scale: number;
    zoom_in_count: number;
    zoom_out_count: number;
    average_zoom_level: number;
  } {
    const zoomEvents = this.gestureEvents.filter(
      (e) => e.event_type === 'zoom' || e.event_type === 'wheel_zoom'
    );
    const avgZoom =
      zoomEvents.length > 0
        ? zoomEvents.reduce((sum, e) => sum + e.scale_factor, 0) / zoomEvents.length
        : 1;

    return {
      max_scale: this.maxScaleReached,
      min_scale: this.minScaleReached,
      zoom_in_count: this.zoomInCount,
      zoom_out_count: this.zoomOutCount,
      average_zoom_level: Math.round(avgZoom * 1000) / 1000,
    };
  }

  /**
   * Get pan analytics
   */
  getPanAnalytics(): {
    total_pan_distance: number;
    pan_action_count: number;
  } {
    return {
      total_pan_distance: Math.round(this.totalPanDistance),
      pan_action_count: this.panActionCount,
    };
  }

  /**
   * Export all data
   */
  getExportData(): ImageInteractionExportData {
    const now = performance.now();
    const duration = this.startTime ? now - this.startTime : null;

    return {
      session_id: this.sessionId,
      image_id: this.imageId,
      export_timestamp: Date.now(),
      recording_duration_ms: duration,
      total_gesture_events: this.gestureEvents.length,
      zoom_analytics: this.getZoomAnalytics(),
      pan_analytics: this.getPanAnalytics(),
      raw_data: this.getGestureEvents(),
    };
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.gestureEvents = [];
    this.resetAnalytics();
    this.activePointers.clear();
  }

  /**
   * Check if recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

// Export singleton instance
const imageInteractionLogger = new ImageInteractionLogger();
export { ImageInteractionLogger };
export default imageInteractionLogger;
