import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  SafeAreaView,
  Alert,
  Share
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Button } from '@/components/ui/Button';
import { Tour, Review } from '@/types';
import { toursApi, reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const { width } = Dimensions.get('window');

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, token, user } = useAuth();

  const [tour, setTour] = useState<Tour | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [nextStartDate, setNextStartDate] = useState<Date | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchTourData();
  }, [id]);

  useEffect(() => {
    if (!tour || !tour.startDates || tour.startDates.length === 0) return;
    
    const now = new Date();
    const upcomingDates = tour.startDates
      .map(dateStr => new Date(dateStr))
      .filter(date => date > now)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (upcomingDates.length === 0) return;
    
    const nextDate = upcomingDates[0];
    setNextStartDate(nextDate);
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const diff = nextDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(intervalId);
        setCountdown(null);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [tour]);

  useEffect(() => {
    if (isAuthenticated && token && id) {
      checkUserReview();
    }
  }, [isAuthenticated, token, id]);

  const checkUserReview = async () => {
    if (!isAuthenticated || !token || !id) return;
    
    try {
      const response = await reviewsApi.checkUserReviewForTour(id, token);
      
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

  const fetchTourData = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const tourResponse = await toursApi.getById(id);
      if (tourResponse.success && tourResponse.data) {
        setTour(tourResponse.data);
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin tour');
      }

      try {
        const reviewsResponse = await reviewsApi.getTourReviews(id);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data);
        }
      } catch (reviewError) {
        console.error('Lỗi khi tải đánh giá:', reviewError);
        setReviews([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tour:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Chưa đăng nhập',
        'Bạn cần đăng nhập để đặt tour',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Đăng nhập',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return;
    }

    if (tour) {
      router.push({
        pathname: '/booking/tour',
        params: { tourId: tour._id }
      });
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Format ngày tháng
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  // Chia sẻ tour
  const handleShareTour = async () => {
    if (!tour) return;

    try {
      await Share.share({
        message: `Hãy khám phá tour "${tour.name}" cùng tôi!\n\nThời gian: ${tour.duration} ngày\nKhởi hành: ${formatDate(tour.startDates[0])}\nGiá chỉ từ: ${tour.priceDiscount || tour.price} đồng/người\n\nMở ứng dụng Dawin để biết thêm chi tiết!`,
        title: `Tour ${tour.name}`,
      });
    } catch (error) {
      console.error('Lỗi khi chia sẻ:', error);
    }
  };

  const handleCreateReview = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Chưa đăng nhập',
        'Bạn cần đăng nhập để đánh giá tour',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Đăng nhập',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return;
    }

    if (tour) {
      router.push({
        pathname: '/review/create',
        params: { 
          tourId: tour._id,
          tourName: tour.name
        }
      });
    }
  };

  const handleUpdateReview = () => {
    if (!userReview || !tour) return;
    
    router.push({
      pathname: '/review/update',
      params: { 
        reviewId: userReview._id,
        tourName: tour.name
      }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (!tour) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy thông tin tour</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.tint }}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: tour.name,
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleShareTour} style={styles.shareButton}>
              <IconSymbol name="square.and.arrow.up" size={22} color={colors.tint} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: selectedImageIndex === 0 ? tour.coverImage : tour.images[selectedImageIndex - 1] }} 
            style={styles.mainImage} 
            resizeMode="cover"
          />
          
          <TouchableOpacity 
            style={[styles.backButtonAbsolute, { backgroundColor: colors.background + 'CC' }]} 
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.thumbnailsContainer}
            contentContainerStyle={styles.thumbnailsContent}
          >
            <TouchableOpacity 
              onPress={() => setSelectedImageIndex(0)}
              style={[
                styles.thumbnailWrapper, 
                selectedImageIndex === 0 && styles.activeThumbnail
              ]}
            >
              <Image source={{ uri: tour.coverImage }} style={styles.thumbnail} />
            </TouchableOpacity>
            
            {tour.images.map((image, index) => (
              <TouchableOpacity 
                key={`thumb-${index}`}
                onPress={() => setSelectedImageIndex(index + 1)}
                style={[
                  styles.thumbnailWrapper, 
                  selectedImageIndex === index + 1 && styles.activeThumbnail
                ]}
              >
                <Image source={{ uri: image }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tour Info */}
        <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <Text style={[styles.tourName, { color: colors.text }]}>{tour.name}</Text>
            
            {/* Countdown Timer */}
            {countdown && nextStartDate && (
              <View style={[styles.countdownContainer, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.countdownTitle, { color: colors.text }]}>
                  Tour khởi hành sau:
                </Text>
                <View style={styles.countdownTimer}>
                  <View style={styles.countdownItem}>
                    <Text style={[styles.countdownNumber, { color: colors.tint }]}>{countdown.days}</Text>
                    <Text style={[styles.countdownLabel, { color: colors.tabIconDefault }]}>Ngày</Text>
                  </View>
                  <View style={styles.countdownItem}>
                    <Text style={[styles.countdownNumber, { color: colors.tint }]}>{countdown.hours}</Text>
                    <Text style={[styles.countdownLabel, { color: colors.tabIconDefault }]}>Giờ</Text>
                  </View>
                  <View style={styles.countdownItem}>
                    <Text style={[styles.countdownNumber, { color: colors.tint }]}>{countdown.minutes}</Text>
                    <Text style={[styles.countdownLabel, { color: colors.tabIconDefault }]}>Phút</Text>
                  </View>
                  <View style={styles.countdownItem}>
                    <Text style={[styles.countdownNumber, { color: colors.tint }]}>{countdown.seconds}</Text>
                    <Text style={[styles.countdownLabel, { color: colors.tabIconDefault }]}>Giây</Text>
                  </View>
                </View>
                <Text style={[styles.countdownDate, { color: colors.tabIconDefault }]}>
                  {formatDate(nextStartDate.toISOString())}
                </Text>
              </View>
            )}
            
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconSymbol
                    key={`star-${star}`}
                    name="star.fill"
                    size={16}
                    color={star <= Math.round(tour.ratingsAverage) ? '#FFC107' : '#E0E0E0'}
                  />
                ))}
              </View>
              <Text style={[styles.ratingText, { color: colors.tabIconDefault }]}>
                {tour.ratingsAverage.toFixed(1)} ({tour.ratingsQuantity} đánh giá)
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <IconSymbol name="clock" size={18} color={colors.tabIconDefault} />
                <Text style={[styles.infoText, { color: colors.text }]}>{tour.duration} ngày</Text>
              </View>
              
              <View style={styles.infoItem}>
                <IconSymbol name="person.2" size={18} color={colors.tabIconDefault} />
                <Text style={[styles.infoText, { color: colors.text }]}>Tối đa {tour.maxGroupSize} người</Text>
              </View>
              
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(tour.difficulty) }]}>
                <Text style={styles.difficultyText}>{tour.difficulty}</Text>
              </View>
            </View>
          </View>

          {/* Overview Section */}
          <TouchableOpacity 
            style={[styles.sectionHeader, expandedSection === 'overview' && styles.expandedHeader]} 
            onPress={() => toggleSection('overview')}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tổng quan</Text>
            <IconSymbol 
              name={expandedSection === 'overview' ? "chevron.up" : "chevron.down"} 
              size={20} 
              color={colors.tabIconDefault} 
            />
          </TouchableOpacity>
          
          {expandedSection === 'overview' && (
            <View style={styles.sectionContent}>
              <Text style={[styles.descriptionText, { color: colors.text }]}>
                {tour.description}
              </Text>
              
              <View style={styles.startLocations}>
                <View style={styles.locationHeader}>
                  <IconSymbol name="mappin.and.ellipse" size={18} color={colors.tabIconDefault} />
                  <Text style={[styles.locationTitle, { color: colors.text }]}>Điểm khởi hành</Text>
                </View>
                
                <Text style={[styles.locationText, { color: colors.text }]}>
                  {tour.startLocation.description} - {tour.startLocation.address}
                </Text>
              </View>
              
              <View style={styles.datesContainer}>
                <Text style={[styles.datesTitle, { color: colors.text }]}>Ngày khởi hành:</Text>
                <View style={styles.datesList}>
                  {tour.startDates.map((date, index) => (
                    <View key={`date-${index}`} style={[styles.dateItem, { borderColor: colors.border }]}>
                      <Text style={{ color: colors.text }}>{formatDate(date)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Map Section */}
          <TouchableOpacity 
            style={[styles.sectionHeader, expandedSection === 'map' && styles.expandedHeader]} 
            onPress={() => toggleSection('map')}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bản đồ lộ trình</Text>
            <IconSymbol 
              name={expandedSection === 'map' ? "chevron.up" : "chevron.down"} 
              size={20} 
              color={colors.tabIconDefault} 
            />
          </TouchableOpacity>
          
          {expandedSection === 'map' && (
            <View style={styles.sectionContent}>
              <View style={styles.mapContainer}>
                <Text style={[styles.mapText, { color: colors.text }]}>
                  Lộ trình tour bao gồm {tour.locations.length} địa điểm:
                </Text>
                <View style={styles.locationsList}>
                  {tour.locations.map((location, index) => (
                    <View key={`loc-${index}`} style={styles.locationItem}>
                      <View style={[styles.locationNumberBadge, { backgroundColor: colors.tint }]}>
                        <Text style={styles.locationNumber}>{index + 1}</Text>
                      </View>
                      <View style={styles.locationDetail}>
                        <Text style={[styles.locationDescription, { color: colors.text }]}>
                          {location.description}
                        </Text>
                        <Text style={[styles.locationAddress, { color: colors.tabIconDefault }]}>
                          {location.address}
                        </Text>
                        {location.day && (
                          <Text style={[styles.locationDay, { color: colors.tint }]}>
                            Ngày {location.day}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Itinerary Section */}
          <TouchableOpacity 
            style={[styles.sectionHeader, expandedSection === 'itinerary' && styles.expandedHeader]} 
            onPress={() => toggleSection('itinerary')}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Lịch trình</Text>
            <IconSymbol 
              name={expandedSection === 'itinerary' ? "chevron.up" : "chevron.down"} 
              size={20} 
              color={colors.tabIconDefault} 
            />
          </TouchableOpacity>
          
          {expandedSection === 'itinerary' && (
            <View style={styles.sectionContent}>
              {tour.itinerary.map((day) => (
                <View key={`day-${day.day}`} style={styles.dayContainer}>
                  {day.image && (
                    <View style={styles.dayImageContainer}>
                      <Image 
                        source={{ uri: day.image }} 
                        style={styles.dayImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  
                  <View style={styles.dayHeader}>
                    <View style={[styles.dayBadge, { backgroundColor: colors.tint }]}>
                      <Text style={styles.dayNumber}>Ngày {day.day}</Text>
                    </View>
                    <Text style={[styles.dayTitle, { color: colors.text }]}>{day.title}</Text>
                  </View>
                  
                  <Text style={[styles.dayDescription, { color: colors.text }]}>
                    {day.description}
                  </Text>
                  
                  <View style={styles.activitiesContainer}>
                    <Text style={[styles.activitiesTitle, { color: colors.text }]}>Hoạt động:</Text>
                    {day.activities.map((activity, idx) => (
                      <View key={`activity-${day.day}-${idx}`} style={styles.activityItem}>
                        <IconSymbol name="circle.fill" size={8} color={colors.tint} />
                        <Text style={[styles.activityText, { color: colors.text }]}>{activity}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {day.accommodation && (
                  <View style={styles.accommodationContainer}>
                      <Text style={[styles.accommodationTitle, { color: colors.text }]}>Nơi lưu trú:</Text>
                      <Text style={[styles.accommodationText, { color: colors.text }]}>{day.accommodation}</Text>
                  </View>
                  )}
                  
                  <View style={styles.mealsContainer}>
                    <Text style={[styles.mealsTitle, { color: colors.text }]}>Bữa ăn:</Text>
                    <View style={styles.mealsRow}>
                      <View style={[
                        styles.mealBadge, 
                        { backgroundColor: day.meals.breakfast ? colors.tintTransparent : colors.backgroundMuted }
                      ]}>
                        <Text style={[
                          styles.mealText, 
                          { color: day.meals.breakfast ? colors.tint : colors.textMuted }
                        ]}>Sáng</Text>
                      </View>
                      
                      <View style={[
                        styles.mealBadge, 
                        { backgroundColor: day.meals.lunch ? colors.tintTransparent : colors.backgroundMuted }
                      ]}>
                        <Text style={[
                          styles.mealText, 
                          { color: day.meals.lunch ? colors.tint : colors.textMuted }
                        ]}>Trưa</Text>
                      </View>
                      
                      <View style={[
                        styles.mealBadge, 
                        { backgroundColor: day.meals.dinner ? colors.tintTransparent : colors.backgroundMuted }
                      ]}>
                        <Text style={[
                          styles.mealText, 
                          { color: day.meals.dinner ? colors.tint : colors.textMuted }
                        ]}>Tối</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Reviews Section */}
          <TouchableOpacity 
            style={[styles.sectionHeader, expandedSection === 'reviews' && styles.expandedHeader]} 
            onPress={() => toggleSection('reviews')}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Đánh giá ({reviews.length})
            </Text>
            <IconSymbol 
              name={expandedSection === 'reviews' ? "chevron.up" : "chevron.down"} 
              size={20} 
              color={colors.tabIconDefault} 
            />
          </TouchableOpacity>
          
          {expandedSection === 'reviews' && (
            <View style={styles.sectionContent}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <View 
                    key={review._id} 
                    style={[styles.reviewItem, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUser}>
                        <View style={[styles.reviewAvatar, { backgroundColor: colors.tint }]}>
                          <Text style={styles.reviewAvatarText}>
                            {typeof review.user === 'object' 
                              ? review.user.name.charAt(0).toUpperCase() 
                              : 'U'}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.reviewUserName, { color: colors.text }]}>
                            {typeof review.user === 'object' ? review.user.name : 'Người dùng'}
                          </Text>
                          <Text style={[styles.reviewDate, { color: colors.tabIconDefault }]}>
                            {formatDate(review.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reviewRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <IconSymbol
                            key={`review-star-${review._id}-${star}`}
                            name="star.fill"
                            size={14}
                            color={star <= review.rating ? '#FFC107' : '#E0E0E0'}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={[styles.reviewTitle, { color: colors.text }]}>{review.title}</Text>
                    <Text style={[styles.reviewText, { color: colors.text }]}>{review.text}</Text>
                    
                    {isAuthenticated && user && 
                     typeof review.user === 'object' && 
                     review.user._id === user._id && (
                      <TouchableOpacity 
                        style={styles.editReviewButton}
                        onPress={handleUpdateReview}
                      >
                        <Text style={{ color: colors.tint }}>Chỉnh sửa</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyReviews}>
                  <Text style={{ color: colors.tabIconDefault }}>Chưa có đánh giá nào</Text>
                </View>
              )}
              
              {isAuthenticated && (
                hasReviewed ? (
                  <Button 
                    title="Cập nhật đánh giá của bạn" 
                    onPress={handleUpdateReview}
                    variant="outline"
                    style={styles.writeReviewButton}
                  />
                ) : (
                  <Button 
                    title="Viết đánh giá" 
                    onPress={handleCreateReview}
                    variant="outline"
                    style={styles.writeReviewButton}
                  />
                )
              )}
            </View>
          )}

          {/* Includes & Excludes */}
          <TouchableOpacity 
            style={[styles.sectionHeader, expandedSection === 'includes' && styles.expandedHeader]} 
            onPress={() => toggleSection('includes')}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bao gồm & Không bao gồm</Text>
            <IconSymbol 
              name={expandedSection === 'includes' ? "chevron.up" : "chevron.down"} 
              size={20} 
              color={colors.tabIconDefault} 
            />
          </TouchableOpacity>
          
          {expandedSection === 'includes' && (
            <View style={styles.sectionContent}>
              <View style={styles.includesContainer}>
                <Text style={[styles.includesTitle, { color: colors.text }]}>Bao gồm:</Text>
                {tour.includes.map((item, index) => (
                  <View key={`include-${index}`} style={styles.includeItem}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                    <Text style={[styles.includeText, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.excludesContainer}>
                <Text style={[styles.excludesTitle, { color: colors.text }]}>Không bao gồm:</Text>
                {tour.excludes.map((item, index) => (
                  <View key={`exclude-${index}`} style={styles.excludeItem}>
                    <IconSymbol name="xmark.circle.fill" size={18} color={colors.error} />
                    <Text style={[styles.excludeText, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar with Price and Book Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.tabIconDefault }]}>Giá từ</Text>
          {tour.priceDiscount ? (
            <View style={styles.priceWrapper}>
              <Text style={[styles.oldPrice, { color: colors.tabIconDefault }]}>
                {tour.price.toLocaleString('vi-VN')}đ
              </Text>
              <Text style={[styles.price, { color: colors.tint }]}>
                {tour.priceDiscount.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          ) : (
            <Text style={[styles.price, { color: colors.tint }]}>
              {tour.price.toLocaleString('vi-VN')}đ
            </Text>
          )}
          <Text style={[styles.personText, { color: colors.tabIconDefault }]}>/ người</Text>
        </View>
        
        <Button
          title="Đặt ngay"
          onPress={handleBookNow}
          size="medium"
          style={styles.bookButton}
        />
      </View>
    </SafeAreaView>
  );
}

// Hàm lấy màu dựa vào độ khó
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'dễ':
      return '#4CAF50';
    case 'trung bình':
      return '#FF9800';
    case 'khó':
      return '#F44336';
    default:
      return '#4CAF50';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 250,
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  thumbnailsContent: {
    paddingHorizontal: 16,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#FFF',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 20,
  },
  tourName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  expandedHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContent: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  startLocations: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  datesContainer: {
    marginBottom: 16,
  },
  datesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  datesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateItem: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  dayContainer: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  dayNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  activitiesContainer: {
    marginBottom: 12,
  },
  activitiesTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 4,
  },
  activityText: {
    fontSize: 14,
    marginLeft: 8,
  },
  accommodationContainer: {
    marginBottom: 12,
  },
  accommodationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  accommodationText: {
    fontWeight: 'normal',
  },
  mealsContainer: {
    marginBottom: 8,
  },
  mealsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  mealsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  mealText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyReviews: {
    padding: 20,
    alignItems: 'center',
  },
  writeReviewButton: {
    marginTop: 16,
  },
  includesContainer: {
    marginBottom: 16,
  },
  includesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  includeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  excludesContainer: {
    marginBottom: 16,
  },
  excludesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  excludeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  excludeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  personText: {
    fontSize: 12,
  },
  bookButton: {
    width: 120,
  },
  // Map styles
  mapContainer: {
    marginBottom: 16,
  },
  mapText: {
    fontSize: 15,
    marginBottom: 12,
  },
  locationsList: {
    marginTop: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  locationNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  locationNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationDetail: {
    flex: 1,
  },
  locationDescription: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    marginBottom: 4,
  },
  locationDay: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Countdown Timer Styles
  countdownContainer: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  countdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  countdownTimer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  countdownLabel: {
    fontSize: 12,
  },
  countdownDate: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },
  shareButton: {
    padding: 8,
  },
  editReviewButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0366d6',
  },
  dayImageContainer: {
    marginBottom: 10,
  },
  dayImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
}); 