import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Alert,
  Linking,
  Share
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import { hotelsApi, reviewsApi } from '@/lib/api';
import MapView, { Marker } from 'react-native-maps';
import { format, parseISO, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import ReviewsList from '@/components/reviews/ReviewsList';
import { fixImageUrl, fixImageUrls } from '@/utils/imageUtils';

export default function HotelDetailScreen() {
  const params = useLocalSearchParams();
  const { id } = params;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = Dimensions.get('window');
  const { isAuthenticated, user, token } = useAuth();
  
  // State
  const [hotel, setHotel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  
  // Thiết lập ngày mặc định cho đặt phòng
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const [bookingDates, setBookingDates] = useState({
    checkIn: format(today, 'yyyy-MM-dd'),
    checkOut: format(tomorrow, 'yyyy-MM-dd'),
    guests: 2
  });
  
  // Tải dữ liệu khách sạn
  useEffect(() => {
    fetchHotelDetails();
  }, [id]);
  
  useEffect(() => {
    if (isAuthenticated && token && id) {
      checkUserReview();
    }
  }, [isAuthenticated, token, id]);
  
  const fetchHotelDetails = async () => {
    setIsLoading(true);
    try {
      const hotelResponse = await hotelsApi.getById(id as string);
      
      if (hotelResponse.success && hotelResponse.data) {
        // Xử lý dữ liệu khách sạn
        const hotelData = hotelResponse.data;
        
        // Đảm bảo có mảng hình ảnh
        if (!hotelData.images) {
          hotelData.images = [];
        }
        
        // Thêm coverImage vào mảng hình ảnh nếu chưa có
        if (hotelData.coverImage && !hotelData.images.includes(hotelData.coverImage)) {
          hotelData.images = [hotelData.coverImage, ...hotelData.images];
        }
        
        // Sửa URL của tất cả hình ảnh
        if (hotelData.coverImage) {
          hotelData.coverImage = fixImageUrl(hotelData.coverImage);
        }
        if (hotelData.images && hotelData.images.length > 0) {
          hotelData.images = fixImageUrls(hotelData.images);
        }
        
        // Thêm amenities mặc định nếu không có
        if (!hotelData.amenities || !Array.isArray(hotelData.amenities) || hotelData.amenities.length === 0) {
          hotelData.amenities = ['Wifi', 'Điều hòa', 'TV', 'Nhà hàng', 'Đậu xe'];
        }
        
        // Log để debug
        console.log("Hotel images:", hotelData.images);
        
        setHotel(hotelData);
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin khách sạn');
      }
      
      try {
        const reviewsResponse = await reviewsApi.getHotelReviews(id as string);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data);
        }
      } catch (reviewError) {
        console.error('Lỗi khi tải đánh giá:', reviewError);
        setReviews([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin khách sạn:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin khách sạn');
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkUserReview = async () => {
    if (!isAuthenticated || !token || !id) return;
    
    try {
      const response = await reviewsApi.checkUserReviewForHotel(id, token);
      
      if (response.success) {
        setHasReviewed(response.hasReviewed);
        if (response.hasReviewed && response.review) {
          setUserReview(response.review);
        }
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra đánh giá của người dùng:', error);
    }
  };
  
  // Xử lý khi đặt phòng
  const handleBookNow = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Thông báo',
        'Vui lòng đăng nhập để đặt phòng',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }
    
    const selectedRoomType = hotel.roomTypes && hotel.roomTypes.length > 0 ? hotel.roomTypes[0] : null;
    
    if (!selectedRoomType) {
      Alert.alert('Thông báo', 'Không có thông tin phòng khả dụng');
      return;
    }
    
    // Chuyển trực tiếp đến trang đặt phòng với thông tin cơ bản của khách sạn
    router.push({
      pathname: '/booking/hotel',
      params: {
        hotelId: hotel._id,
        roomId: selectedRoomType._id,
        roomName: selectedRoomType.name,
        price: selectedRoomType.priceDiscount || selectedRoomType.price || hotel.pricePerNight,
        checkIn: bookingDates.checkIn,
        checkOut: bookingDates.checkOut,
        guests: bookingDates.guests.toString(),
        skipRoomSelection: 'true' // Đánh dấu rằng người dùng đã bỏ qua bước chọn phòng
      }
    });
  };
  
  // Render ảnh khách sạn
  const renderHotelImage = ({ item, index }: { item: string, index: number }) => (
    <Image 
      source={{ uri: item }} 
      style={{ width, height: 250 }}
      resizeMode="cover"
    />
  );
  
  // Render tiện nghi
  const renderFacilityItem = ({ item, index }: { item: string, index: number }) => (
    <View style={styles.facilityItem}>
      <IconSymbol name={getIconForAmenity(item)} size={24} color={colors.tint} />
      <Text style={[styles.facilityName, { color: colors.text }]}>{item}</Text>
    </View>
  );
  
  // Render loại phòng
  const renderRoomType = ({ item }: { item: any }) => (
    <View style={[styles.roomTypeCard, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.roomTypeName, { color: colors.text }]}>{item.name}</Text>
      
      <View style={styles.roomTypeDetail}>
        <IconSymbol name="person.2.fill" size={16} color={colors.textSecondary} />
        <Text style={[styles.roomTypeInfo, { color: colors.textSecondary }]}>
          Tối đa {item.capacity} người
        </Text>
      </View>
      
      {item.amenities && item.amenities.length > 0 && (
        <View style={styles.roomTypeDetail}>
          <IconSymbol name="checkmark.circle" size={16} color={colors.textSecondary} />
          <Text style={[styles.roomTypeInfo, { color: colors.textSecondary }]}>
            {item.amenities.slice(0, 3).join(' • ')}
          </Text>
        </View>
      )}
      
      <View style={styles.roomPriceContainer}>
        <Text style={[styles.roomPrice, { color: colors.tint }]}>
          {item.priceDiscount > 0 ? item.priceDiscount.toLocaleString('vi-VN') : item.price.toLocaleString('vi-VN')}đ
          <Text style={styles.roomPriceUnit}>/đêm</Text>
        </Text>
        
        {item.priceDiscount > 0 && (
          <Text style={[styles.roomOldPrice, { color: colors.textSecondary }]}>
            {item.price.toLocaleString('vi-VN')}đ
          </Text>
        )}
      </View>
    </View>
  );
  
  // Lấy biểu tượng phù hợp cho tiện nghi
  const getIconForAmenity = (amenity: string) => {
    const amenityIcons = {
      'wifi': 'wifi',
      'hồ bơi': 'water.waves',
      'đậu xe': 'car',
      'ăn sáng': 'fork.knife',
      'phòng tập': 'dumbbell',
      'nhà hàng': 'fork.knife',
      'spa': 'drop',
      'điều hòa': 'thermometer',
      'máy lạnh': 'thermometer',
      'minibar': 'wineglass',
      'tv': 'tv',
      'bồn tắm': 'drop.fill',
      'ban công': 'door.left.hand.open',
      'bãi biển': 'beach.umbrella',
      'đưa đón': 'car',
      'dịch vụ phòng': 'person.fill',
      'máy giặt': 'washer'
    };
    
    const lowerCaseAmenity = amenity.toLowerCase();
    
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (lowerCaseAmenity.includes(key)) {
        return icon;
      }
    }
    
    return 'star';  // Biểu tượng mặc định
  };
  
  // Hiển thị giá theo định dạng tiền tệ Việt Nam
  const formatCurrency = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };
  
  // Tính giá hiển thị
  const getDisplayPrice = () => {
    if (!hotel) return '0';
    
    // Lấy giá từ loại phòng đầu tiên nếu có
    if (hotel.roomTypes && hotel.roomTypes.length > 0) {
      const room = hotel.roomTypes[0];
      if (room.priceDiscount) {
        return formatCurrency(room.priceDiscount);
      }
      if (room.price) {
        return formatCurrency(room.price);
      }
    }
    
    if (hotel.priceDiscount) {
      return formatCurrency(hotel.priceDiscount);
    }
    
    return formatCurrency(hotel.pricePerNight);
  };
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải thông tin khách sạn...</Text>
      </View>
    );
  }
  
  if (!hotel) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Không thể tải thông tin khách sạn. Vui lòng thử lại sau.
        </Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerTitle: hotel.name,
          headerBackTitle: 'Quay lại',
        }}
      />
      
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView>
        {/* Hình ảnh khách sạn */}
        <FlatList
          data={hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.coverImage]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderHotelImage}
          keyExtractor={(item, index) => `image_${index}`}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setActiveImageIndex(slideIndex);
          }}
        />
        
        {/* Thanh chỉ báo trang của slideshow */}
        <View style={styles.paginationContainer}>
          {(hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.coverImage]).map((_: any, index: number) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === activeImageIndex ? colors.tint : colors.tabIconDefault,
                  width: index === activeImageIndex ? 12 : 8,
                }
              ]}
            />
          ))}
        </View>
        
        <View style={styles.contentContainer}>
          {/* Thông tin cơ bản */}
          <View style={styles.headerContainer}>
            <Text style={[styles.hotelName, { color: colors.text }]}>{hotel.name}</Text>
            
            {/* Hiển thị số sao */}
            <View style={styles.starsContainer}>
              {Array.from({ length: hotel.stars || 0 }).map((_, index) => (
                <IconSymbol key={index} name="star.fill" size={16} color="#FFD700" />
              ))}
              <Text style={[styles.starsText, { color: colors.textSecondary }]}>
                ({hotel.stars} sao)
              </Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <IconSymbol name="star.fill" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.text }]}>{hotel.ratingsAverage || 4.5}</Text>
              <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
                ({hotel.ratingsQuantity || 0} đánh giá)
              </Text>
            </View>
            
            <View style={styles.locationContainer}>
              <IconSymbol name="location.fill" size={16} color={colors.tint} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {hotel.address}, {hotel.city}
              </Text>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: colors.tint }]}>
              {getDisplayPrice()}
            </Text>
            <Text style={[styles.perNight, { color: colors.textSecondary }]}>/đêm</Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả</Text>
            <Text 
              style={[styles.description, { color: colors.text }]}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {hotel.description || 'Khách sạn sang trọng với đầy đủ tiện nghi, dịch vụ chất lượng cao và vị trí thuận tiện cho du lịch và công tác.'}
            </Text>
            {(hotel.description || '').length > 150 && (
              <TouchableOpacity 
                style={styles.showMoreButton}
                onPress={() => setShowFullDescription(!showFullDescription)}
              >
                <Text style={[styles.showMoreText, { color: colors.tint }]}>
                  {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Loại phòng */}
          {hotel.roomTypes && hotel.roomTypes.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Loại phòng</Text>
              <FlatList
                data={hotel.roomTypes}
                renderItem={renderRoomType}
                keyExtractor={(item) => item._id}
                horizontal={false}
                scrollEnabled={false}
              />
            </View>
          )}
          
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tiện nghi</Text>
            <FlatList
              data={hotel.amenities || []}
              renderItem={renderFacilityItem}
              keyExtractor={(item, index) => `${item}_${index}`}
              numColumns={3}
              scrollEnabled={false}
            />
          </View>
          
          {/* Vị trí */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vị trí</Text>
            <Text style={[styles.locationFullText, { color: colors.text }]}>
              {hotel.address}, {hotel.city}
            </Text>
            {hotel.location && hotel.location.coordinates && hotel.location.coordinates.length === 2 && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: hotel.location.coordinates[1] || 16.047079,
                    longitude: hotel.location.coordinates[0] || 108.219609,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: hotel.location.coordinates[1] || 16.047079,
                      longitude: hotel.location.coordinates[0] || 108.219609,
                    }}
                    title={hotel.name}
                  />
                </MapView>
              </View>
            )}
          </View>
          
          {/* Đánh giá */}
          <View style={styles.sectionContainer}>
            <View style={styles.reviewHeaderContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Đánh giá</Text>
              
              {isAuthenticated && (
                hasReviewed ? (
                  <TouchableOpacity
                    style={[styles.reviewButton, { backgroundColor: colors.cardBackground }]}
                    onPress={() => {
                      if (userReview) {
                        router.push({
                          pathname: '/review/update',
                          params: { 
                            reviewId: userReview._id,
                            hotelName: hotel.name
                          }
                        });
                      }
                    }}
                  >
                    <Text style={[styles.reviewButtonText, { color: colors.tint }]}>
                      Chỉnh sửa đánh giá
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.reviewButton, { backgroundColor: colors.tint }]}
                    onPress={() => {
                      router.push({
                        pathname: '/review/create',
                        params: { 
                          hotelId: hotel._id,
                          hotelName: hotel.name
                        }
                      });
                    }}
                  >
                    <Text style={[styles.reviewButtonText, { color: '#FFFFFF' }]}>
                      Viết đánh giá
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            
            {reviews.length > 0 ? (
              <ReviewsList reviews={reviews} />
            ) : (
              <View style={styles.emptyReviews}>
                <Text style={[styles.emptyReviewsText, { color: colors.textSecondary }]}>
                  Chưa có đánh giá nào cho khách sạn này.
                </Text>
                {isAuthenticated && !hasReviewed && (
                  <TouchableOpacity
                    style={[styles.beFirstReviewButton, { borderColor: colors.tint }]}
                    onPress={() => {
                      router.push({
                        pathname: '/review/create',
                        params: { 
                          hotelId: hotel._id,
                          hotelName: hotel.name
                        }
                      });
                    }}
                  >
                    <Text style={[styles.beFirstReviewText, { color: colors.tint }]}>
                      Hãy là người đánh giá đầu tiên
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          {/* Thông tin khách sạn */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin khách sạn</Text>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Giờ nhận phòng:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {hotel.policies?.checkIn || '14:00'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Giờ trả phòng:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {hotel.policies?.checkOut || '12:00'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Chính sách hủy:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {hotel.policies?.cancellation || 'Miễn phí hủy trước 24 giờ. Sau đó, phí hủy là 100% giá trị đặt phòng.'}
              </Text>
            </View>
          </View>
          
          {/* Thêm một số phần thông tin khác nếu có sẵn */}
          {hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Điểm tham quan lân cận</Text>
              {hotel.nearbyAttractions.map((attraction: any, index: number) => (
                <View key={index} style={styles.attractionItem}>
                  {attraction.image && (
                    <Image source={{ uri: fixImageUrl(attraction.image) }} style={styles.attractionImage} />
                  )}
                  <View style={styles.attractionInfo}>
                    <Text style={[styles.attractionName, { color: colors.text }]}>{attraction.name}</Text>
                    <Text style={[styles.attractionDistance, { color: colors.textSecondary }]}>
                      {attraction.distance || 'Gần đó'}
                    </Text>
                    <Text style={[styles.attractionDescription, { color: colors.text }]}>
                      {attraction.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Thanh đặt phòng cố định ở dưới */}
      <View style={[styles.bookingBar, { borderTopColor: colors.border, backgroundColor: colors.cardBackground }]}>
        <View style={styles.bookingPrice}>
          <Text style={[styles.bookingPriceLabel, { color: colors.textSecondary }]}>Giá từ</Text>
          <Text style={[styles.bookingPriceValue, { color: colors.tint }]}>
            {getDisplayPrice()}
          </Text>
          <Text style={[styles.bookingPerNight, { color: colors.textSecondary }]}>/ đêm</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.bookButton, { backgroundColor: colors.tint }]}
          onPress={handleBookNow}
        >
          <Text style={styles.bookButtonText}>Đặt ngay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  hotelName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsText: {
    marginLeft: 4,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  ratingCount: {
    marginLeft: 4,
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  perNight: {
    fontSize: 14,
    marginLeft: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  showMoreButton: {
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  facilityItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
    width: '33%',
  },
  facilityName: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 140,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  attractionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  attractionImage: {
    width: 80,
    height: 80,
  },
  attractionInfo: {
    flex: 1,
    padding: 10,
  },
  attractionName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attractionDistance: {
    fontSize: 12,
    marginBottom: 4,
  },
  attractionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  bookingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  bookingPrice: {
    flex: 1,
  },
  bookingPriceLabel: {
    fontSize: 12,
  },
  bookingPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingPerNight: {
    fontSize: 12,
  },
  bookButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardBackground: {
    backgroundColor: '#ffffff',
  },
  roomPriceUnit: {
    fontSize: 12,
    fontWeight: '400',
  },
  locationFullText: {
    marginBottom: 16,
  },
  reviewHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyReviews: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyReviewsText: {
    marginRight: 8,
  },
  beFirstReviewButton: {
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  beFirstReviewText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  roomTypeCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  roomTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roomTypeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomTypeInfo: {
    marginLeft: 6,
    fontSize: 14,
  },
  roomPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomOldPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
}); 