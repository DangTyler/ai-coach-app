import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Flame, Sun, Sunset, Moon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';
import ConfettiEffect from '@/components/onboarding/ConfettiEffect';
import SparkleEffect from '@/components/onboarding/SparkleEffect';
import Colors from '@/constants/colors';

const TIMES = [
  { id: 'morning', label: 'Morning', icon: Sun, time: '6-9 AM', color: '#F59E0B' },
  { id: 'afternoon', label: 'Afternoon', icon: Sunset, time: '12-3 PM', color: '#FF6B5B' },
  { id: 'evening', label: 'Evening', icon: Moon, time: '6-9 PM', color: '#6366F1' },
] as const;

type TimeId = typeof TIMES[number]['id'];

export default function StreakStep() {
  const { nextStep, currentStep, totalSteps, updateData } = useOnboarding();
  
  const [selectedTime, setSelectedTime] = useState<TimeId | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showFlame, setShowFlame] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const flameScale = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleTimeSelect = (timeId: TimeId) => {
    setSelectedTime(timeId);
    setShowSparkles(true);
    
    // Animate flame appearance
    setShowFlame(true);
    Animated.spring(flameScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();

    // Animate calendar
    Animated.spring(calendarAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();

    setShowConfetti(true);
    updateData({ practiceTime: timeId });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setShowConfetti(false);
      setShowSparkles(false);
    }, 2500);
  };

  const handleContinue = () => {
    if (selectedTime) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      nextStep();
    }
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={styles.container}>
      <SparkleEffect trigger={showSparkles} count={8} />
      
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>When will you practice?</Text>
        <Text style={styles.subtitle}>
          Build a streak by practicing consistently. Don't break the chain!
        </Text>

        {/* Calendar Visualization */}
        <Animated.View
          style={[
            styles.calendarContainer,
            {
              transform: [{ scale: calendarAnim }],
              opacity: calendarAnim,
            },
          ]}
        >
          <View style={styles.calendarHeader}>
            <Flame color={Colors.accent} size={20} />
            <Text style={styles.calendarTitle}>Your Streak</Text>
          </View>
          <View style={styles.calendarGrid}>
            {days.map((day, index) => (
              <View key={day} style={styles.dayCell}>
                <Text style={styles.dayLabel}>{day}</Text>
                <View style={[
                  styles.dayBox,
                  index < 3 && styles.dayBoxActive,
                ]}>
                  {index < 3 && (
                    <Animated.View
                      style={[
                        styles.flameIcon,
                        { transform: [{ scale: index === 2 ? flameScale : 1 }] },
                      ]}
                    >
                      <Flame color={Colors.accent} size={16} />
                    </Animated.View>
                  )}
                </View>
              </View>
            ))}
          </View>
          {showFlame && (
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakText}>3 day streak! Keep it up!</Text>
            </View>
          )}
        </Animated.View>

        {/* Time Selection */}
        <View style={styles.timesContainer}>
          {TIMES.map((time) => {
            const IconComponent = time.icon;
            return (
              <TouchableOpacity
                key={time.id}
                style={[
                  styles.timeCard,
                  selectedTime === time.id && styles.timeCardActive,
                  selectedTime === time.id && { borderColor: time.color },
                ]}
                onPress={() => handleTimeSelect(time.id)}
                activeOpacity={0.8}
              >
                <IconComponent 
                  color={selectedTime === time.id ? time.color : Colors.textMuted} 
                  size={28} 
                />
                <Text style={[
                  styles.timeLabel,
                  selectedTime === time.id && { color: time.color },
                ]}>
                  {time.label}
                </Text>
                <Text style={styles.timeRange}>{time.time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ConfettiEffect 
          trigger={showConfetti} 
          intensity="medium"
        />
      </Animated.View>

      <TouchableOpacity
        style={[styles.button, !selectedTime && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selectedTime}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.navy,
    marginLeft: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  dayBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxActive: {
    backgroundColor: Colors.accentLight,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  flameIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTextContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  timesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  timeCardActive: {
    backgroundColor: Colors.accentLight,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginTop: 8,
    marginBottom: 4,
  },
  timeRange: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  button: {
    backgroundColor: Colors.navy,
    margin: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
