import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const settingsData: SettingItem[] = [
    // Tài khoản
    {
      id: 'account',
      title: 'Quản lý tài khoản',
      subtitle: 'Thông tin cá nhân, bảo mật',
      icon: 'person-circle-outline',
      type: 'navigation',
      onPress: () => router.push('/profile/edit'),
    },
    {
      id: 'security',
      title: 'Bảo mật',
      subtitle: 'Mật khẩu, xác thực 2 bước',
      icon: 'shield-checkmark-outline',
      type: 'navigation',
      onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển'),
    },

    // Thông báo
    {
      id: 'notifications',
      title: 'Thông báo',
      subtitle: 'Nhận thông báo về đặt chỗ, ưu đãi',
      icon: 'notifications-outline',
      type: 'toggle',
      value: notifications,
      onValueChange: setNotifications,
    },
    {
      id: 'location',
      title: 'Dịch vụ vị trí',
      subtitle: 'Cho phép ứng dụng truy cập vị trí',
      icon: 'location-outline',
      type: 'toggle',
      value: locationServices,
      onValueChange: setLocationServices,
    },

    // Ứng dụng
    {
      id: 'biometric',
      title: 'Đăng nhập sinh trắc học',
      subtitle: 'Sử dụng vân tay hoặc Face ID',
      icon: 'finger-print-outline',
      type: 'toggle',
      value: biometricAuth,
      onValueChange: setBiometricAuth,
    },
    {
      id: 'backup',
      title: 'Sao lưu tự động',
      subtitle: 'Tự động sao lưu dữ liệu',
      icon: 'cloud-upload-outline',
      type: 'toggle',
      value: autoBackup,
      onValueChange: setAutoBackup,
    },
    {
      id: 'language',
      title: 'Ngôn ngữ',
      subtitle: 'Tiếng Việt',
      icon: 'language-outline',
      type: 'navigation',
      onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển'),
    },

    // Hỗ trợ
    {
      id: 'help',
      title: 'Trung tâm trợ giúp',
      subtitle: 'FAQ, hướng dẫn sử dụng',
      icon: 'help-circle-outline',
      type: 'navigation',
      onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển'),
    },
    {
      id: 'contact',
      title: 'Liên hệ hỗ trợ',
      subtitle: 'Chat, email, hotline',
      icon: 'headset-outline',
      type: 'navigation',
      onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển'),
    },
    {
      id: 'feedback',
      title: 'Gửi phản hồi',
      subtitle: 'Đánh giá ứng dụng',
      icon: 'chatbubble-outline',
      type: 'navigation',
      onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển'),
    },

    // Về ứng dụng
    {
      id: 'about',
      title: 'Về GoTour',
      subtitle: 'Phiên bản 1.0.0',
      icon: 'information-circle-outline',
      type: 'navigation',
      onPress: () => Alert.alert('GoTour', 'Phiên bản 1.0.0\nỨng dụng du lịch toàn diện'),
    },
    {
      id: 'privacy',
      title: 'Chính sách bảo mật',
      icon: 'document-text-outline',
      type: 'navigation',
      onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển'),
    },
    {
      id: 'terms',
      title: 'Điều khoản sử dụng',
      icon: 'newspaper-outline',
      type: 'navigation',
      onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển'),
    },
  ];

  const clearCache = async () => {
    Alert.alert(
      'Xóa cache',
      'Bạn có chắc chắn muốn xóa cache ứng dụng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Thành công', 'Đã xóa cache ứng dụng');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa cache');
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = (item: SettingItem, sectionIndex: number, itemIndex: number) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          { backgroundColor: colors.cardBackground },
          itemIndex === 0 && styles.firstItem,
          itemIndex === getSectionItems(sectionIndex).length - 1 && styles.lastItem,
        ]}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.tint}15` }]}>
            <Ionicons name={item.icon as any} size={20} color={colors.tint} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: colors.tabIconDefault }]}>
                {item.subtitle}
              </Text>
            )}
          </View>

          {item.type === 'toggle' ? (
            <Switch
              value={item.value}
              onValueChange={item.onValueChange}
              trackColor={{ false: '#767577', true: colors.tint }}
              thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
            />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getSectionItems = (sectionIndex: number) => {
    const sections = [
      settingsData.slice(0, 2),   // Tài khoản
      settingsData.slice(2, 4),   // Thông báo
      settingsData.slice(4, 7),   // Ứng dụng
      settingsData.slice(7, 10),  // Hỗ trợ
      settingsData.slice(10, 13), // Về ứng dụng
    ];
    return sections[sectionIndex] || [];
  };

  const sectionTitles = [
    'Tài khoản',
    'Thông báo & Quyền riêng tư',
    'Ứng dụng',
    'Hỗ trợ',
    'Về ứng dụng',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: 'Cài đặt',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sectionTitles.map((title, sectionIndex) => (
          <View key={title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>
              {title}
            </Text>
            <View style={styles.sectionContent}>
              {getSectionItems(sectionIndex).map((item, itemIndex) => 
                renderSettingItem(item, sectionIndex, itemIndex)
              )}
            </View>
          </View>
        ))}

        {/* Cache & Debug */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>
            Dữ liệu
          </Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[
                styles.settingItem,
                styles.firstItem,
                styles.lastItem,
                { backgroundColor: colors.cardBackground },
              ]}
              onPress={clearCache}
            >
              <View style={styles.settingContent}>
                <View style={[styles.iconContainer, { backgroundColor: '#ff648515' }]}>
                  <Ionicons name="trash-outline" size={20} color="#ff6485" />
                </View>
                
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Xóa cache
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.tabIconDefault }]}>
                    Giải phóng bộ nhớ tạm
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
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
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  sectionContent: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e1e1',
  },
  firstItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 32,
  },
}); 