import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Flight } from '@/types';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface FlightCardProps {
  flight: Flight;
  style?: any;
}

export const FlightCard = ({ flight, style }: FlightCardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const navigateToDetail = () => {
    router.push(`/flight/${flight._id}`);
  };

  // Tính thời gian bay định dạng hh:mm
  const durationFormatted = () => {
    const hours = Math.floor(flight.duration / 60);
    const minutes = flight.duration % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  };

  // Format ngày giờ
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: vi });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  // Lấy màu theo trạng thái chuyến bay
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đúng giờ':
        return '#4CAF50';
      case 'Trễ':
        return '#FF9800';
      case 'Hủy':
        return '#F44336';
      case 'Đã bay':
        return '#2196F3';
      default:
        return '#4CAF50';
    }
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
      <View style={styles.header}>
        <View style={styles.airlineContainer}>
          <Image
            source={{ uri: flight.image }}
            style={styles.airlineLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.airlineName, { color: colors.text }]}>{flight.airline}</Text>
            <Text style={[styles.flightNumber, { color: colors.tabIconDefault }]}>
              {flight.flightNumber}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(flight.status) },
          ]}
        >
          <Text style={styles.statusText}>{flight.status}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationContainer}>
          <Text style={[styles.time, { color: colors.text }]}>
            {formatDateTime(flight.departureTime)}
          </Text>
          <Text style={[styles.city, { color: colors.text }]}>{flight.departureCity}</Text>
          <Text style={[styles.date, { color: colors.tabIconDefault }]}>
            {formatDate(flight.departureTime)}
          </Text>
        </View>

        <View style={styles.durationContainer}>
          <Text style={[styles.duration, { color: colors.tabIconDefault }]}>
            {durationFormatted()}
          </Text>
          <View style={styles.flightPathContainer}>
            <View style={[styles.dot, { backgroundColor: colors.tint }]} />
            <View style={[styles.line, { backgroundColor: colors.tabIconDefault }]} />
            <View style={[styles.dot, { backgroundColor: colors.tint }]} />
          </View>
          <IconSymbol name="airplane" size={16} color={colors.tabIconDefault} />
        </View>

        <View style={styles.locationContainer}>
          <Text style={[styles.time, { color: colors.text }]}>
            {formatDateTime(flight.arrivalTime)}
          </Text>
          <Text style={[styles.city, { color: colors.text }]}>{flight.arrivalCity}</Text>
          <Text style={[styles.date, { color: colors.tabIconDefault }]}>
            {formatDate(flight.arrivalTime)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.featuresContainer}>
          {flight.features.wifi && (
            <View style={styles.featureItem}>
              <IconSymbol name="wifi" size={14} color={colors.tabIconDefault} />
              <Text style={[styles.featureText, { color: colors.tabIconDefault }]}>WiFi</Text>
            </View>
          )}
          {flight.features.meals && (
            <View style={styles.featureItem}>
              <IconSymbol name="fork.knife" size={14} color={colors.tabIconDefault} />
              <Text style={[styles.featureText, { color: colors.tabIconDefault }]}>Bữa ăn</Text>
            </View>
          )}
          {flight.features.entertainment && (
            <View style={styles.featureItem}>
              <IconSymbol name="tv" size={14} color={colors.tabIconDefault} />
              <Text style={[styles.featureText, { color: colors.tabIconDefault }]}>Giải trí</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.tabIconDefault }]}>Giá từ</Text>
          <Text style={[styles.price, { color: colors.tint }]}>
            {flight.price.economy.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  airlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airlineLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 20,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  flightNumber: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    alignItems: 'center',
    flex: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  durationContainer: {
    alignItems: 'center',
    flex: 1,
  },
  duration: {
    fontSize: 12,
    marginBottom: 4,
  },
  flightPathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: 80,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    flex: 1,
    height: 1,
    marginHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 12,
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 