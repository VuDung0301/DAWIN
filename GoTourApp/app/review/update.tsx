import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Button } from '@/components/ui/Button';
import { reviewsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Review } from '@/types';

export default function UpdateReviewScreen() {
  const { reviewId, tourName, hotelName } = useLocalSearchParams<{ 
    reviewId: string, 
    tourName: string,
    hotelName: string
  }>();
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewType, setReviewType] = useState<'tour' | 'hotel' | null>(null);

  useEffect(() => {
    if (reviewId && token) {
      fetchReviewData();
    } else {
      setIsLoading(false);
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đánh giá', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [reviewId, token]);

  const fetchReviewData = async () => {
    try {
      const response = await reviewsApi.getById(reviewId);
      if (response.success && response.data) {
        const reviewData = response.data as Review;
        setRating(reviewData.rating);
        setTitle(reviewData.title);
        setReview(reviewData.text);
        
        // Xác định loại đánh giá (tour hoặc khách sạn)
        if (reviewData.tour) {
          setReviewType('tour');
        } else if (reviewData.hotel) {
          setReviewType('hotel');
        }
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin đánh giá', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đánh giá', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề đánh giá');
      return;
    }

    if (!review.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung đánh giá');
      return;
    }

    if (!token) {
      Alert.alert('Lỗi', 'Bạn cần đăng nhập để cập nhật đánh giá');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await reviewsApi.updateReview(reviewId, {
        rating,
        title: title.trim(),
        text: review.trim(),
        review: review.trim()
      }, token);

      if (response.success) {
        Alert.alert(
          'Thành công', 
          'Đánh giá đã được cập nhật!', 
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể cập nhật đánh giá');
      }
    } catch (error: any) {
      console.error('Lỗi khi cập nhật đánh giá:', error);
      const errorMessage = error?.response?.data?.message || 
                          'Đã xảy ra lỗi khi cập nhật đánh giá. Vui lòng thử lại sau.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: 'Chỉnh sửa đánh giá',
          headerBackTitle: 'Quay lại',
        }}
      />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.itemName, { color: colors.text }]}>
          {tourName || hotelName || 'Chỉnh sửa đánh giá'}
        </Text>
        
        {/* Rating */}
        <Text style={[styles.label, { color: colors.text }]}>Đánh giá của bạn</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={`star-${star}`}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <IconSymbol 
                name="star.fill" 
                size={40} 
                color={star <= rating ? '#FFC107' : colors.border} 
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.ratingText, { color: colors.text }]}>
          {rating} / 5
        </Text>
        
        {/* Title */}
        <Text style={[styles.label, { color: colors.text }]}>Tiêu đề</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              color: colors.text,
              backgroundColor: colors.cardBackground,
              borderColor: colors.border 
            }
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder="Nhập tiêu đề đánh giá"
          placeholderTextColor={colors.tabIconDefault}
          maxLength={100}
        />
        
        {/* Review Content */}
        <Text style={[styles.label, { color: colors.text }]}>Nội dung đánh giá</Text>
        <TextInput
          style={[
            styles.textArea, 
            { 
              color: colors.text,
              backgroundColor: colors.cardBackground,
              borderColor: colors.border 
            }
          ]}
          value={review}
          onChangeText={setReview}
          placeholder={`Chia sẻ trải nghiệm của bạn về ${reviewType === 'tour' ? 'tour' : 'khách sạn'} này...`}
          placeholderTextColor={colors.tabIconDefault}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        
        {/* Submit Button */}
        <Button
          title={isSubmitting ? 'Đang cập nhật...' : 'Cập nhật đánh giá'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitButton}
          icon={isSubmitting ? 
            <ActivityIndicator size="small" color="#FFFFFF" /> : 
            undefined
          }
        />

        {/* Delete Button */}
        <Button
          title="Xóa đánh giá"
          onPress={() => {
            Alert.alert(
              'Xác nhận',
              'Bạn có chắc muốn xóa đánh giá này?',
              [
                {
                  text: 'Hủy',
                  style: 'cancel'
                },
                {
                  text: 'Xóa',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const response = await reviewsApi.deleteReview(reviewId, token!);
                      if (response.success) {
                        Alert.alert('Thành công', 'Đã xóa đánh giá', [
                          { text: 'OK', onPress: () => router.back() }
                        ]);
                      } else {
                        Alert.alert('Lỗi', response.message || 'Không thể xóa đánh giá');
                      }
                    } catch (error: any) {
                      console.error('Lỗi khi xóa đánh giá:', error);
                      Alert.alert('Lỗi', 'Không thể xóa đánh giá. Vui lòng thử lại sau.');
                    }
                  }
                }
              ]
            );
          }}
          style={styles.deleteButton}
          buttonColor="#FF3B30"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 30,
    fontSize: 16,
  },
  submitButton: {
    marginBottom: 15,
  },
  deleteButton: {
    marginBottom: 30,
  },
}); 