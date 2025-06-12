import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
}

/**
 * Component hiển thị tiến trình theo bước
 * @param steps Danh sách các bước
 * @param currentStep Bước hiện tại (0-indexed)
 * @param completedSteps Danh sách các bước đã hoàn thành (optional)
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  steps, 
  currentStep, 
  completedSteps = [] 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  
  // Tính toán chiều rộng cho mỗi bước
  const stepWidth = width / steps.length;
  const lineWidth = (width - 80) / (steps.length - 1);
  
  return (
    <View style={styles.container}>
      {/* Dòng kết nối giữa các bước */}
      <View style={styles.lineContainer}>
        {steps.map((_, index) => {
          if (index === steps.length - 1) return null;
          const isCompleted = completedSteps.includes(index) || currentStep > index;
          return (
            <View 
              key={`line-${index}`}
              style={[
                styles.line,
                { 
                  width: lineWidth,
                  backgroundColor: isCompleted ? colors.tint : colors.tabIconDefault
                }
              ]}
            />
          );
        })}
      </View>
      
      {/* Các chấm đánh dấu bước */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = completedSteps.includes(index) || currentStep > index;
          
          return (
            <View 
              key={`step-${index}`}
              style={[
                styles.stepContainer,
                { width: stepWidth }
              ]}
            >
              <View 
                style={[
                  styles.dot,
                  { 
                    backgroundColor: isActive || isCompleted ? colors.tint : colors.tabIconDefault,
                    borderWidth: isActive ? 5 : 0,
                    borderColor: colors.background,
                    width: isActive ? 30 : 20,
                    height: isActive ? 30 : 20,
                  }
                ]}
              >
                {isCompleted && !isActive && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text 
                style={[
                  styles.stepText, 
                  { 
                    color: isActive || isCompleted ? colors.tint : colors.tabIconDefault,
                    fontWeight: isActive ? 'bold' : 'normal',
                  }
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    zIndex: 1,
  },
  line: {
    height: 3,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
}); 