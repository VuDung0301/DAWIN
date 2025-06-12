import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Hotel } from '../types';
import { Colors } from '../constants/Colors';
import { formatCurrency } from '../utils/formatters';
import { useColorScheme } from '../hooks/useColorScheme';
import { getThumbnailImage } from '../utils/imageUtils';

interface HotelCardProps {
  hotel: Hotel;
  onPress: () => void;
}
const { width } = Dimensions.get('window');

const HotelCard: React.FC<HotelCardProps> = ({ hotel, onPress }) => {
  const colorScheme = useColorScheme() || 'light';
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  // Lấy ảnh đại diện từ coverImage hoặc gallery
  const thumbnailImage = getThumbnailImage(hotel.coverImage, hotel.gallery);

  // Tính toán giá hiển thị (giá khuyến mãi hoặc giá gốc)
  const displayPrice = hotel.priceDiscount || hotel.pricePerNight;
  
  // Tính phần trăm giảm giá nếu có
  const discountPercent = hotel.priceDiscount && hotel.pricePerNight ? 
    Math.round(((hotel.pricePerNight - hotel.priceDiscount) / hotel.pricePerNight) * 100) : 0;
  
  console.log('Hotel image URL:', thumbnailImage); // Logging để debug
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Image 
          source={{ uri: thumbnailImage }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Hiển thị huy hiệu số sao */}
        {hotel.stars && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{hotel.stars} sao</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{hotel.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={theme.warning} />
              <Text style={[styles.rating, { color: theme.text }]}>
                {hotel.ratingsAverage ? hotel.ratingsAverage.toFixed(1) : '4.5'} 
                {hotel.ratingsQuantity ? ` (${hotel.ratingsQuantity})` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color={theme.textSecondary} />
            <Text style={[styles.location, { color: theme.textSecondary }]} numberOfLines={1}>
              {hotel.address}, {hotel.city}
            </Text>
          </View>

          {hotel.amenities && hotel.amenities.length > 0 && (
            <View style={styles.amenitiesRow}>
              <Text style={[styles.amenitiesText, { color: theme.textSecondary }]} numberOfLines={1}>
                {hotel.amenities.slice(0, 3).join(' • ')}
              </Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <Text style={[styles.price, { color: theme.tint }]}>
              {formatCurrency(displayPrice)} <Text style={[styles.night, { color: theme.textSecondary }]}>/đêm</Text>
            </Text>
            {discountPercent > 0 && (
              <View style={[styles.discountBadge, { backgroundColor: theme.success }]}>
                <Text style={styles.discountText}>Giảm {discountPercent}%</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    marginLeft: 4,
    fontSize: 14,
    flex: 1,
  },
  amenitiesRow: {
    marginBottom: 8,
  },
  amenitiesText: {
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  night: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  discountBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HotelCard; 