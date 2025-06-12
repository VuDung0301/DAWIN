import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  Text, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  useWindowDimensions,
  Alert
} from 'react-native';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { TextInput } from '../../components/ui/TextInput';
import { Colors, CategoryColors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { TourCard } from '../../components/TourCard';
import HotelCard from '../../components/HotelCard';
import { useAuth } from '../../hooks/useAuth';
import { toursApi, hotelsApi } from '../../lib/api';
import { Tour, Hotel } from '../../types';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

// Dữ liệu cho danh mục khám phá
const exploreCategories = [
  { id: '1', title: 'Tour', icon: 'map', route: '/explore', color: CategoryColors.tour },
  { id: '2', title: 'Chuyến bay', icon: 'airplane', route: '/flights', color: CategoryColors.flight },
  { id: '3', title: 'Khách sạn', icon: 'house', route: '/hotels', color: CategoryColors.hotel },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const [popularHotels, setPopularHotels] = useState<Hotel[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(true);
  const [isLoadingHotels, setIsLoadingHotels] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingTours(true);
    setIsLoadingHotels(true);
    
    try {
      // Fetch tours
      const toursResponse = await toursApi.getAll({ limit: 5 });
      if (toursResponse.success && toursResponse.data) {
        setFeaturedTours(toursResponse.data.tours || []);
      } else {
        console.error('Lỗi khi tải dữ liệu tour:', toursResponse.message);
        setFeaturedTours([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tour:', error);
      setFeaturedTours([]);
    } finally {
      setIsLoadingTours(false);
    }
    
    try {
      // Fetch hotels
      const hotelsResponse = await hotelsApi.getFeaturedHotels({ limit: 5 });
      if (hotelsResponse.success && hotelsResponse.data) {
        setPopularHotels(hotelsResponse.data.hotels || hotelsResponse.data || []);
      } else {
        console.error('Lỗi khi tải dữ liệu khách sạn:', hotelsResponse.message);
        setPopularHotels([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu khách sạn:', error);
      setPopularHotels([]);
    } finally {
      setIsLoadingHotels(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  // Xử lý tìm kiếm
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/explore',
        params: { search: searchQuery }
      });
    }
  };

  // Xử lý khi nhấn vào danh mục khám phá
  const handleCategoryPress = (route: string) => {
    // Kiểm tra route để chuyển hướng đúng
    if (route) {
      // Đảm bảo định dạng đúng cho expo-router
      if (route.startsWith('/')) {
        router.push(route as any);
      }
    }
  };

  // Xử lý khi nhấn vào "Xem tất cả" tours
  const handleViewAllTours = () => {
    router.push('/explore');
  };

  // Xử lý khi nhấn vào "Xem tất cả" hotels
  const handleViewAllHotels = () => {
    router.push('/hotels');
  };

  // Xử lý khi nhấn vào avatar hoặc thông tin người dùng
  const handleProfilePress = () => {
    router.push('/account');
  };

  // Render các mục khám phá
  const renderExploreItem = ({ item }: { item: typeof exploreCategories[0] }) => (
    <TouchableOpacity 
      style={styles.exploreItem}
      onPress={() => handleCategoryPress(item.route)}
    >
      <View style={[styles.exploreIconContainer, { backgroundColor: item.color + '20' }]}>
        <IconSymbol name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={[styles.exploreTitle, { color: colors.text }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  // Render tour card
  const renderTourItem = ({ item }: { item: Tour }) => (
    <TourCard tour={item} style={{ width: width - 32 }} />
  );

  // Render hotel card
  const renderHotelItem = ({ item }: { item: Hotel }) => (
    <HotelCard hotel={item} onPress={() => router.push(`/hotel/${item._id}`)} />
  );

  // Render tour loading skeleton
  const renderTourSkeleton = () => (
    <View style={[styles.skeletonCard, { backgroundColor: colors.cardBackground }]}>
      <View style={[styles.skeletonImage, { backgroundColor: colors.tabIconDefault + '30' }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonTitle, { backgroundColor: colors.tabIconDefault + '30' }]} />
        <View style={[styles.skeletonText, { backgroundColor: colors.tabIconDefault + '30' }]} />
        <View style={[styles.skeletonText, { backgroundColor: colors.tabIconDefault + '30', width: '60%' }]} />
      </View>
    </View>
  );

  // Render mục khám phá
  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.categoryItem, { backgroundColor: item.color }]}
      onPress={() => handleCategoryPress(item.route)}
    >
      <IconSymbol name={item.icon} size={28} color="white" />
      <Text style={styles.categoryTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header với thông tin user và tìm kiếm */}
        <View style={styles.header}>
          <View style={styles.userInfoContainer}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {user ? `Xin chào, ${user.name.split(' ')[0]}` : 'Xin chào'}
            </Text>
            <Text style={[styles.subgreeting, { color: colors.tabIconDefault }]}>
              Hôm nay bạn muốn đi đâu?
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Thanh tìm kiếm */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <TextInput
              placeholder="Tìm kiếm điểm đến, tour, khách sạn..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon="magnifyingglass"
              style={styles.searchInput}
            />
            <TouchableOpacity 
              style={[styles.searchButton, { backgroundColor: colors.tint }]}
              onPress={handleSearch}
            >
              <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Các mục khám phá nhanh */}
        <View style={styles.exploreSection}>
          <FlatList
            data={exploreCategories}
            renderItem={renderExploreItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.exploreCategoriesContainer}
          />
        </View>

        {/* Tour nổi bật */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tour nổi bật</Text>
            <TouchableOpacity onPress={handleViewAllTours}>
              <Text style={[styles.viewAll, { color: colors.tint }]}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {isLoadingTours ? (
            <View style={styles.loadingContainer}>
              {[1, 2].map((i) => (
                <View key={i} style={{ marginBottom: 16 }}>
                  {renderTourSkeleton()}
                </View>
              ))}
            </View>
          ) : featuredTours.length > 0 ? (
            <FlatList
              data={featuredTours}
              renderItem={renderTourItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toursContainer}
              snapToInterval={width - 32 + 16}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.tabIconDefault }}>
                Không có tour nào khả dụng
              </Text>
            </View>
          )}
        </View>

        {/* Khách sạn phổ biến */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Khách sạn phổ biến</Text>
            <TouchableOpacity onPress={handleViewAllHotels}>
              <Text style={[styles.viewAll, { color: colors.tint }]}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {isLoadingHotels ? (
            <ActivityIndicator size="large" color={colors.tint} />
          ) : popularHotels.length > 0 ? (
            <View style={styles.hotelsContainer}>
              {popularHotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} onPress={() => router.push(`/hotel/${hotel._id}`)} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.tabIconDefault }}>
                Không có khách sạn nào khả dụng
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  userInfoContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subgreeting: {
    fontSize: 16,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreSection: {
    marginBottom: 24,
  },
  exploreCategoriesContainer: {
    paddingHorizontal: 16,
  },
  exploreItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  exploreIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  exploreTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAll: {
    fontSize: 14,
  },
  toursContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  hotelsContainer: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  skeletonCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  skeletonImage: {
    height: 180,
    width: '100%',
  },
  skeletonContent: {
    padding: 16,
  },
  skeletonTitle: {
    height: 20,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
  },
});
