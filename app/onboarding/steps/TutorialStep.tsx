import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BookOpen, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context';
import ProgressBar from '@/components/onboarding/ProgressBar';
import XPAnimation from '@/components/onboarding/XPAnimation';
import ConfettiEffect from '@/components/onboarding/ConfettiEffect';
import Colors from '@/constants/colors';

export default function TutorialStep() {
  const { nextStep, currentStep, totalSteps, addXp } = useOnboarding();
  
  const [showXp, setShowXp] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [tutorialPhase, setTutorialPhase] = React.useState<'intro' | 'highlight' | 'complete'>('intro');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation
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

  const handleStartTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTutorialPhase('highlight');
  };

  const handleTapLibrary = () => {
    setTutorialPhase('complete');
    setShowConfetti(true);
    setShowXp(true);
    addXp(15);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setTimeout(() => {
      setShowXp(false);
    }, 1500);
    
    setTimeout(() => {
      setShowConfetti(false);
      nextStep();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <ConfettiEffect 
        trigger={showConfetti} 
        intensity="medium"
      />
      
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
        <View style={styles.iconContainer}>
          <BookOpen color={Colors.accent} size={48} />
        </View>

        <Text style={styles.title}>Explore Your Library</Text>
        <Text style={styles.subtitle}>
          Tap the Library tab to discover AI coaches ready to help you achieve your goals
        </Text>

        {tutorialPhase === 'intro' && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTutorial}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Tutorial</Text>
            <ArrowRight color={Colors.white} size={20} style={styles.buttonIcon} />
          </TouchableOpacity>
        )}
        
        {tutorialPhase === 'highlight' && (
          <View style={styles.simulationContainer}>
            <View style={styles.mockTabBar}>
              <TouchableOpacity
                style={styles.mockTab}
                onPress={handleTapLibrary}
                activeOpacity={0.7}
              >
                <View style={styles.highlightedTab}>
                  <BookOpen color={Colors.accent} size={24} />
                  <Text style={styles.mockTabTextActive}>Library</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.mockTab}>
                <View style={styles.normalTab}>
                  <BookOpen color={Colors.textMuted} size={24} />
                  <Text style={styles.mockTabText}>Saved</Text>
                </View>
              </View>
            </View>
            <Text style={styles.simulationText}>
              Tap the Library tab above!
            </Text>
          </View>
        )}
        
        {tutorialPhase === 'complete' && (
          <View style={styles.simulationContainer}>
            <Text style={styles.completedText}>Great job! 🎉</Text>
          </View>
        )}

        <XPAnimation 
          amount={15} 
          trigger={showXp} 
          y={50}
        />
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  simulationContainer: {
    alignItems: 'center',
  },
  simulationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  mockTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mockTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  highlightedTab: {
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  normalTab: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  mockTabTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
    marginTop: 4,
  },
  mockTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 4,
  },
  completedText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.navy,
  },
});
