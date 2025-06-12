import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import { bookingService } from '@/services/bookingService';

const { width } = Dimensions.get('window');

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout, isAuthenticated } = useAuth();
  
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalPoints: 0,
    favoriteItems: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load user statistics
  const loadUserStats = async () => {
    if (!isAuthenticated || !user?._id) return;
    
    setIsLoadingStats(true);
    try {
      // TODO: Implement API call to get booking stats
      // const bookingStats = await bookingService.getUserBookingStats(user._id);
      
      // Mock data for now
      const totalTrips = 3; // Mock data
      const totalPoints = totalTrips * 100; // 100 điểm mỗi chuyến
      const favoriteItems = 5; // Mock data
      
      setStats({
        totalTrips,
        totalPoints,
        favoriteItems,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUserStats();
    }
  }, [isAuthenticated, user?._id]);

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Đăng xuất',
        onPress: async () => {
          await logout();
          setTimeout(() => {
            router.replace('/');
          }, 100);
        },
      },
    ]);
  };

  const renderNotLoggedIn = () => (
    <View style={styles.notLoggedInContainer}>
      <View style={styles.illustrationContainer}>
        <Ionicons name="person-circle-outline" size={120} color={colors.tint} />
      </View>
      
      <Text style={[styles.welcomeTitle, { color: colors.text }]}>
        Chào mừng đến với Dawin
      </Text>
      
      <Text style={[styles.welcomeSubtitle, { color: colors.tabIconDefault }]}>
        Đăng nhập để trải nghiệm đầy đủ tính năng của ứng dụng
      </Text>
      
      <View style={styles.authButtonsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.primaryButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.tint }]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Ionicons name="airplane" size={24} color={colors.tint} />
          <Text style={[styles.featureText, { color: colors.text }]}>Đặt vé máy bay</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="bed" size={24} color={colors.tint} />
          <Text style={[styles.featureText, { color: colors.text }]}>Đặt phòng khách sạn</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="camera" size={24} color={colors.tint} />
          <Text style={[styles.featureText, { color: colors.text }]}>Khám phá tour du lịch</Text>
        </View>
      </View>
    </View>
  );

  const renderLoggedIn = () => (
    <ScrollView style={styles.profileContainer} showsVerticalScrollIndicator={false}>
      {/* Header với gradient */}
      <LinearGradient
        colors={[colors.tint, colors.secondaryTint]}
        style={styles.profileHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoadingStats ? '...' : stats.totalTrips}
            </Text>
            <Text style={styles.statLabel}>Chuyến đi</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => Alert.alert('Điểm tích lũy', `Bạn có ${stats.totalPoints} điểm tích lũy`)}
          >
            <Text style={styles.statNumber}>
              {isLoadingStats ? '...' : stats.totalPoints}
            </Text>
            <Text style={styles.statLabel}>Điểm tích lũy</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoadingStats ? '...' : stats.favoriteItems}
            </Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu items */}
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
          onPress={() => router.push('/profile/edit')}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="person-outline" size={24} color={colors.tint} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Thông tin cá nhân</Text>
            <Text style={[styles.menuSubtitle, { color: colors.tabIconDefault }]}>
              Quản lý thông tin tài khoản
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
        </TouchableOpacity>



        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="settings-outline" size={24} color={colors.tint} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Cài đặt</Text>
            <Text style={[styles.menuSubtitle, { color: colors.tabIconDefault }]}>
              Thông báo, bảo mật, ngôn ngữ
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
          onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="help-circle-outline" size={24} color={colors.tint} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Trợ giúp & Hỗ trợ</Text>
            <Text style={[styles.menuSubtitle, { color: colors.tabIconDefault }]}>
              FAQ, liên hệ hỗ trợ
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
        </TouchableOpacity>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.cardBackground }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: 'Tài khoản',
          headerShown: true,
        }}
      />

      {isAuthenticated ? renderLoggedIn() : renderNotLoggedIn()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Not logged in styles
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  illustrationContainer: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  authButtonsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 16,
  },

  // Logged in styles
  profileContainer: {
    flex: 1,
  },
  profileHeader: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },

  // Menu styles
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },

  // Logout styles
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FF6B6B',
  },
  bottomSpacer: {
    height: 32,
  },
}); 