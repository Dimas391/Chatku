// app/src/Components/call/CallTimer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';

interface CallTimerProps {
  isActive: boolean;
  onDurationChange?: (duration: number) => void;
}

const CallTimer: React.FC<CallTimerProps> = ({ isActive, onDurationChange }) => {
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const onDurationChangeRef = useRef(onDurationChange);

  useEffect(() => {
    onDurationChangeRef.current = onDurationChange;
  }, [onDurationChange]);

  useEffect(() => {
    if (isActive) {
      durationRef.current = 0;
      setDuration(0);

      intervalRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
        onDurationChangeRef.current?.(durationRef.current);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      durationRef.current = 0;
      setDuration(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return <Text style={styles.text}>{formatDuration(duration)}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 48,
  },
});

export default CallTimer;