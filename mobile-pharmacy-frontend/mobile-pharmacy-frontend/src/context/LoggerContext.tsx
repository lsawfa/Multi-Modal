import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import logger, {
    BiometricEvent,
    BiometricLogger,
    ExportData,
    KeyboardBiometricsSummary
} from '../utils/BiometricLogger';

interface LoggerContextType {
  logger: BiometricLogger;
  isRecording: boolean;
  eventCount: number;
  startRecording: () => void;
  stopRecording: () => void;
  getEvents: () => BiometricEvent[];
  getExportData: () => ExportData;
  getKeyboardBiometrics: () => KeyboardBiometricsSummary;
  clearEvents: () => void;
  sendToBackend: <T = unknown>(endpoint: string, data?: Record<string, unknown>) => Promise<T>;
}

interface LoggerProviderProps {
  children: ReactNode;
}

const LoggerContext = createContext<LoggerContextType | null>(null);

export function LoggerProvider({ children }: LoggerProviderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Start recording when component mounts
    logger.start();
    setIsRecording(true);

    // Update event count periodically
    intervalRef.current = setInterval(() => {
      setEventCount(logger.getEvents().length);
    }, 1000);

    return () => {
      logger.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const value: LoggerContextType = {
    logger: logger as unknown as BiometricLogger,
    isRecording,
    eventCount,
    startRecording: () => {
      logger.start();
      setIsRecording(true);
    },
    stopRecording: () => {
      logger.stop();
      setIsRecording(false);
    },
    getEvents: () => logger.getEvents(),
    getExportData: () => logger.getExportData(),
    getKeyboardBiometrics: () => logger.getKeyboardBiometricsSummary(),
    clearEvents: () => {
      logger.clearEvents();
      setEventCount(0);
    },
    sendToBackend: <T = unknown,>(endpoint: string, data?: Record<string, unknown>) => 
      logger.sendToBackend<T>(endpoint, data)
  };

  return (
    <LoggerContext.Provider value={value}>
      {children}
    </LoggerContext.Provider>
  );
}

export function useLogger(): LoggerContextType {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return context;
}

export default LoggerContext;
