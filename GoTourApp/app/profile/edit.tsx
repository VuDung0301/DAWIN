import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, updateProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
    address: user?.address || '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên phải có ít nhất 2 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại phải có 10 chữ số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        dateOfBirth: formData.dateOfBirth?.toISOString(),
      };

      await updateProfile(updateData);
      
      Alert.alert(
        'Thành công',
        'Thông tin cá nhân đã được cập nhật',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
      setErrors(prev => ({ ...prev, dateOfBirth: '' }));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: 'Chỉnh sửa thông tin',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <Text style={styles.avatarText}>
              {formData.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Text style={[styles.changeAvatarText, { color: colors.tint }]}>
              Thay đổi ảnh đại diện
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <TextInput
            label="Họ và tên *"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Nhập họ và tên"
            icon="person-outline"
            error={errors.name}
          />

          <TextInput
            label="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="Nhập địa chỉ email"
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />

          <TextInput
            label="Số điện thoại"
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            icon="call-outline"
            error={errors.phone}
          />

          <TouchableOpacity
            style={[styles.dateInput, { backgroundColor: colors.cardBackground }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.dateInputContent}>
              <Ionicons name="calendar-outline" size={20} color={colors.tint} />
              <View style={styles.dateTextContainer}>
                <Text style={[styles.dateLabel, { color: colors.tabIconDefault }]}>
                  Ngày sinh
                </Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>
                  {formData.dateOfBirth 
                    ? format(formData.dateOfBirth, 'dd/MM/yyyy', { locale: vi })
                    : 'Chọn ngày sinh'
                  }
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
            </View>
          </TouchableOpacity>

          <TextInput
            label="Địa chỉ"
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            placeholder="Nhập địa chỉ"
            multiline
            numberOfLines={3}
            icon="location-outline"
          />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfBirth || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.buttonSection}>
          <Button
            title="Lưu thay đổi"
            onPress={handleSave}
            isLoading={isLoading}
            disabled={isLoading}
            icon={<Ionicons name="checkmark" size={20} color="white" />}
            iconPosition="left"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  changeAvatarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 32,
  },
  dateInput: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dateTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
  },
  buttonSection: {
    marginBottom: 32,
  },
}); 