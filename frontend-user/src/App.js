import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './context/AuthContext';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/auth/ProfilePage';
import ToursPage from './pages/tours/ToursPage';
import TourDetailsPage from './pages/tours/TourDetailsPage';
import HotelsPage from './pages/hotels/HotelsPage';
import HotelDetailsPage from './pages/hotels/HotelDetailsPage';
import FlightsPage from './pages/flights/FlightsPage';
import FlightDetailsPage from './pages/flights/FlightDetailsPage';
import BookingsPage from './pages/bookings/BookingsPage';
import BookingDetailsPage from './pages/bookings/BookingDetailsPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import PaymentPage from './pages/payment/PaymentPage';
import NotFoundPage from './pages/NotFoundPage';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:id" element={<TourDetailsPage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/hotels/:id" element={<HotelDetailsPage />} />
            <Route path="/flights" element={<FlightsPage />} />
            <Route path="/flights/:id" element={<FlightDetailsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/bookings/:id" element={<BookingDetailsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/:type/:id" element={<CheckoutPage />} />
            <Route path="/payment/:paymentId" element={<PaymentPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MainLayout>
      </AuthProvider>
    </Router>
  );
}

export default App;
