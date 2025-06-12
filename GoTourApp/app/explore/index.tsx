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
  TextInput as RNTextInput,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Tour, Flight } from '@/types';
import { toursApi, flightsApi } from '@/lib/api';
import { TourCard } from '@/components/TourCard';
import { FlightCard } from '@/components/FlightCard';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ search?: string, category?: string }>();
  
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [activeTab, setActiveTab] = useState<'tours' | 'flights'>(
    params.category === 'flight' ? 'flights' : 'tours'
  );
  const [tours, setTours] = useState<Tour[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.search) {
      setSearchQuery(params.search);
      handleSearch(params.search);
    } else {
      fetchData();
    }
  }, [params.search, params.category]);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === 'tours' || !activeTab) {
        const toursResponse = await toursApi.getAll();
        if (toursResponse.success && toursResponse.data) {
          setTours(toursResponse.data);
        } else {
          console.error('Lỗi khi tải dữ liệu tour:', toursResponse.message);
          setTours([]);
        }
      }
      
      if (activeTab === 'flights') {
        const flightsResponse = await flightsApi.getAll();
        if (flightsResponse.success && flightsResponse.data) {
          setFlights(flightsResponse.data);
        } else {
          console.error('Lỗi khi tải dữ liệu chuyến bay:', flightsResponse.message);
          setFlights([]);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) {
      fetchData();
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (activeTab === 'tours' || !activeTab) {
        const toursResponse = await toursApi.searchTours(query);
        if (toursResponse.success && toursResponse.data) {
          setTours(toursResponse.data);
        } else {
          setTours([]);
        }
      }
      
      if (activeTab === 'flights') {
        // Ví dụ tìm kiếm chuyến bay dựa trên thành phố đi/đến
        const flightsResponse = await flightsApi.searchFlights({
          departureCity: query,
          arrivalCity: query
        });
        if (flightsResponse.success && flightsResponse.data) {
          setFlights(flightsResponse.data);
        } else {
          setFlights([]);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const changeTab = (tab: 'tours' | 'flights') => {
    setActiveTab(tab);
    setSearchQuery('');
    fetchData();
  };

  const renderTourItem = ({ item }: { item: Tour }) => (
    <TourCard tour={item} style={styles.tourCard} />
  );

  const renderFlightItem = ({ item }: { item: Flight }) => (
    <FlightCard flight={item} style={styles.flightCard} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Khám phá',
          headerShown: true,
        }}
      />

      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.tabIconDefault} style={styles.searchIcon} />
          <RNTextInput
            placeholder="Tìm kiếm điểm đến, tour, khách sạn..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
            placeholderTextColor={colors.tabIconDefault}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                fetchData();
              }}
            >
              <IconSymbol name="xmark.circle.fill" size={20} color={colors.tabIconDefault} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab để chuyển đổi giữa Tours và Flights */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'tours' && [styles.activeTab, { borderBottomColor: colors.tint }]
          ]}
          onPress={() => changeTab('tours')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'tours' ? colors.tint : colors.tabIconDefault }
            ]}
          >
            Tours
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'flights' && [styles.activeTab, { borderBottomColor: colors.tint }]
          ]}
          onPress={() => changeTab('flights')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'flights' ? colors.tint : colors.tabIconDefault }
            ]}
          >
            Chuyến bay
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hiển thị kết quả tìm kiếm */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <>
          {activeTab === 'tours' ? (
            tours.length > 0 ? (
              <FlatList
                data={tours}
                renderItem={renderTourItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            ) : (
              <View style={styles.emptyContainer}>
                <IconSymbol name="magnifyingglass" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Không có tour nào khả dụng'}
                </Text>
                <TouchableOpacity 
                  style={[styles.refreshButton, { backgroundColor: colors.tint }]}
                  onPress={fetchData}
                >
                  <Text style={styles.refreshButtonText}>Làm mới</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            flights.length > 0 ? (
              <FlatList
                data={flights}
                renderItem={renderFlightItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            ) : (
              <View style={styles.emptyContainer}>
                <IconSymbol name="airplane" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Không có chuyến bay nào khả dụng'}
                </Text>
                <TouchableOpacity 
                  style={[styles.refreshButton, { backgroundColor: colors.tint }]}
                  onPress={fetchData}
                >
                  <Text style={styles.refreshButtonText}>Làm mới</Text>
                </TouchableOpacity>
              </View>
            )
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
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  tourCard: {
    marginBottom: 16,
  },
  flightCard: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 