import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface DatePickerProps {
  label?: string;
  placeholder?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  dateFormat?: string;
  disabled?: boolean;
}

export const DatePicker = ({
  label,
  placeholder = 'Chọn ngày',
  value,
  onChange,
  minimumDate,
  maximumDate,
  error,
  helperText,
  containerStyle,
  labelStyle,
  dateFormat = 'dd/MM/yyyy',
  disabled = false,
}: DatePickerProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const showDatepicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const getDisplayDate = () => {
    if (!value) return placeholder;
    return format(value, dateFormat, { locale: vi });
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label,
          { color: colors.text },
          error ? { color: colors.error } : null,
          labelStyle
        ]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={showDatepicker}
        style={[
          styles.pickerButton,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.inputBackground,
            opacity: disabled ? 0.7 : 1
          }
        ]}
        disabled={disabled}
      >
        <Text
          style={[
            styles.dateText,
            { color: value ? colors.text : colors.tabIconDefault }
          ]}
        >
          {getDisplayDate()}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.tabIconDefault} />
      </TouchableOpacity>

      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          { color: error ? colors.error : colors.tabIconDefault }
        ]}>
          {error || helperText}
        </Text>
      )}

      {showPicker && (
        <View>
          {Platform.OS === 'ios' && (
            <View style={[styles.iosPickerContainer, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity
                style={styles.iosDoneButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={[styles.doneButtonText, { color: colors.tint }]}>Xong</Text>
              </TouchableOpacity>
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="vi"
                textColor={colors.text}
                themeVariant={colorScheme}
              />
            </View>
          )}

          {Platform.OS === 'android' && (
            <DateTimePicker
              value={value || new Date()}
              mode="date"
              display="default"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          )}
        </View>
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
  pickerButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
  },
  iosPickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 1000,
  },
  iosDoneButton: {
    alignSelf: 'flex-end',
    padding: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 