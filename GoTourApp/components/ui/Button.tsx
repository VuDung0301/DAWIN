import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
  iconPosition = 'left',
}: ButtonProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Lấy style dựa trên variant
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? colors.buttonDisabled : colors.tint,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: disabled ? colors.buttonDisabled : colors.secondaryTint,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: disabled ? colors.buttonDisabled : colors.tint,
          },
          text: {
            color: disabled ? colors.buttonDisabled : colors.tint,
          },
        };
      case 'text':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          text: {
            color: disabled ? colors.buttonDisabled : colors.tint,
          },
        };
      default:
        return {
          container: {
            backgroundColor: disabled ? colors.buttonDisabled : colors.tint,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
    }
  };

  // Lấy style dựa trên size
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: 8,
            paddingHorizontal: 16,
          },
          text: {
            fontSize: 14,
          },
        };
      case 'medium':
        return {
          container: {
            paddingVertical: 12,
            paddingHorizontal: 20,
          },
          text: {
            fontSize: 16,
          },
        };
      case 'large':
        return {
          container: {
            paddingVertical: 14,
            paddingHorizontal: 24,
          },
          text: {
            fontSize: 18,
          },
        };
      default:
        return {
          container: {
            paddingVertical: 12,
            paddingHorizontal: 20,
          },
          text: {
            fontSize: 16,
          },
        };
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={variantStyle.text.color} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, variantStyle.text, sizeStyle.text, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
}); 