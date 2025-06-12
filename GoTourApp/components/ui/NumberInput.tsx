import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface NumberInputProps {
  label?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const NumberInput = ({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  error,
  helperText,
  containerStyle,
  labelStyle,
  disabled = false,
}: NumberInputProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleIncrement = () => {
    if (disabled) return;
    if (value < max) {
      onValueChange(value + step);
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    if (value > min) {
      onValueChange(value - step);
    }
  };

  const isDecrementDisabled = value <= min || disabled;
  const isIncrementDisabled = value >= max || disabled;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: colors.text },
            error ? { color: colors.error } : null,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.inputBackground,
            opacity: disabled ? 0.7 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isDecrementDisabled
                ? colors.buttonDisabled
                : colors.tint,
            },
          ]}
          onPress={handleDecrement}
          disabled={isDecrementDisabled}
        >
          <Ionicons name="remove" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={[styles.valueText, { color: colors.text }]}>{value}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isIncrementDisabled
                ? colors.buttonDisabled
                : colors.tint,
            },
          ]}
          onPress={handleIncrement}
          disabled={isIncrementDisabled}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? colors.error : colors.tabIconDefault },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    height: 48,
  },
  button: {
    width: 48,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
  },
}); 