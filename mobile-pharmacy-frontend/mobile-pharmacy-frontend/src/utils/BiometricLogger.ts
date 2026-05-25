/**
 * Biometric Logger Engine
 * Captures behavioral biometrics data including mouse movements, clicks, scrolls, and keyboard events
 * with precise timing for Hold Time and Flight Time calculations
 */

// Type definitions
export interface BiometricEvent {
  event_type: string;
  timestamp: number;
  absolute_timestamp: number;
  session_id: string;
  target_element_id: string | null;
  target_element_tag: string | null;
  target_element_class: string | null;
  target_element_name: string | null;
  coordinates?: {
    pageX: number | null;
    pageY: number | null;
    clientX: number | null;
    clientY: number | null;
    screenX: number | null;
    screenY: number | null;
  };
  biometrics?: {
    hold_time_ms: number | null;
    flight_time_ms: number | null;
  };
  [key: string]: unknown;
}

export interface KeyTiming {
  keydownTime: number;
  key: string;
  code: string;
}

export interface LastKeyUp {
  timestamp: number;
  key: string;
  code: string;
}

export interface LoggerConfig {
  throttleInterval: number;
  maxEventsBuffer: number;
  autoFlushInterval: number;
}

export interface ExportData {
  session_id: string;
  export_timestamp: number;
  total_events: number;
  recording_duration_ms: number | null;
  events: BiometricEvent[];
}

export interface BiometricStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
}

export interface KeyboardBiometricsSummary {
  hold_time_stats: BiometricStats | null;
  flight_time_stats: BiometricStats | null;
  total_keystrokes: number;
}

// Cognitive Load Analysis Types
export interface CognitiveLoadEvent {
  event_type: 'correction' | 'hesitation' | 'thinking_pause';
  timestamp: number;
  latency_ms: number;
  context: string;
}

export interface SearchLog {
  search_session_id: string;
  start_timestamp: number;
  end_timestamp: number | null;
  total_keystrokes: number;
  correction_events: CognitiveLoadEvent[];
  thinking_pauses: CognitiveLoadEvent[];  // latency > 500ms
  hesitation_events: CognitiveLoadEvent[]; // arrow key usage
  keystroke_events: BiometricEvent[];
  search_duration_ms: number | null;
  error_rate: number; // corrections / total_keystrokes
}

class BiometricLogger {
  private events: BiometricEvent[] = [];
  private keyTimings: Map<string, KeyTiming> = new Map();
  private lastKeyUp: LastKeyUp | null = null;
  private _isRecording: boolean = false;
  private sessionId: string;
  private startTime: number | null = null;
  private config: LoggerConfig;
  
  // Cognitive Load Tracking
  private searchLogs: Map<string, SearchLog> = new Map();
  private activeSearchSession: string | null = null;
  private lastKeystrokeTime: number = 0;
  private readonly THINKING_PAUSE_THRESHOLD = 500; // ms
  
  // Throttle timestamps
  private lastMouseMoveTime: number = 0;
  private lastScrollTime: number = 0;
  private lastTouchMoveTime: number = 0;

  constructor(options: Partial<LoggerConfig> = {}) {
    this.sessionId = this.generateSessionId();
    
    // Configuration
    this.config = {
      throttleInterval: options.throttleInterval || 50, // 20 samples per second
      maxEventsBuffer: options.maxEventsBuffer || 10000,
      autoFlushInterval: options.autoFlushInterval || 30000,
    };
    
    // Bind methods
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  get isRecording(): boolean {
    return this._isRecording;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getTimestamp(): number {
    return performance.now();
  }

  private getAbsoluteTimestamp(): number {
    return Date.now();
  }

  /**
   * Categorize key for privacy (content-blind logging)
   * Only records key category, not the actual character
   */
  private categorizeKey(key: string, code: string): string {
    // Special keys - safe to record
    if (key.length > 1) {
      if (['Backspace', 'Delete', 'Tab', 'Enter', 'Escape'].includes(key)) return 'control';
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return 'arrow';
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) return 'modifier';
      if (key.startsWith('F') && key.length <= 3) return 'function';
      return 'special';
    }
    
    // Categorize by code for privacy
    if (code.startsWith('Key')) return 'letter';
    if (code.startsWith('Digit')) return 'digit';
    if (code.startsWith('Numpad')) return 'numpad';
    if (/^(Comma|Period|Slash|Backslash|BracketLeft|BracketRight|Semicolon|Quote|Backquote|Minus|Equal)$/.test(code)) return 'punctuation';
    
    return 'other';
  }

  /**
   * Throttle function to limit event frequency (50-100ms interval)
   * Prevents memory overload from high-frequency events
   */
  private shouldThrottle(eventType: string): boolean {
    const now = this.getTimestamp();
    
    if (eventType === 'mousemove') {
      if (now - this.lastMouseMoveTime < this.config.throttleInterval) {
        return true;
      }
      this.lastMouseMoveTime = now;
    }
    
    if (eventType === 'scroll') {
      if (now - this.lastScrollTime < this.config.throttleInterval) {
        return true;
      }
      this.lastScrollTime = now;
    }
    
    if (eventType === 'touchmove') {
      if (now - this.lastTouchMoveTime < this.config.throttleInterval) {
        return true;
      }
      this.lastTouchMoveTime = now;
    }
    
    return false;
  }

  /**
   * Create a standardized event object
   */
  private createEventObject(
    eventType: string, 
    event: Partial<MouseEvent & KeyboardEvent & TouchEvent & { target?: EventTarget | HTMLElement | null }>,
    additionalData: Record<string, unknown> = {}
  ): BiometricEvent {
    const target = event.target as HTMLElement | null;
    
    return {
      event_type: eventType,
      timestamp: this.getTimestamp(),
      absolute_timestamp: this.getAbsoluteTimestamp(),
      session_id: this.sessionId,
      target_element_id: target?.id || null,
      target_element_tag: target?.tagName?.toLowerCase() || null,
      target_element_class: target?.className || null,
      target_element_name: (target as HTMLInputElement)?.name || null,
      coordinates: {
        pageX: event.pageX ?? null,
        pageY: event.pageY ?? null,
        clientX: event.clientX ?? null,
        clientY: event.clientY ?? null,
        screenX: event.screenX ?? null,
        screenY: event.screenY ?? null
      },
      ...additionalData
    };
  }

  /**
   * Add event to the buffer
   */
  private addEvent(eventObject: BiometricEvent): void {
    if (!this._isRecording) return;
    
    this.events.push(eventObject);
    
    // Auto-trim if buffer exceeds max size
    if (this.events.length > this.config.maxEventsBuffer) {
      this.events = this.events.slice(-this.config.maxEventsBuffer);
    }
  }

  // ==================== EVENT HANDLERS ====================

  private handleMouseMove(event: MouseEvent): void {
    if (this.shouldThrottle('mousemove')) return;
    
    const eventObject = this.createEventObject('mousemove', event as unknown as MouseEvent, {
      movement: {
        movementX: event.movementX || 0,
        movementY: event.movementY || 0
      }
    });
    
    this.addEvent(eventObject);
  }

  private handleClick(event: MouseEvent): void {
    const eventObject = this.createEventObject('click', event as unknown as MouseEvent, {
      button: event.button,
      detail: event.detail
    });
    
    this.addEvent(eventObject);
  }

  private handleScroll(event: Event): void {
    if (this.shouldThrottle('scroll')) return;
    
    const target = event.target as HTMLElement;
    const eventObject = this.createEventObject('scroll', event as unknown as MouseEvent, {
      scroll_position: {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        scrollTop: target?.scrollTop || document.documentElement.scrollTop,
        scrollLeft: target?.scrollLeft || document.documentElement.scrollLeft
      }
    });
    
    this.addEvent(eventObject);
  }

  /**
   * Handle keydown - record timestamp for Hold Time calculation
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const now = this.getTimestamp();
    const keyId = `${event.code}_${event.key}`;
    const target = event.target as HTMLInputElement;
    
    // Only record if this is a new keypress (not a repeat)
    if (!event.repeat) {
      this.keyTimings.set(keyId, {
        keydownTime: now,
        key: event.key,
        code: event.code
      });
    }
    
    // Privacy: Only record metadata, not actual input content (content-blind)
    const eventObject = this.createEventObject('keydown', event as unknown as MouseEvent, {
      key_category: this.categorizeKey(event.key, event.code), // Only category, not actual key
      code: event.code,
      key_modifiers: {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey
      },
      is_repeat: event.repeat,
      input_length: target?.value?.length || 0 // Only length, not content
    });
    
    this.addEvent(eventObject);
  }

  /**
   * Handle keyup - calculate Hold Time and Flight Time
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const now = this.getTimestamp();
    const keyId = `${event.code}_${event.key}`;
    const target = event.target as HTMLInputElement;
    
    let holdTime: number | null = null;
    let flightTime: number | null = null;
    
    // Calculate Hold Time (time between keydown and keyup for the same key)
    const keyTiming = this.keyTimings.get(keyId);
    if (keyTiming) {
      holdTime = now - keyTiming.keydownTime;
      this.keyTimings.delete(keyId);
    }
    
    // Calculate Flight Time (time between previous keyup and current keydown)
    if (this.lastKeyUp && keyTiming) {
      flightTime = keyTiming.keydownTime - this.lastKeyUp.timestamp;
    }
    
    // Privacy: Only record metadata, not actual input content (content-blind)
    const eventObject = this.createEventObject('keyup', event as unknown as MouseEvent, {
      key_category: this.categorizeKey(event.key, event.code), // Only category, not actual key
      code: event.code,
      key_modifiers: {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey
      },
      biometrics: {
        hold_time_ms: holdTime,
        flight_time_ms: flightTime
      },
      input_length: target?.value?.length || 0 // Only length, not content
    });
    
    // Update last keyup reference
    this.lastKeyUp = {
      timestamp: now,
      key: event.key,
      code: event.code
    };
    
    this.addEvent(eventObject);
  }

  private handleFocus(event: FocusEvent): void {
    const eventObject = this.createEventObject('focus', event as unknown as MouseEvent);
    this.addEvent(eventObject);
  }

  private handleBlur(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    // Privacy: Only record length, not actual content (content-blind)
    const eventObject = this.createEventObject('blur', event as unknown as MouseEvent, {
      final_length: target?.value?.length || 0 // Only length, not content
    });
    this.addEvent(eventObject);
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    const eventObject = this.createEventObject('touchstart', {
      ...event,
      pageX: touch?.pageX,
      pageY: touch?.pageY,
      clientX: touch?.clientX,
      clientY: touch?.clientY,
      screenX: touch?.screenX,
      screenY: touch?.screenY,
      target: event.target as HTMLElement
    } as unknown as MouseEvent, {
      touch_count: event.touches.length
    });
    
    this.addEvent(eventObject);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.shouldThrottle('touchmove')) return;
    
    const touch = event.touches[0];
    const eventObject = this.createEventObject('touchmove', {
      ...event,
      pageX: touch?.pageX,
      pageY: touch?.pageY,
      clientX: touch?.clientX,
      clientY: touch?.clientY,
      screenX: touch?.screenX,
      screenY: touch?.screenY,
      target: event.target as HTMLElement
    } as unknown as MouseEvent, {
      touch_count: event.touches.length
    });
    
    this.addEvent(eventObject);
  }

  private handleTouchEnd(event: TouchEvent): void {
    const eventObject = this.createEventObject('touchend', event as unknown as MouseEvent, {
      changed_touches: event.changedTouches.length
    });
    
    this.addEvent(eventObject);
  }

  // ==================== CONTROL METHODS ====================

  /**
   * Start recording events
   */
  start(): void {
    if (this._isRecording) return;
    
    this._isRecording = true;
    this.startTime = this.getTimestamp();
    this.sessionId = this.generateSessionId();
    
    // Add global event listeners
    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    document.addEventListener('click', this.handleClick, { passive: true });
    document.addEventListener('scroll', this.handleScroll, { passive: true });
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('focusin', this.handleFocus, { passive: true });
    document.addEventListener('focusout', this.handleBlur, { passive: true });
    
    // Touch events for mobile
    document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    
    // Record session start event
    this.addEvent({
      event_type: 'session_start',
      timestamp: this.startTime,
      absolute_timestamp: this.getAbsoluteTimestamp(),
      session_id: this.sessionId,
      target_element_id: null,
      target_element_tag: null,
      target_element_class: null,
      target_element_name: null,
      user_agent: navigator.userAgent,
      screen_resolution: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device_pixel_ratio: window.devicePixelRatio
    });
    
    console.log('[BiometricLogger] Recording started', this.sessionId);
  }

  /**
   * Stop recording events
   */
  stop(): void {
    if (!this._isRecording) return;
    
    // Record session end event
    this.addEvent({
      event_type: 'session_end',
      timestamp: this.getTimestamp(),
      absolute_timestamp: this.getAbsoluteTimestamp(),
      session_id: this.sessionId,
      target_element_id: null,
      target_element_tag: null,
      target_element_class: null,
      target_element_name: null,
      total_events: this.events.length,
      session_duration_ms: this.startTime ? this.getTimestamp() - this.startTime : 0
    });
    
    this._isRecording = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('focusin', this.handleFocus);
    document.removeEventListener('focusout', this.handleBlur);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    
    console.log('[BiometricLogger] Recording stopped');
  }

  /**
   * Get all recorded events
   */
  getEvents(): BiometricEvent[] {
    return [...this.events];
  }

  /**
   * Get events in structured JSON format ready for backend
   */
  getExportData(): ExportData {
    return {
      session_id: this.sessionId,
      export_timestamp: this.getAbsoluteTimestamp(),
      total_events: this.events.length,
      recording_duration_ms: this._isRecording && this.startTime ? this.getTimestamp() - this.startTime : null,
      events: this.events
    };
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    this.keyTimings.clear();
    this.lastKeyUp = null;
  }

  /**
   * Get keyboard biometrics summary
   */
  getKeyboardBiometricsSummary(): KeyboardBiometricsSummary {
    const keyupEvents = this.events.filter(e => e.event_type === 'keyup' && e.biometrics);
    
    const holdTimes = keyupEvents
      .map(e => e.biometrics?.hold_time_ms)
      .filter((t): t is number => t !== null && t !== undefined && t > 0);
    
    const flightTimes = keyupEvents
      .map(e => e.biometrics?.flight_time_ms)
      .filter((t): t is number => t !== null && t !== undefined && t > 0);
    
    const calculateStats = (arr: number[]): BiometricStats | null => {
      if (arr.length === 0) return null;
      const sum = arr.reduce((a, b) => a + b, 0);
      const mean = sum / arr.length;
      const sorted = [...arr].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
      const stdDev = Math.sqrt(variance);
      
      return { mean, median, min, max, stdDev, count: arr.length };
    };
    
    return {
      hold_time_stats: calculateStats(holdTimes),
      flight_time_stats: calculateStats(flightTimes),
      total_keystrokes: keyupEvents.length
    };
  }

  /**
   * Async send data to backend
   */
  async sendToBackend<T = unknown>(endpoint: string, additionalData: Record<string, unknown> = {}): Promise<T> {
    const payload = {
      ...this.getExportData(),
      ...additionalData
    };
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('[BiometricLogger] Data sent successfully');
      return await response.json();
    } catch (error) {
      console.error('[BiometricLogger] Failed to send data:', error);
      throw error;
    }
  }

  // ==================== COGNITIVE LOAD / SEARCH LOG METHODS ====================

  /**
   * Start a new search session for cognitive load tracking
   */
  startSearchSession(inputId: string): string {
    const searchSessionId = `search_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const searchLog: SearchLog = {
      search_session_id: searchSessionId,
      start_timestamp: this.getTimestamp(),
      end_timestamp: null,
      total_keystrokes: 0,
      correction_events: [],
      thinking_pauses: [],
      hesitation_events: [],
      keystroke_events: [],
      search_duration_ms: null,
      error_rate: 0
    };
    
    this.searchLogs.set(searchSessionId, searchLog);
    this.activeSearchSession = searchSessionId;
    this.lastKeystrokeTime = this.getTimestamp();
    
    console.log('[BiometricLogger] Search session started:', searchSessionId);
    return searchSessionId;
  }

  /**
   * End the current search session
   */
  endSearchSession(sessionId?: string): SearchLog | null {
    const targetSessionId = sessionId || this.activeSearchSession;
    if (!targetSessionId) return null;
    
    const searchLog = this.searchLogs.get(targetSessionId);
    if (!searchLog) return null;
    
    searchLog.end_timestamp = this.getTimestamp();
    searchLog.search_duration_ms = searchLog.end_timestamp - searchLog.start_timestamp;
    searchLog.error_rate = searchLog.total_keystrokes > 0 
      ? searchLog.correction_events.length / searchLog.total_keystrokes 
      : 0;
    
    if (this.activeSearchSession === targetSessionId) {
      this.activeSearchSession = null;
    }
    
    console.log('[BiometricLogger] Search session ended:', targetSessionId);
    return searchLog;
  }

  /**
   * Record a keystroke event for cognitive load analysis
   */
  recordSearchKeystroke(
    code: string, 
    keyCategory: string, 
    isCorrection: boolean,
    inputLength: number
  ): void {
    if (!this.activeSearchSession) return;
    
    const searchLog = this.searchLogs.get(this.activeSearchSession);
    if (!searchLog) return;
    
    const now = this.getTimestamp();
    const latency = this.lastKeystrokeTime > 0 ? now - this.lastKeystrokeTime : 0;
    
    // Detect thinking pause (latency > 500ms)
    if (latency > this.THINKING_PAUSE_THRESHOLD && this.lastKeystrokeTime > 0) {
      searchLog.thinking_pauses.push({
        event_type: 'thinking_pause',
        timestamp: now,
        latency_ms: latency,
        context: `Pause before ${keyCategory} key at position ${inputLength}`
      });
    }
    
    // Detect correction events (Backspace, Delete)
    if (isCorrection || code === 'Backspace' || code === 'Delete') {
      searchLog.correction_events.push({
        event_type: 'correction',
        timestamp: now,
        latency_ms: latency,
        context: `${code} at position ${inputLength}`
      });
    }
    
    // Detect hesitation (Arrow key usage)
    if (code.startsWith('Arrow')) {
      searchLog.hesitation_events.push({
        event_type: 'hesitation',
        timestamp: now,
        latency_ms: latency,
        context: `${code} navigation at position ${inputLength}`
      });
    }
    
    searchLog.total_keystrokes++;
    this.lastKeystrokeTime = now;
    
    // Store keystroke event
    const keystrokeEvent: BiometricEvent = {
      event_type: 'search_keystroke',
      timestamp: now,
      absolute_timestamp: this.getAbsoluteTimestamp(),
      session_id: this.sessionId,
      target_element_id: null,
      target_element_tag: 'input',
      target_element_class: null,
      target_element_name: null,
      key_category: keyCategory,
      code: code,
      latency_ms: latency,
      is_correction: isCorrection,
      input_length: inputLength,
      is_thinking_pause: latency > this.THINKING_PAUSE_THRESHOLD
    };
    
    searchLog.keystroke_events.push(keystrokeEvent);
  }

  /**
   * Get the current active search log
   */
  getActiveSearchLog(): SearchLog | null {
    if (!this.activeSearchSession) return null;
    return this.searchLogs.get(this.activeSearchSession) || null;
  }

  /**
   * Get a specific search log by session ID
   */
  getSearchLog(sessionId: string): SearchLog | null {
    return this.searchLogs.get(sessionId) || null;
  }

  /**
   * Get all search logs
   */
  getAllSearchLogs(): SearchLog[] {
    return Array.from(this.searchLogs.values());
  }

  /**
   * Calculate cognitive load metrics from a search session
   */
  getCognitiveLoadMetrics(sessionId?: string): {
    total_keystrokes: number;
    correction_count: number;
    thinking_pause_count: number;
    hesitation_count: number;
    error_rate: number;
    avg_latency_ms: number;
    max_latency_ms: number;
    thinking_pause_total_ms: number;
  } | null {
    const targetSessionId = sessionId || this.activeSearchSession;
    if (!targetSessionId) return null;
    
    const searchLog = this.searchLogs.get(targetSessionId);
    if (!searchLog) return null;
    
    const latencies = searchLog.keystroke_events
      .map(e => e.latency_ms as number)
      .filter(l => l > 0);
    
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;
    
    const thinkingPauseTotal = searchLog.thinking_pauses
      .reduce((sum, p) => sum + p.latency_ms, 0);
    
    return {
      total_keystrokes: searchLog.total_keystrokes,
      correction_count: searchLog.correction_events.length,
      thinking_pause_count: searchLog.thinking_pauses.length,
      hesitation_count: searchLog.hesitation_events.length,
      error_rate: searchLog.error_rate,
      avg_latency_ms: avgLatency,
      max_latency_ms: latencies.length > 0 ? Math.max(...latencies) : 0,
      thinking_pause_total_ms: thinkingPauseTotal
    };
  }
}

// Create singleton instance
const loggerInstance = new BiometricLogger();

export default loggerInstance;
export { BiometricLogger };
