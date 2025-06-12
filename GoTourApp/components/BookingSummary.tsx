import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';

interface BookingSummaryProps {
  type: 'hotel' | 'tour' | 'flight';
  data: any;
  onEdit?: () => void;
}

/**
 * Component hiển thị thông tin tóm tắt đặt chỗ
 */
export const BookingSummary: React.FC<BookingSummaryProps> = ({ 
  type, 
  data, 
  onEdit
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  const formatPrice = (price: number) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Hiển thị tóm tắt cho đặt phòng khách sạn
  const renderHotelSummary = () => {
    if (!data || !data.hotel) return null;
    const { hotel, roomType, checkIn, checkOut, guests, roomCount, totalPrice } = data;
    
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.tint }]}>
          <Text style={styles.headerText}>Chi tiết đặt phòng</Text>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={[styles.content, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Khách sạn:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{hotel.name}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Loại phòng:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{roomType || 'Phòng tiêu chuẩn'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Số phòng:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{roomCount || 1}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Ngày nhận phòng:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatDate(checkIn)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Ngày trả phòng:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatDate(checkOut)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Số khách:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {guests?.adults || 2} người lớn{guests?.children > 0 ? `, ${guests.children} trẻ em` : ''}
            </Text>
          </View>
          
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Tổng tiền:</Text>
            <Text style={[styles.totalValue, { color: colors.tint }]}>{formatPrice(totalPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Hiển thị tóm tắt cho đặt tour
  const renderTourSummary = () => {
    if (!data || !data.tour) return null;
    
    // Trích xuất dữ liệu từ các trường có thể có nhiều tên khác nhau
    const tourName = typeof data.tour === 'object' ? data.tour.name : 'Không có thông tin';
    const startDate = data.startDate || '';
    
    // Trích xuất số ngày từ tên tour nếu không có trường duration
    const tourDuration = (() => {
      if (data.tour && typeof data.tour === 'object' && data.tour.duration) {
        return data.tour.duration;
      }
      
      // Thử lấy số ngày từ tên tour (ví dụ: "Tour xyz 3n2đ")
      if (typeof tourName === 'string') {
        const match = tourName.match(/(\d+)n\d+đ/i);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
      }
      
      return 'N/A';
    })();
    
    // Trích xuất số người từ numOfPeople hoặc participants
    const numberOfPeople = data.numOfPeople || data.participants || 1;
    
    // Trích xuất tổng tiền từ nhiều trường có thể có
    const totalPrice = data.totalPrice || data.price || 
      (data.tour && typeof data.tour === 'object' ? data.tour.price || data.tour.priceDiscount : 0);
    
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.tint }]}>
          <Text style={styles.headerText}>Chi tiết đặt tour</Text>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={[styles.content, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Tour:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{tourName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Ngày khởi hành:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatDate(startDate)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Số ngày:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{tourDuration} ngày</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Số người:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{numberOfPeople} người</Text>
          </View>
          
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Tổng tiền:</Text>
            <Text style={[styles.totalValue, { color: colors.tint }]}>{formatPrice(totalPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Hiển thị tóm tắt cho đặt vé máy bay
  const renderFlightSummary = () => {
    if (!data || !data.flight) return null;
    const { flight, passengers, class: seatClass, totalPrice } = data;
    
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.tint }]}>
          <Text style={styles.headerText}>Chi tiết đặt vé</Text>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={[styles.content, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Chuyến bay:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{flight.flightNumber || flight.flight?.iata || ''}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Hãng hàng không:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {typeof flight.airline === 'object' && flight.airline ? 
                (flight.airline.name || 'Không xác định') : 
                (typeof flight.airline === 'string' ? flight.airline : 'Không xác định')}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Hành trình:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {flight.departureCity || flight.departure?.airport || ''} → {flight.arrivalCity || flight.arrival?.airport || ''}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Ngày bay:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {formatDate(flight.departureTime || flight.departure?.scheduled || flight.flight_date || '')}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Hạng ghế:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {seatClass === 'economy' ? 'Phổ thông' : 
               seatClass === 'business' ? 'Thương gia' : 'Hạng nhất'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>Số hành khách:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {Array.isArray(passengers) ? passengers.length : passengers || 1} người
            </Text>
          </View>
          
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Tổng tiền:</Text>
            <Text style={[styles.totalValue, { color: colors.tint }]}>{formatPrice(totalPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Hiển thị tóm tắt tương ứng với loại đặt chỗ
  switch (type) {
    case 'hotel':
      return renderHotelSummary();
    case 'tour':
      return renderTourSummary();
    case 'flight':
      return renderFlightSummary();
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 