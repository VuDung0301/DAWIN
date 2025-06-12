import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { IconSymbol } from '../ui/IconSymbol';

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  text: string;
  createdAt: string;
}

interface ReviewsListProps {
  reviews: Review[];
}

const ReviewsList = ({ reviews }: ReviewsListProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const renderReviewItem = ({ item }: { item: Review }) => {
    const date = new Date(item.createdAt);
    const formattedDate = format(date, 'dd/MM/yyyy', { locale: vi });

    return (
      <View style={[styles.reviewItem, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            {item.user?.avatar ? (
              <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatarPlaceholder, { backgroundColor: colors.tint }]}>
                <Text style={styles.userAvatarText}>
                  {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <Text style={[styles.userName, { color: colors.text }]}>{item.user?.name || 'Ẩn danh'}</Text>
          </View>

          <View style={styles.ratingContainer}>
            <Text style={[styles.ratingValue, { color: colors.text }]}>{item.rating}</Text>
            <IconSymbol name="star.fill" size={14} color="#FFC107" />
          </View>
        </View>

        <Text style={[styles.reviewTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.reviewText, { color: colors.text }]}>{item.text}</Text>
        
        <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
          {formattedDate}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={reviews}
      renderItem={renderReviewItem}
      keyExtractor={(item) => item._id}
      scrollEnabled={false}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Chưa có đánh giá nào.
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 8,
  },
  reviewItem: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  userAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: '500',
    fontSize: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingValue: {
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 14,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewDate: {
    fontSize: 12,
    textAlign: 'right',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

export default ReviewsList; 