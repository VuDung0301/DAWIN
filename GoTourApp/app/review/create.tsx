import React, { useState } from 'react';
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

export default function CreateReviewScreen() {
  const { tourId, tourName, hotelId, hotelName } = useLocalSearchParams<{ 
    tourId: string, 
    tourName: string,
    hotelId: string,
    hotelName: string
  }>();
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      Alert.alert('Lỗi', 'Bạn cần đăng nhập để đánh giá');
      return;
    }
    
    if (!tourId && !hotelId) {
      Alert.alert('Lỗi', 'Không có thông tin tour hoặc khách sạn để đánh giá');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        rating,
        title: title.trim(),
        text: review.trim(),
        review: review.trim()
      };
      
      // Thêm thông tin tour hoặc khách sạn vào dữ liệu đánh giá
      if (tourId) {
        Object.assign(reviewData, { tour: tourId });
      } else if (hotelId) {
        Object.assign(reviewData, { hotel: hotelId });
      }
      
      console.log('Dữ liệu đánh giá gửi đi:', JSON.stringify(reviewData));
      
      const response = await reviewsApi.create(reviewData, token);

      if (response.success) {
        Alert.alert(
          'Thành công', 
          'Cảm ơn bạn đã đánh giá!', 
          [
            { 
              text: 'OK', 
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tạo đánh giá');
      }
    } catch (error: any) {
      console.error('Lỗi khi tạo đánh giá:', error);
      const errorMessage = error?.response?.data?.message || 
                          'Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: 'Viết đánh giá',
          headerBackTitle: 'Quay lại',
        }}
      />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.itemName, { color: colors.text }]}>
          {tourName || hotelName || 'Đánh giá'}
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
          placeholder={`Chia sẻ trải nghiệm của bạn về ${tourName ? 'tour' : 'khách sạn'} này...`}
          placeholderTextColor={colors.tabIconDefault}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        
        {/* Submit Button */}
        <Button
          title={isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitButton}
          icon={isSubmitting ? 
            <ActivityIndicator size="small" color="#FFFFFF" /> : 
            undefined
          }
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
    marginBottom: 30,
  },
}); 