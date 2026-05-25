/**
 * Scroll Logger Engine
 * Captures scroll behavior, velocity, viewport mapping, and dwell time analysis
 * for information reading behavior study
 */

export interface ScrollEvent {
  timestamp: number;
  absolute_timestamp: number;
  scroll_y: number;
  viewport_height: number;
  document_height: number;
  viewport_percentage: number; // 0-100
  scroll_velocity: number; // pixels per second
  visible_section: string | null;
}

export interface DwellTimeRecord {
  section_id: string;
  section_name: string;
  start_timestamp: number;
  end_timestamp: number | null;
  dwell_duration_ms: number;
  is_reading: boolean; // velocity near 0
}

export interface SectionVisibility {
  section_id: string;
  section_name: string;
  visible_percentage: number;
  time_in_viewport_ms: number;
  reading_time_ms: number; // time with velocity ~0
}

export interface ScrollAnalytics {
  session_id: string;
  page_id: string;
  start_timestamp: number;
  end_timestamp: number | null;
  total_scroll_distance: number;
  max_scroll_depth: number;
  average_scroll_velocity: number;
  scroll_events: ScrollEvent[];
  dwell_records: DwellTimeRecord[];
  section_analytics: Map<string, SectionVisibility>;
}

export interface ScrollExportData {
  session_id: string;
  page_id: string;
  export_timestamp: number;
  recording_duration_ms: number | null;
  total_scroll_events: number;
  max_scroll_depth_percentage: number;
  average_velocity: number;
  scroll_events: ScrollEvent[];
  dwell_records: DwellTimeRecord[];
  section_visibility: SectionVisibility[];
  reading_behavior: {
    total_reading_time_ms: number;
    sections_read: string[];
    efek_samping_read_time_ms: number;
    efek_samping_reached: boolean;
  };
}

class ScrollLogger {
  private scrollEvents: ScrollEvent[] = [];
  private dwellRecords: DwellTimeRecord[] = [];
  private sectionVisibility: Map<string, SectionVisibility> = new Map();
  private registeredSections: Map<string, HTMLElement> = new Map();
  
  private sessionId: string;
  private pageId: string = '';
  private startTime: number | null = null;
  private isRecording: boolean = false;
  
  // Scroll tracking state
  private lastScrollY: number = 0;
  private lastScrollTime: number = 0;
  private lastVelocity: number = 0;
  private currentVisibleSection: string | null = null;
  private currentDwellStart: number | null = null;
  
  // Throttle config (10-20 samples per second)
  private readonly THROTTLE_INTERVAL = 50; // 20 samples/sec
  private readonly DWELL_VELOCITY_THRESHOLD = 50; // px/s - below this = reading
  private throttleTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Bound handlers
  private boundScrollHandler: () => void;
  private boundResizeHandler: () => void;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.boundScrollHandler = this.throttledScrollHandler.bind(this);
    this.boundResizeHandler = this.handleResize.bind(this);
  }

  private generateSessionId(): string {
    return `scroll_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Start recording scroll events
   */
  start(pageId: string): void {
    if (this.isRecording) return;
    
    this.pageId = pageId;
    this.isRecording = true;
    this.startTime = performance.now();
    this.scrollEvents = [];
    this.dwellRecords = [];
    this.sectionVisibility.clear();
    
    // Initialize section visibility tracking
    this.registeredSections.forEach((_, sectionId) => {
      this.sectionVisibility.set(sectionId, {
        section_id: sectionId,
        section_name: sectionId,
        visible_percentage: 0,
        time_in_viewport_ms: 0,
        reading_time_ms: 0,
      });
    });
    
    // Add event listeners
    window.addEventListener('scroll', this.boundScrollHandler, { passive: true });
    window.addEventListener('resize', this.boundResizeHandler, { passive: true });
    
    // Record initial position
    this.recordScrollEvent();
    
    console.log(`[ScrollLogger] Started recording for page: ${pageId}`);
  }

  /**
   * Stop recording scroll events
   */
  stop(): void {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    // Close any open dwell record
    if (this.currentDwellStart && this.currentVisibleSection) {
      this.closeDwellRecord();
    }
    
    window.removeEventListener('scroll', this.boundScrollHandler);
    window.removeEventListener('resize', this.boundResizeHandler);
    
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
    
    console.log(`[ScrollLogger] Stopped recording. Total events: ${this.scrollEvents.length}`);
  }

  /**
   * Register a section element for visibility tracking
   */
  registerSection(sectionId: string, element: HTMLElement): void {
    this.registeredSections.set(sectionId, element);
    
    if (this.isRecording) {
      this.sectionVisibility.set(sectionId, {
        section_id: sectionId,
        section_name: sectionId,
        visible_percentage: 0,
        time_in_viewport_ms: 0,
        reading_time_ms: 0,
      });
    }
  }

  /**
   * Unregister a section
   */
  unregisterSection(sectionId: string): void {
    this.registeredSections.delete(sectionId);
  }

  /**
   * Throttled scroll handler - 20 samples per second
   */
  private throttledScrollHandler(): void {
    const now = performance.now();
    
    if (now - this.lastScrollTime >= this.THROTTLE_INTERVAL) {
      this.recordScrollEvent();
    }
  }

  /**
   * Record a scroll event with velocity calculation
   */
  private recordScrollEvent(): void {
    const now = performance.now();
    const absoluteNow = Date.now();
    
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const viewportPercentage = (scrollY / (documentHeight - viewportHeight)) * 100 || 0;
    
    // Calculate velocity (pixels per second)
    const timeDelta = now - this.lastScrollTime;
    const scrollDelta = Math.abs(scrollY - this.lastScrollY);
    const velocity = timeDelta > 0 ? (scrollDelta / timeDelta) * 1000 : 0;
    
    // Determine currently visible section
    const visibleSection = this.getCurrentVisibleSection();
    
    const event: ScrollEvent = {
      timestamp: now,
      absolute_timestamp: absoluteNow,
      scroll_y: scrollY,
      viewport_height: viewportHeight,
      document_height: documentHeight,
      viewport_percentage: Math.min(100, Math.max(0, viewportPercentage)),
      scroll_velocity: Math.round(velocity * 100) / 100,
      visible_section: visibleSection,
    };
    
    this.scrollEvents.push(event);
    
    // Update dwell tracking
    this.updateDwellTracking(visibleSection, velocity, now);
    
    // Update section visibility
    this.updateSectionVisibility(timeDelta, velocity);
    
    // Update state
    this.lastScrollY = scrollY;
    this.lastScrollTime = now;
    this.lastVelocity = velocity;
  }

  /**
   * Get the section currently most visible in viewport
   */
  private getCurrentVisibleSection(): string | null {
    let maxVisibility = 0;
    let mostVisibleSection: string | null = null;
    
    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;
    
    this.registeredSections.forEach((element, sectionId) => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + viewportTop;
      const elementBottom = rect.bottom + viewportTop;
      
      // Calculate visible portion
      const visibleTop = Math.max(viewportTop, elementTop);
      const visibleBottom = Math.min(viewportBottom, elementBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibility = visibleHeight / window.innerHeight;
      
      if (visibility > maxVisibility) {
        maxVisibility = visibility;
        mostVisibleSection = sectionId;
      }
    });
    
    return mostVisibleSection;
  }

  /**
   * Update dwell time tracking
   */
  private updateDwellTracking(section: string | null, velocity: number, timestamp: number): void {
    const isReading = velocity < this.DWELL_VELOCITY_THRESHOLD;
    
    // Section changed
    if (section !== this.currentVisibleSection) {
      // Close previous dwell record if exists
      if (this.currentDwellStart && this.currentVisibleSection) {
        this.closeDwellRecord();
      }
      
      // Start new dwell record
      if (section) {
        this.currentVisibleSection = section;
        this.currentDwellStart = timestamp;
      } else {
        this.currentVisibleSection = null;
        this.currentDwellStart = null;
      }
    }
    
    // Update current dwell record reading status
    if (this.currentVisibleSection && this.currentDwellStart) {
      const currentDwell = this.dwellRecords.find(
        d => d.section_id === this.currentVisibleSection && d.end_timestamp === null
      );
      if (currentDwell) {
        currentDwell.dwell_duration_ms = timestamp - this.currentDwellStart;
        currentDwell.is_reading = isReading;
      } else {
        // Create new open dwell record
        this.dwellRecords.push({
          section_id: this.currentVisibleSection,
          section_name: this.currentVisibleSection,
          start_timestamp: this.currentDwellStart,
          end_timestamp: null,
          dwell_duration_ms: timestamp - this.currentDwellStart,
          is_reading: isReading,
        });
      }
    }
  }

  /**
   * Close current dwell record
   */
  private closeDwellRecord(): void {
    const now = performance.now();
    const openRecord = this.dwellRecords.find(
      d => d.section_id === this.currentVisibleSection && d.end_timestamp === null
    );
    
    if (openRecord) {
      openRecord.end_timestamp = now;
      openRecord.dwell_duration_ms = now - openRecord.start_timestamp;
    }
  }

  /**
   * Update section visibility analytics
   */
  private updateSectionVisibility(timeDelta: number, velocity: number): void {
    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;
    const isReading = velocity < this.DWELL_VELOCITY_THRESHOLD;
    
    this.registeredSections.forEach((element, sectionId) => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + viewportTop;
      const elementBottom = rect.bottom + viewportTop;
      
      // Calculate visible portion
      const visibleTop = Math.max(viewportTop, elementTop);
      const visibleBottom = Math.min(viewportBottom, elementBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const elementHeight = rect.height;
      const visibilityPercent = elementHeight > 0 ? (visibleHeight / elementHeight) * 100 : 0;
      
      const visibility = this.sectionVisibility.get(sectionId);
      if (visibility && visibilityPercent > 0) {
        visibility.visible_percentage = Math.max(visibility.visible_percentage, visibilityPercent);
        visibility.time_in_viewport_ms += timeDelta;
        
        if (isReading) {
          visibility.reading_time_ms += timeDelta;
        }
      }
    });
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Re-record current position after resize
    this.recordScrollEvent();
  }

  /**
   * Get all scroll events
   */
  getScrollEvents(): ScrollEvent[] {
    return [...this.scrollEvents];
  }

  /**
   * Get dwell records
   */
  getDwellRecords(): DwellTimeRecord[] {
    return [...this.dwellRecords];
  }

  /**
   * Get section visibility analytics
   */
  getSectionVisibility(): SectionVisibility[] {
    return Array.from(this.sectionVisibility.values());
  }

  /**
   * Calculate reading behavior analytics
   */
  getReadingBehavior(): {
    total_reading_time_ms: number;
    sections_read: string[];
    efek_samping_read_time_ms: number;
    efek_samping_reached: boolean;
  } {
    const sectionsRead: string[] = [];
    let totalReadingTime = 0;
    let efekSampingReadTime = 0;
    let efekSampingReached = false;
    
    this.sectionVisibility.forEach((visibility, sectionId) => {
      if (visibility.reading_time_ms > 500) { // At least 500ms reading
        sectionsRead.push(sectionId);
      }
      totalReadingTime += visibility.reading_time_ms;
      
      if (sectionId.toLowerCase().includes('efek') || sectionId.toLowerCase().includes('samping')) {
        efekSampingReadTime = visibility.reading_time_ms;
        efekSampingReached = visibility.visible_percentage > 50;
      }
    });
    
    return {
      total_reading_time_ms: totalReadingTime,
      sections_read: sectionsRead,
      efek_samping_read_time_ms: efekSampingReadTime,
      efek_samping_reached: efekSampingReached,
    };
  }

  /**
   * Get average scroll velocity
   */
  getAverageVelocity(): number {
    if (this.scrollEvents.length === 0) return 0;
    
    const totalVelocity = this.scrollEvents.reduce((sum, e) => sum + e.scroll_velocity, 0);
    return totalVelocity / this.scrollEvents.length;
  }

  /**
   * Get maximum scroll depth reached
   */
  getMaxScrollDepth(): number {
    if (this.scrollEvents.length === 0) return 0;
    
    return Math.max(...this.scrollEvents.map(e => e.viewport_percentage));
  }

  /**
   * Export all data as JSON-ready object
   */
  getExportData(): ScrollExportData {
    const now = performance.now();
    const duration = this.startTime ? now - this.startTime : null;
    
    return {
      session_id: this.sessionId,
      page_id: this.pageId,
      export_timestamp: Date.now(),
      recording_duration_ms: duration,
      total_scroll_events: this.scrollEvents.length,
      max_scroll_depth_percentage: this.getMaxScrollDepth(),
      average_velocity: this.getAverageVelocity(),
      scroll_events: this.getScrollEvents(),
      dwell_records: this.getDwellRecords(),
      section_visibility: this.getSectionVisibility(),
      reading_behavior: this.getReadingBehavior(),
    };
  }

  /**
   * Clear all recorded data
   */
  clearData(): void {
    this.scrollEvents = [];
    this.dwellRecords = [];
    this.sectionVisibility.clear();
    this.currentVisibleSection = null;
    this.currentDwellStart = null;
    this.lastScrollY = 0;
    this.lastScrollTime = 0;
    this.lastVelocity = 0;
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

// Export singleton instance
const scrollLogger = new ScrollLogger();
export { ScrollLogger };
export default scrollLogger;
