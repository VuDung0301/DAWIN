import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput as RNTextInput,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { hotelsApi } from '@/lib/api';
import { Hotel } from '@/types';
import { fixImageUrl } from '@/utils/imageUtils';

export default function HotelsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [hotels, setHotels] = useState<any[]>([]);
  const [featuredHotels, setFeaturedHotels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tải dữ liệu khi màn hình được hiển thị
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Tải dữ liệu khi thay đổi bộ lọc
  useEffect(() => {
    if (selectedCategory) {
      fetchHotelsByCategory(selectedCategory);
    } else {
      fetchFeaturedHotels();
    }
  }, [selectedCategory]);

  // Hàm tải dữ liệu ban đầu
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFeaturedHotels(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tải khách sạn nổi bật
  const fetchFeaturedHotels = async () => {
    try {
      const response = await hotelsApi.getAll();
      if (response.success && response.data) {
        setFeaturedHotels(response.data);
        setHotels(response.data);
      }
    } catch (error) {
      console.error('Error fetching featured hotels:', error);
    }
  };

  // Tải danh mục khách sạn
  const fetchCategories = async () => {
    try {
      // Nếu API không có sẵn categories, tạo một số category từ dữ liệu khách sạn
      const tempCategories = [
        { name: 'Phổ biến', icon: 'star' },
        { name: '5 sao', icon: 'diamond' },
        { name: '4 sao', icon: 'crown' },
        { name: '3 sao', icon: 'medal' },
      ];
      setCategories(tempCategories);
    } catch (error) {
      console.error('Error fetching hotel categories:', error);
    }
  };

  // Tải khách sạn theo danh mục
  const fetchHotelsByCategory = async (category: string) => {
    setIsLoading(true);
    try {
      // Lọc theo số sao từ dữ liệu đã tải
      let filteredHotels = featuredHotels;
      
      if (category === 'Phổ biến') {
        // Không lọc, hiển thị tất cả
      } else if (category === '5 sao') {
        filteredHotels = featuredHotels.filter(hotel => hotel.stars === 5);
      } else if (category === '4 sao') {
        filteredHotels = featuredHotels.filter(hotel => hotel.stars === 4);
      } else if (category === '3 sao') {
        filteredHotels = featuredHotels.filter(hotel => hotel.stars === 3);
      }
      
      setHotels(filteredHotels);
    } catch (error) {
      console.error(`Error fetching hotels by category ${category}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tìm kiếm khách sạn
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchFeaturedHotels();
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await hotelsApi.searchHotels({ 
        city: searchQuery 
      });
      if (response.success && response.data) {
        setHotels(response.data);
        // Reset các bộ lọc
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Error searching hotels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Làm mới dữ liệu
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
    // Reset các bộ lọc
    setSelectedCategory(null);
    setSearchQuery('');
  };

  // Chọn danh mục
  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  // Mở chi tiết khách sạn
  const handleHotelPress = (hotelId: string) => {
    router.push(`/hotel/${hotelId}`);
  };

  // Render mục danh mục
  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.name && { backgroundColor: colors.tint }
      ]}
      onPress={() => handleCategorySelect(item.name)}
    >
      <Text
        style={[
          styles.categoryName,
          selectedCategory === item.name && { color: 'white' }
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render mục khách sạn
  const renderHotelItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.hotelCard, { backgroundColor: colors.card }]}
      onPress={() => handleHotelPress(item._id)}
    >
      <Image
        source={{ uri: fixImageUrl(item.coverImage) }}
        style={styles.hotelImage}
      />
      
      {/* Hiển thị huy hiệu số sao */}
      {item.stars && (
        <View style={styles.starsBadge}>
          <Text style={styles.starsBadgeText}>{item.stars} sao</Text>
        </View>
      )}
      
      <View style={styles.hotelInfo}>
        <Text style={[styles.hotelName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        
        <View style={styles.locationRow}>
          <IconSymbol name="location" size={14} color={colors.tint} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.address}, {item.city}
          </Text>
        </View>
        
        <View style={styles.ratingRow}>
          <IconSymbol name="star.fill" size={14} color="#FFD700" />
          <Text style={[styles.ratingText, { color: colors.text }]}>
            {item.ratingsAverage || 4.5} 
            <Text style={{ color: colors.textSecondary }}>
              ({item.ratingsQuantity || 0} đánh giá)
            </Text>
          </Text>
        </View>
        
        <View style={styles.priceRow}>
          {item.priceDiscount && (
            <Text style={[styles.oldPrice, { color: colors.textSecondary, textDecorationLine: 'line-through' }]}>
              {item.pricePerNight?.toLocaleString('vi-VN')}đ
            </Text>
          )}
          <Text style={[styles.price, { color: colors.tint }]}>
            {(item.priceDiscount || item.pricePerNight)?.toLocaleString('vi-VN')}đ
          </Text>
          <Text style={[styles.perNight, { color: colors.textSecondary }]}>
            /đêm
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Khách sạn',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Đang tải dữ liệu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Khách sạn',
          headerShown: true,
        }}
      />
      
      <FlatList
        data={hotels}
        renderItem={renderHotelItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Ô tìm kiếm */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
              <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBackground }]}>
                <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
                <RNTextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Tìm kiếm khách sạn..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Danh mục khách sạn */}
            {categories.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Loại khách sạn
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                >
                  {categories.map((category, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category.name && { backgroundColor: colors.tint }
                      ]}
                      onPress={() => handleCategorySelect(category.name)}
                    >
                      <Text
                        style={[
                          styles.categoryName,
                          selectedCategory === category.name && { color: 'white' }
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Tiêu đề danh sách */}
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {selectedCategory
                  ? `Khách sạn ${selectedCategory}`
                  : 'Khách sạn nổi bật'}
              </Text>
              <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                {hotels.length} kết quả
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="bed.double" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Không tìm thấy khách sạn nào
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.tint }]}
              onPress={handleRefresh}
            >
              <Text style={styles.resetButtonText}>Làm mới</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  searchContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
    paddingVertical: 8,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingRight: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsCount: {
    fontSize: 14,
  },
  hotelCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hotelImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  hotelInfo: {
    padding: 12,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
  },
  starsBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  starsBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  perNight: {
    fontSize: 14,
    marginLeft: 4,
  },
  oldPrice: {
    fontSize: 14,
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '500',
  },
}); 