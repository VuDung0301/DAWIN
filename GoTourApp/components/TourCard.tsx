import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tour } from '@/types';

interface TourCardProps {
  tour: Tour;
  style?: any;
}

const { width } = Dimensions.get('window');
const cardWidth = width * 0.85;

export const TourCard = ({ tour, style }: TourCardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const navigateToDetail = () => {
    router.push(`/tour/${tour._id}`);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground || colors.background },
        style,
      ]}
      activeOpacity={0.8}
      onPress={navigateToDetail}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: tour.coverImage }} style={styles.image} />
        {tour.priceDiscount ? (
          <View style={[styles.discountBadge, { backgroundColor: colors.tint }]}>
            <Text style={styles.discountText}>
              {Math.round(((tour.price - tour.priceDiscount) / tour.price) * 100)}% Giảm
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {tour.name}
        </Text>

        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <IconSymbol
                key={`star-${star}`}
                name="star.fill"
                size={14}
                color={star <= Math.round(tour.ratingsAverage) ? '#FFC107' : '#E0E0E0'}
              />
            ))}
          </View>
          <Text style={[styles.reviewCount, { color: colors.tabIconDefault }]}>
            ({tour.ratingsQuantity} đánh giá)
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <IconSymbol name="clock" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoText, { color: colors.text }]}>{tour.duration} ngày</Text>
          </View>
          
          <View style={styles.infoItem}>
            <IconSymbol name="person.2.fill" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoText, { color: colors.text }]}>Tối đa {tour.maxGroupSize} người</Text>
          </View>
          
          <View style={styles.infoItem}>
            <IconSymbol name="mappin.and.ellipse" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={1}>
              {tour.startLocation?.description || 'Việt Nam'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={[styles.priceLabel, { color: colors.tabIconDefault }]}>Giá từ</Text>
            {tour.priceDiscount ? (
              <View style={styles.priceContainer}>
                <Text style={[styles.originalPrice, { color: colors.tabIconDefault }]}>
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
          </View>
          
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(tour.difficulty) }]}>
            <Text style={styles.difficultyText}>{tour.difficulty}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
    width: cardWidth,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
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
    marginRight: 6,
  },
  reviewCount: {
    fontSize: 12,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
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
}); 