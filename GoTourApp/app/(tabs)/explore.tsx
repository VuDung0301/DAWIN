import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Image,
  RefreshControl,
  useWindowDimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TextInput } from '@/components/ui/TextInput';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { toursApi } from '@/lib/api';
import { TourCard } from '@/components/TourCard';
import { Tour } from '@/types';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('featured');  // 'featured', 'category', 'destination'
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'featured' | 'popular' | 'newest' | 'budget'>('featured');
  
  // Thêm state cho tìm kiếm điểm đến
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');
  const [filteredDestinations, setFilteredDestinations] = useState<any[]>([]);
  
  // Data state
  const [categories, setCategories] = useState<any[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<any[]>([]);
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const [popularTours, setPopularTours] = useState<Tour[]>([]);
  const [newestTours, setNewestTours] = useState<Tour[]>([]);
  const [budgetTours, setBudgetTours] = useState<Tour[]>([]);
  const [searchResults, setSearchResults] = useState<Tour[]>([]);
  const [categoryTours, setCategoryTours] = useState<Tour[]>([]);
  const [destinationTours, setDestinationTours] = useState<Tour[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Kiểm tra nếu có route param
  useEffect(() => {
    // Sử dụng tham chiếu trước đó để đảm bảo chỉ chạy khi thực sự có thay đổi
    const handleRouteParams = async () => {
      // Tránh gọi API trùng lặp khi đã đang ở tab/filter đúng
      if (params.category && (!selectedCategory || selectedCategory !== params.category)) {
        handleCategoryPress(params.category as string);
      } else if (params.destination && (!selectedDestination || selectedDestination !== params.destination)) {
        handleDestinationPress(params.destination as string);
      } else if (params.search && (!isSearching || searchQuery !== params.search)) {
        setSearchQuery(params.search as string);
        handleSearch(params.search as string);
      } else if (params.filter && selectedFilter !== params.filter) {
        handleFilterChange(params.filter as any);
      } else if (!params.category && !params.destination && !params.search && !params.filter && 
                activeTab !== 'featured' && selectedFilter === 'featured') {
        // Mặc định, chỉ tải tour nổi bật nếu chưa có dữ liệu
        setActiveTab('featured');
        if (featuredTours.length === 0) {
          await fetchFeaturedTours();
        }
      }
    };

    handleRouteParams();
    // Sử dụng JSON.stringify để chỉ chạy khi params thực sự thay đổi
  }, [JSON.stringify(params)]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    // Chỉ tải dữ liệu ban đầu nếu chưa có
    if (categories.length === 0 && popularDestinations.length === 0) {
      fetchInitialData();
    }
  }, []);

  // Tải dữ liệu ban đầu
  const fetchInitialData = async () => {
    setIsLoading(true);
    
    try {
      // Tải song song nhiều API để giảm thời gian chờ
      const [categoriesResponse, destinationsResponse, featuredResponse] = await Promise.all([
        toursApi.getCategories(),
        toursApi.getPopularDestinations(),
        toursApi.getFeaturedTours({ limit: 10 })
      ]);
      
      // Xử lý danh mục
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }
      
      // Xử lý điểm đến phổ biến
      if (destinationsResponse.success && destinationsResponse.data) {
        setPopularDestinations(destinationsResponse.data);
        setFilteredDestinations(destinationsResponse.data);
      }
      
      // Xử lý tour nổi bật
      if (featuredResponse.success && featuredResponse.data) {
        setFeaturedTours(featuredResponse.data.tours || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy tour nổi bật từ API
  const fetchFeaturedTours = async (page = 1) => {
    // Nếu đã có dữ liệu và đang tải trang 1, không cần tải lại
    if (page === 1 && featuredTours.length > 0 && !refreshing) {
      return true;
    }
    
    if (page === 1) setIsLoading(true);
    
    try {
      const response = await toursApi.getFeaturedTours({ page });
      if (response.success && response.data) {
        if (page === 1) {
          setFeaturedTours(response.data.tours || []);
        } else {
          setFeaturedTours(prev => [...prev, ...(response.data.tours || [])]);
        }
        const { total, limit } = response.data.pagination || { total: 0, limit: 10 };
        setHasMore(page * limit < total);
        return true;
      }
      setHasMore(false);
      return false;
    } catch (error) {
      console.error('Lỗi khi tải tour nổi bật:', error);
      setHasMore(false);
      return false;
    } finally {
      if (page === 1) setIsLoading(false);
    }
  };

  // Lấy tour phổ biến từ API
  const fetchPopularTours = async (page = 1) => {
    // Nếu đã có dữ liệu và đang tải trang 1, không cần tải lại
    if (page === 1 && popularTours.length > 0 && !refreshing) {
      return true;
    }
    
    if (page === 1) setIsLoading(true);
    
    try {
      const response = await toursApi.getPopularTours({ page });
      if (response.success && response.data) {
        if (page === 1) {
          setPopularTours(response.data.tours || []);
        } else {
          setPopularTours(prev => [...prev, ...(response.data.tours || [])]);
        }
        const { total, limit } = response.data.pagination || { total: 0, limit: 10 };
        setHasMore(page * limit < total);
        return true;
      }
      setHasMore(false);
      return false;
    } catch (error) {
      console.error('Lỗi khi tải tour phổ biến:', error);
      setHasMore(false);
      return false;
    } finally {
      if (page === 1) setIsLoading(false);
    }
  };

  // Lấy tour mới nhất từ API
  const fetchNewestTours = async (page = 1) => {
    // Nếu đã có dữ liệu và đang tải trang 1, không cần tải lại
    if (page === 1 && newestTours.length > 0 && !refreshing) {
      return true;
    }
    
    if (page === 1) setIsLoading(true);
    
    try {
      const response = await toursApi.getNewestTours({ page });
      if (response.success && response.data) {
        if (page === 1) {
          setNewestTours(response.data.tours || []);
        } else {
          setNewestTours(prev => [...prev, ...(response.data.tours || [])]);
        }
        const { total, limit } = response.data.pagination || { total: 0, limit: 10 };
        setHasMore(page * limit < total);
        return true;
      }
      setHasMore(false);
      return false;
    } catch (error) {
      console.error('Lỗi khi tải tour mới nhất:', error);
      setHasMore(false);
      return false;
    } finally {
      if (page === 1) setIsLoading(false);
    }
  };

  // Lấy tour giá rẻ từ API
  const fetchBudgetTours = async (page = 1) => {
    // Nếu đã có dữ liệu và đang tải trang 1, không cần tải lại
    if (page === 1 && budgetTours.length > 0 && !refreshing) {
      return true;
    }
    
    if (page === 1) setIsLoading(true);
    
    try {
      const response = await toursApi.getBudgetTours({ page });
      if (response.success && response.data) {
        if (page === 1) {
          setBudgetTours(response.data.tours || []);
        } else {
          setBudgetTours(prev => [...prev, ...(response.data.tours || [])]);
        }
        const { total, limit } = response.data.pagination || { total: 0, limit: 10 };
        setHasMore(page * limit < total);
        return true;
      }
      setHasMore(false);
      return false;
    } catch (error) {
      console.error('Lỗi khi tải tour giá rẻ:', error);
      setHasMore(false);
      return false;
    } finally {
      if (page === 1) setIsLoading(false);
    }
  };

  // Xử lý khi tìm kiếm
  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setIsSearching(true);
    setActiveTab('featured');
    
    try {
      const response = await toursApi.searchTours(query);
      if (response.success && response.data) {
        setSearchResults(response.data.tours || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi chọn danh mục
  const handleCategoryPress = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setActiveTab('category');
    setIsLoading(true);
    
    try {
      const response = await toursApi.getToursByCategory(categoryName);
      if (response.success && response.data) {
        setCategoryTours(response.data.tours || []);
      } else {
        setCategoryTours([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải tour theo danh mục:', error);
      setCategoryTours([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi chọn điểm đến
  const handleDestinationPress = async (destinationName: string) => {
    setSelectedDestination(destinationName);
    setActiveTab('destination');
    setIsLoading(true);
    
    try {
      const response = await toursApi.getToursByDestination(destinationName);
      if (response.success && response.data) {
        setDestinationTours(response.data.tours || []);
      } else {
        setDestinationTours([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải tour theo điểm đến:', error);
      setDestinationTours([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm hàm xử lý khi tìm kiếm điểm đến
  const handleDestinationSearch = (query: string) => {
    setDestinationSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredDestinations(popularDestinations);
      return;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    const filtered = popularDestinations.filter(
      destination => destination.name.toLowerCase().includes(lowerCaseQuery)
    );
    
    setFilteredDestinations(filtered);
  };

  // Xử lý khi thay đổi bộ lọc
  const handleFilterChange = (filter: 'featured' | 'popular' | 'newest' | 'budget') => {
    // Nếu đang chọn cùng bộ lọc, không cần làm gì
    if (selectedFilter === filter) {
      return;
    }

    setSelectedFilter(filter);
    setActiveTab('featured');
    setCurrentPage(1);
    
    switch(filter) {
      case 'featured':
        if (featuredTours.length === 0) {
          fetchFeaturedTours(1);
        }
        break;
      case 'popular':
        if (popularTours.length === 0) {
          fetchPopularTours(1);
        }
        break;
      case 'newest':
        if (newestTours.length === 0) {
          fetchNewestTours(1);
        }
        break;
      case 'budget':
        if (budgetTours.length === 0) {
          fetchBudgetTours(1);
        }
        break;
    }
  };

  // Nạp thêm dữ liệu khi cuộn
  const loadMoreTours = async () => {
    // Nếu đang tải, hoặc không còn dữ liệu, hoặc đang làm mới -> không làm gì
    if (!hasMore || isLoading || refreshing) return;
    
    // Tránh gọi loadMore nhiều lần liên tiếp
    setIsLoading(true);
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    try {
      if (isSearching) {
        // Tải thêm kết quả tìm kiếm
        const response = await toursApi.searchTours(searchQuery, { page: nextPage });
        if (response.success && response.data && response.data.tours) {
          setSearchResults(prev => [...prev, ...response.data.tours]);
          const { total, limit } = response.data.pagination || { total: 0, limit: 10 };
          setHasMore(nextPage * limit < total);
        } else {
          setHasMore(false);
        }
      } else if (activeTab === 'featured') {
        // Tải thêm tour dựa trên bộ lọc hiện tại
        switch(selectedFilter) {
          case 'featured':
            await fetchFeaturedTours(nextPage);
            break;
          case 'popular':
            await fetchPopularTours(nextPage);
            break;
          case 'newest':
            await fetchNewestTours(nextPage);
            break;
          case 'budget':
            await fetchBudgetTours(nextPage);
            break;
        }
      } else if (activeTab === 'category' && selectedCategory) {
        const response = await toursApi.getToursByCategory(selectedCategory, { page: nextPage });
        if (response.success && response.data && response.data.tours) {
          setCategoryTours(prev => [...prev, ...response.data.tours]);
          const { total, limit } = response.data.pagination || { total: 0, limit: 10 };
          setHasMore(nextPage * limit < total);
        } else {
          setHasMore(false);
        }
      } else if (activeTab === 'destination' && selectedDestination) {
        const response = await toursApi.getToursByDestination(selectedDestination, { page: nextPage });
        if (response.success && response.data && response.data.tours) {
          setDestinationTours(prev => [...prev, ...response.data.tours]);
          const { total, limit } = response.data.pagination || { total: 0, limit: 10 };
          setHasMore(nextPage * limit < total);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải thêm dữ liệu:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Làm mới dữ liệu
  const handleRefresh = async () => {
    // Nếu đang tải, không làm mới
    if (isLoading) return;
    
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    
    try {
      if (isSearching) {
        await handleSearch();
      } else if (activeTab === 'featured') {
        switch(selectedFilter) {
          case 'featured':
            await fetchFeaturedTours(1);
            break;
          case 'popular':
            await fetchPopularTours(1);
            break;
          case 'newest':
            await fetchNewestTours(1);
            break;
          case 'budget':
            await fetchBudgetTours(1);
            break;
        }
      } else if (activeTab === 'category' && selectedCategory) {
        await handleCategoryPress(selectedCategory);
      } else if (activeTab === 'destination' && selectedDestination) {
        await handleDestinationPress(selectedDestination);
      }
    } catch (error) {
      console.error('Lỗi khi làm mới dữ liệu:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Reset tìm kiếm
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setActiveTab('featured');
  };

  // Thêm hàm clear tìm kiếm điểm đến
  const clearDestinationSearch = () => {
    setDestinationSearchQuery('');
    setFilteredDestinations(popularDestinations);
    setSelectedDestination(null);
  };

  // Hiển thị tour đúng theo bộ lọc
  const getToursToDisplay = () => {
    if (isSearching) return searchResults;
    
    switch (activeTab) {
      case 'category': return categoryTours;
      case 'destination': return destinationTours;
      case 'featured': {
        switch(selectedFilter) {
          case 'featured': return featuredTours;
          case 'popular': return popularTours;
          case 'newest': return newestTours;
          case 'budget': return budgetTours;
          default: return featuredTours;
        }
      }
      default: return featuredTours;
    }
  };
  
  // Render tour card
  const renderTourItem = ({ item, index }: { item: Tour, index: number }) => (
    <TourCard 
      tour={item} 
      style={viewMode === 'grid' ? { width: width / 2 - 24, margin: 8 } : { width: width - 32, marginBottom: 16 }} 
    />
  );

  // Render danh mục
  const renderCategoryItem = ({ item, index }: { item: any, index: number }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem, 
        { backgroundColor: activeTab === 'category' && selectedCategory === item.name ? item.color : colors.cardBackground }
      ]}
      onPress={() => handleCategoryPress(item.name)}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '20' }]}>
        <IconSymbol name={item.icon} size={24} color={item.color} />
      </View>
      <Text 
        style={[
          styles.categoryName, 
          { 
            color: activeTab === 'category' && selectedCategory === item.name 
              ? 'white' 
              : colors.text 
          }
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render điểm đến phổ biến
  const renderDestinationItem = ({ item, index }: { item: any, index: number }) => (
    <TouchableOpacity 
      style={[
        styles.destinationItem,
        { borderColor: activeTab === 'destination' && selectedDestination === item.name ? item.color : 'transparent' }
      ]}
      onPress={() => handleDestinationPress(item.name)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.destinationImage}
        resizeMode="cover"
      />
      <View style={[styles.destinationOverlay, { backgroundColor: item.color + '80' }]}>
        <Text style={styles.destinationName}>{item.name}</Text>
        {item.tourCount && (
          <Text style={styles.destinationCount}>{item.tourCount} tour</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Tiêu đề hiển thị
  const getScreenTitle = () => {
    if (isSearching) return `Kết quả tìm kiếm: ${searchQuery}`;
    if (activeTab === 'category' && selectedCategory) return `Danh mục: ${selectedCategory}`;
    if (activeTab === 'destination' && selectedDestination) return `Điểm đến: ${selectedDestination}`;
    return 'Khám phá';
  };

  // Thêm hàm tải tất cả tour theo danh mục (không lọc theo danh mục cụ thể)
  const fetchAllCategoryTours = async () => {
    // Nếu đã có dữ liệu và không làm mới, không cần tải lại
    if (categoryTours.length > 0 && !refreshing && !selectedCategory) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await toursApi.getAll();
      if (response.success && response.data) {
        setCategoryTours(response.data.tours || []);
      } else {
        setCategoryTours([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải tour theo danh mục:', error);
      setCategoryTours([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm hàm tải tất cả tour cho điểm đến
  const fetchAllDestinationTours = async () => {
    // Nếu đã có dữ liệu và không làm mới, không cần tải lại
    if (destinationTours.length > 0 && !refreshing && !selectedDestination) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await toursApi.getAll();
      if (response.success && response.data) {
        setDestinationTours(response.data.tours || []);
      } else {
        setDestinationTours([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải tour theo điểm đến:', error);
      setDestinationTours([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật useEffect cho tab
  useEffect(() => {
    // Tải dữ liệu khi chuyển tab
    if (activeTab === 'featured') {
      switch(selectedFilter) {
        case 'featured':
          if (featuredTours.length === 0) {
            fetchFeaturedTours();
          }
          break;
        case 'popular':
          if (popularTours.length === 0) {
            fetchPopularTours();
          }
          break;
        case 'newest':
          if (newestTours.length === 0) {
            fetchNewestTours();
          }
          break;
        case 'budget':
          if (budgetTours.length === 0) {
            fetchBudgetTours();
          }
          break;
      }
    } else if (activeTab === 'category') {
      // Nếu đã chọn danh mục cụ thể trước đó, hiển thị tour của danh mục đó
      if (selectedCategory) {
        handleCategoryPress(selectedCategory);
      } else {
        // Nếu chưa chọn danh mục nào, hiển thị tất cả tour
        fetchAllCategoryTours();
      }
    } else if (activeTab === 'destination') {
      // Nếu đã chọn điểm đến cụ thể, hiển thị tour của điểm đến đó
      if (selectedDestination) {
        handleDestinationPress(selectedDestination);
      } else {
        // Nếu chưa chọn điểm đến nào, hiển thị tất cả tour
        fetchAllDestinationTours();
      }
    }
  }, [activeTab, selectedFilter]);

  // Cập nhật hàm onPress của tab Danh mục
  const handleTabPress = (tab: string) => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    // Nếu chuyển sang tab danh mục và chưa có danh mục nào được chọn, reset
    if (tab === 'category') {
      setSelectedCategory(null);
    } else if (tab === 'destination') {
      setSelectedDestination(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: getScreenTitle(),
          headerShown: true,
        }}
      />
      
      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TextInput
            placeholder="Tìm tour du lịch, điểm đến..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="magnifyingglass"
            style={styles.searchInput}
          />
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.tint }]}
            onPress={() => handleSearch()}
          >
            <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tab lọc và chế độ xem */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollView}>
          <Pressable
            style={[styles.tabButton, activeTab === 'featured' && styles.activeTabButton]}
            onPress={() => setActiveTab('featured')}
          >
            <Text style={[styles.tabText, activeTab === 'featured' && { color: colors.tint }]}>Hạng mục</Text>
          </Pressable>
          
          <Pressable
            style={[styles.tabButton, activeTab === 'category' && styles.activeTabButton]}
            onPress={() => handleTabPress('category')}
          >
            <Text style={[styles.tabText, activeTab === 'category' && { color: colors.tint }]}>Danh mục</Text>
          </Pressable>
          
          <Pressable
            style={[styles.tabButton, activeTab === 'destination' && styles.activeTabButton]}
            onPress={() => handleTabPress('destination')}
          >
            <Text style={[styles.tabText, activeTab === 'destination' && { color: colors.tint }]}>Điểm đến</Text>
          </Pressable>
        </ScrollView>
        
        <View style={styles.viewModeContainer}>
          <TouchableOpacity 
            style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
            onPress={() => setViewMode('grid')}
          >
            <IconSymbol 
              name="square.grid.2x2" 
              size={20} 
              color={viewMode === 'grid' ? colors.tint : colors.tabIconDefault} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
            onPress={() => setViewMode('list')}
          >
            <IconSymbol 
              name="list.bullet" 
              size={20} 
              color={viewMode === 'list' ? colors.tint : colors.tabIconDefault} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải...</Text>
        </View>
      ) : (
        <>
          {isSearching && searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="magnifyingglass" size={64} color={colors.tabIconDefault} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Không tìm thấy tour nào phù hợp với "{searchQuery}"
              </Text>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: colors.tint }]}
                onPress={clearSearch}
              >
                <Text style={styles.resetButtonText}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {activeTab === 'featured' && (
                <View style={styles.filterSection}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                    <TouchableOpacity 
                      style={[
                        styles.filterItem, 
                        { backgroundColor: selectedFilter === 'featured' ? colors.tint : colors.cardBackground }
                      ]}
                      onPress={() => handleFilterChange('featured')}
                    >
                      <Text style={[styles.filterText, { color: selectedFilter === 'featured' ? 'white' : colors.text }]}>
                        Nổi bật
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.filterItem, 
                        { backgroundColor: selectedFilter === 'popular' ? colors.tint : colors.cardBackground }
                      ]}
                      onPress={() => handleFilterChange('popular')}
                    >
                      <Text style={[styles.filterText, { color: selectedFilter === 'popular' ? 'white' : colors.text }]}>
                        Phổ biến nhất
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.filterItem, 
                        { backgroundColor: selectedFilter === 'newest' ? colors.tint : colors.cardBackground }
                      ]}
                      onPress={() => handleFilterChange('newest')}
                    >
                      <Text style={[styles.filterText, { color: selectedFilter === 'newest' ? 'white' : colors.text }]}>
                        Mới nhất
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.filterItem, 
                        { backgroundColor: selectedFilter === 'budget' ? colors.tint : colors.cardBackground }
                      ]}
                      onPress={() => handleFilterChange('budget')}
                    >
                      <Text style={[styles.filterText, { color: selectedFilter === 'budget' ? 'white' : colors.text }]}>
                        Giá tốt
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}
              
              {activeTab === 'category' && (
                <View style={styles.filterSection}>
                  <FlatList
                    data={categories}
                    renderItem={renderCategoryItem}
                    keyExtractor={(item, index) => `category-${item.id || index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                  />
                </View>
              )}
              
              {activeTab === 'destination' && (
                <>
                  {/* Thêm thanh tìm kiếm riêng cho điểm đến */}
                  <View style={styles.destinationSearchContainer}>
                    <View style={[styles.destinationSearchBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                      <TextInput
                        placeholder="Tìm điểm đến..."
                        value={destinationSearchQuery}
                        onChangeText={handleDestinationSearch}
                        icon="magnifyingglass"
                        style={styles.searchInput}
                      />
                      {destinationSearchQuery ? (
                        <TouchableOpacity 
                          style={styles.clearButton}
                          onPress={clearDestinationSearch}
                        >
                          <IconSymbol name="xmark.circle.fill" size={20} color={colors.tabIconDefault} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  
                  <View style={styles.filterSection}>
                    {filteredDestinations.length > 0 ? (
                      <FlatList
                        data={filteredDestinations}
                        renderItem={renderDestinationItem}
                        keyExtractor={(item, index) => `destination_${index}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterList}
                      />
                    ) : (
                      <View style={styles.emptyDestinationContainer}>
                        <Text style={[styles.emptyDestinationText, { color: colors.text }]}>
                          Không tìm thấy điểm đến nào phù hợp
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
              
              <FlatList
                data={getToursToDisplay()}
                renderItem={renderTourItem}
                keyExtractor={(item, index) => `tour-${item._id || index}`}
                key={viewMode} // Để FlatList re-render khi thay đổi viewMode
                numColumns={viewMode === 'grid' ? 2 : 1}
                contentContainerStyle={[
                  styles.tourList,
                  viewMode === 'grid' ? styles.gridList : styles.listView
                ]}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onEndReached={loadMoreTours}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  hasMore && getToursToDisplay().length > 0 ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.tint} />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <IconSymbol name="map" size={64} color={colors.tabIconDefault} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      {selectedDestination 
                        ? `Không có tour nào tại ${selectedDestination}`
                        : 'Không có tour nào phù hợp'
                      }
                    </Text>
                    {selectedDestination && (
                      <TouchableOpacity
                        style={[styles.resetButton, { backgroundColor: colors.tint }]}
                        onPress={clearDestinationSearch}
                      >
                        <Text style={styles.resetButtonText}>Xem tất cả điểm đến</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                }
              />
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  // Thêm style cho tìm kiếm điểm đến
  destinationSearchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  destinationSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 10,
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabScrollView: {
    paddingRight: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 4,
  },
  activeViewMode: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  filterSection: {
    marginVertical: 8,
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginRight: 10,
    borderRadius: 8,
    width: 100,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  destinationItem: {
    width: 120,
    height: 80,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  destinationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  destinationCount: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  // Thêm style cho hiển thị trống điểm đến
  emptyDestinationContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyDestinationText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  tourList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listView: {
    paddingHorizontal: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
