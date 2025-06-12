// Định nghĩa các types cho User
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'guide' | 'admin';
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa types cho Tour
export interface Tour {
  _id: string;
  name: string;
  slug: string;
  description: string;
  duration: number;
  maxGroupSize: number;
  difficulty: 'dễ' | 'trung bình' | 'khó';
  price: number;
  priceDiscount?: number;
  coverImage: string;
  images: string[];
  startDates: string[];
  ratingsAverage: number;
  ratingsQuantity: number;
  includes: string[];
  excludes: string[];
  itinerary: TourItinerary[];
  locations: TourLocation[];
  startLocation: TourLocation;
  active: boolean;
}

export interface TourItinerary {
  _id: string;
  day: number;
  title: string;
  description: string;
  activities?: string[];
  accommodation?: string;
  meals?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  image?: string;
}

export interface TourLocation {
  _id?: string;
  type: string;
  coordinates: number[];
  description: string;
  day?: number;
  address?: string;
}

// Định nghĩa types cho Flight
export interface Flight {
  _id: string;
  flightNumber: string;
  airline: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  price: {
    economy: number;
    business: number;
    firstClass: number;
  };
  seatsAvailable: {
    economy: number;
    business: number;
    firstClass: number;
  };
  duration: number;
  status: 'Đúng giờ' | 'Trễ' | 'Hủy' | 'Đã bay';
  features: {
    wifi: boolean;
    meals: boolean;
    entertainment: boolean;
    powerOutlets: boolean;
    usb: boolean;
  };
  image: string;
  active: boolean;
}

export interface FlightPassenger {
  type: 'adult' | 'child' | 'infant';
  title: 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Mstr';
  firstName: string;
  lastName: string;
  dob: string;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
}

// Định nghĩa types cho Hotel
export interface Hotel {
  _id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  category: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  discount?: number;
  amenities?: string[];
  rooms?: HotelRoom[];
  latitude?: number;
  longitude?: number;
  checkInTime?: string;
  checkOutTime?: string;
  policies?: string[];
}

export interface HotelRoom {
  _id: string;
  name: string;
  description: string;
  pricePerNight: number;
  discount?: number;
  capacity: number;
  amenities: string[];
  images: string[];
  available: boolean;
}

// Định nghĩa types cho Booking
export interface BookingBase {
  _id: string;
  user: string | User;
  bookingNumber?: string;
  bookingReference?: string;
  bookingDate: string;
  totalPrice: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  paymentId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  contactInfo: {
    fullName?: string;
    name?: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa types cho TourBooking
export interface TourBooking extends BookingBase {
  tour: string | Tour;
  startDate: string;
  numOfPeople: number;
}

// Định nghĩa types cho HotelBooking
export interface HotelBooking extends BookingBase {
  hotel: string | Hotel;
  room: string | HotelRoom;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
}

// Định nghĩa cho SeatSelection
export interface SeatSelection {
  passenger: number; // Index trong mảng passengers
  seatNumber: string;
}

// Định nghĩa cho BaggageOption
export interface BaggageOption {
  passenger: number; // Index trong mảng passengers
  checkedBaggage: number; // Trọng lượng (kg)
  cabinBaggage: number; // Trọng lượng (kg)
}

// Định nghĩa cho MealPreference
export interface MealPreference {
  passenger: number;
  mealType: 'regular' | 'vegetarian' | 'vegan' | 'kosher' | 'halal' | 'diabetic' | 'gluten-free' | 'none';
}

// Cập nhật types cho FlightBooking
export interface FlightBooking extends BookingBase {
  flight: string | Flight;
  passengers: FlightPassenger[];
  bookingReference: string;
  seatSelections?: SeatSelection[];
  baggageOptions?: BaggageOption[];
  mealPreferences?: MealPreference[];
  checkInStatus?: boolean;
  boardingPass?: {
    issuedAt: string;
    document: string;
  };
  currency?: string;
  cancellationReason?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
}

// Định nghĩa types cho Passenger
export interface Passenger {
  _id?: string;
  name: string;
  type: 'adult' | 'child' | 'infant';
  passport?: string;
  nationality?: string;
  dob?: string;
}

// Định nghĩa types cho Review
export interface Review {
  _id: string;
  title: string;
  text: string;
  rating: number;
  tour?: string | Tour;
  hotel?: string | Hotel;
  user: string | User;
  createdAt: string;
}

// Định nghĩa types cho các loại thanh toán
export type PaymentType = 'cash' | 'bank_transfer' | 'credit_card' | 'momo' | 'zalopay' | 'vnpay';

export interface Payment {
  _id: string;
  booking: string;
  amount: number;
  method: PaymentType;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentDate: string;
  paymentDetails?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface HotelFilter {
  category?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  amenities?: string[];
}

export interface HotelCategory {
  name: string;
  title: string;
  icon: string;
  description: string;
}

export interface HotelCity {
  city: string;
  count: number;
  rating: number;
  image: string;
} 