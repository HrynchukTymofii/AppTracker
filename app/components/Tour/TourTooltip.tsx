import React, { ReactNode, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { useColorScheme } from '@/hooks/useColorScheme';
import { X, ArrowRight, ArrowLeft } from 'lucide-react-native';

interface TourTooltipProps {
  visible: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  onClose: () => void;
  title: string;
  content: string;
  stepNumber: number;
  totalSteps: number;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  children?: ReactNode;
  showPrev?: boolean;
  showNext?: boolean;
  isLastStep?: boolean;
  showSkipButton?: boolean;
  nextButtonText?: string;
  skipButtonText?: string;
  delayMs?: number;
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  visible,
  onNext,
  onPrev,
  onSkip,
  onClose,
  title,
  content,
  stepNumber,
  totalSteps,
  placement = 'bottom',
  children,
  showPrev = false,
  showNext = true,
  isLastStep = false,
  showSkipButton = true,
  nextButtonText,
  skipButtonText = 'Skip Tour',
  delayMs = 0,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = React.useState(false);

  useEffect(() => {
    if (visible) {
      // Reset animation
      fadeAnim.setValue(0);
      setShowContent(false);

      // Delay before showing tooltip
      const delayTimer = setTimeout(() => {
        setShowContent(true);
        // Start fade-in animation after delay
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, delayMs);

      return () => clearTimeout(delayTimer);
    } else {
      setShowContent(false);
    }
  }, [visible, fadeAnim, delayMs]);

  return (
    <Tooltip
      isVisible={visible && showContent}
      content={
        <Animated.View style={[
          styles.tooltipContent,
          {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            opacity: fadeAnim,
            transform: [{
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            }],
          }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.badge, { backgroundColor: '#06B6D4' }]}>
                <Text style={styles.badgeText}>
                  {stepNumber}/{totalSteps}
                </Text>
              </View>
              <Text style={[
                styles.title,
                { color: isDark ? '#ffffff' : '#1f2937' }
              ]}>
                {title}
              </Text>
            </View>
            <TouchableOpacity onPress={onSkip} style={styles.closeButton}>
              <X size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text style={[
            styles.content,
            { color: isDark ? '#d1d5db' : '#4b5563' }
          ]}>
            {content}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            {showSkipButton && (
              <TouchableOpacity
                onPress={onSkip}
                style={[
                  styles.skipButton,
                  { backgroundColor: isDark ? '#374151' : '#f3f4f6' }
                ]}
              >
                <Text style={[
                  styles.skipButtonText,
                  { color: isDark ? '#9ca3af' : '#6b7280' }
                ]}>
                  {skipButtonText}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.navigationButtons}>
              {showPrev && stepNumber > 1 && onPrev && (
                <TouchableOpacity
                  onPress={onPrev}
                  style={[
                    styles.navButton,
                    { backgroundColor: isDark ? '#374151' : '#f3f4f6' }
                  ]}
                >
                  <ArrowLeft size={16} color={isDark ? '#06B6D4' : '#0891B2'} />
                  <Text style={[
                    styles.navButtonText,
                    { color: isDark ? '#06B6D4' : '#0891B2' }
                  ]}>
                    Prev
                  </Text>
                </TouchableOpacity>
              )}

              {showNext && onNext && (
                <TouchableOpacity
                  onPress={onNext}
                  style={[styles.navButton, styles.nextButton]}
                >
                  <Text style={styles.nextButtonText}>
                    {nextButtonText || (isLastStep ? 'Finish' : 'Next')}
                  </Text>
                  {!isLastStep && !nextButtonText && (
                    <ArrowRight size={16} color="#ffffff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      }
      placement={placement}
      onClose={onClose}
      contentStyle={[
        styles.tooltip,
        { backgroundColor: isDark ? '#1e293b' : '#ffffff' }
      ]}
      arrowSize={{ width: 16, height: 8 }}
      backgroundColor="rgba(0,0,0,0.5)"
      showChildInTooltip={true}
      disableShadow={false}
    >
      {children}
    </Tooltip>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 16,
  },
  tooltipContent: {
    padding: 20,
    borderRadius: 16,
    minWidth: 280,
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  nextButton: {
    backgroundColor: '#06B6D4',
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
