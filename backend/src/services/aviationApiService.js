const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const AVIATION_API_KEY = process.env.AVIATION_API_KEY || 'bc626ca6af318e251395bab8d76196ac';
const AVIATION_API_BASE_URL = 'https://api.aviationstack.com/v1';

/**
 * Service tích hợp với Aviationstack API
 */
class AviationApiService {
  constructor() {
    this.apiKey = AVIATION_API_KEY;
    this.axios = axios.create({
      baseURL: AVIATION_API_BASE_URL,
      params: {
        access_key: this.apiKey
      }
    });
    this.useMockData = true; // Sử dụng mock data khi API không khả dụng
  }

  /**
   * Lấy danh sách chuyến bay theo các tham số lọc
   * @param {Object} params - Tham số lọc (dep_iata, arr_iata, flight_date, v.v.)
   * @returns {Promise<Object>} Dữ liệu chuyến bay từ API
   */
  async getFlights(params = {}) {
    try {
      const response = await this.axios.get('/flights', {
        params: {
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu chuyến bay:', error.message);
      throw new Error('Không thể lấy dữ liệu chuyến bay từ Aviationstack API');
    }
  }

  /**
   * Lấy thông tin chi tiết một chuyến bay
   * @param {string} flightIata - Mã IATA của chuyến bay (vd: VN123)
   * @param {string} flightDate - Ngày của chuyến bay (YYYY-MM-DD)
   * @returns {Promise<Object>} Thông tin chi tiết chuyến bay
   */
  async getFlightDetails(flightIata, flightDate) {
    try {
      // Log thông tin để debug
      console.log(`[aviationApiService] Đang tìm chuyến bay: ${flightIata}, Ngày: ${flightDate}`);
      
      // Kiểm tra định dạng tham số đầu vào
      if (!flightIata || !flightDate || 
          !/^[A-Z0-9]{2,}[0-9]{1,4}$/.test(flightIata) || 
          !/^\d{4}-\d{2}-\d{2}$/.test(flightDate)) {
        console.error(`[aviationApiService] Định dạng tham số không hợp lệ. Flight: ${flightIata}, Date: ${flightDate}`);
        throw new Error('Định dạng tham số không hợp lệ');
      }
      
      // Nếu cấu hình sử dụng mock data, trả về ngay mock data
      if (this.useMockData) {
        console.log(`[aviationApiService] Sử dụng mock data cho chuyến bay ${flightIata}`);
        return this._getMockFlightData(flightIata, flightDate);
      }
      
      const response = await this.axios.get('/flights', {
        params: {
          flight_iata: flightIata,
          flight_date: flightDate
        }
      });
      
      // Kiểm tra nếu có kết quả
      if (response.data && response.data.data && response.data.data.length > 0) {
        console.log(`[aviationApiService] Tìm thấy thông tin chuyến bay ${flightIata}`);
        return response.data.data[0];
      }
      
      console.log(`[aviationApiService] Không tìm thấy thông tin chuyến bay ${flightIata}`);
      
      // Sử dụng mock data khi không tìm thấy kết quả
      return this._getMockFlightData(flightIata, flightDate);
      
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết chuyến bay:', error.message);
      
      if (error.response) {
        console.error('API response error:', error.response.status, error.response.data);
        
        // Kiểm tra nếu là lỗi 403 (quyền truy cập)
        if (error.response.status === 403) {
          console.log(`[aviationApiService] Lỗi quyền truy cập API, sử dụng mock data cho chuyến bay ${flightIata}`);
          return this._getMockFlightData(flightIata, flightDate);
        }
      }
      
      // Ném lỗi cho các trường hợp khác
      throw error;
    }
  }
  
  /**
   * Tạo dữ liệu mẫu cho chuyến bay khi API không trả về kết quả
   * @param {string} flightIata - Mã IATA của chuyến bay
   * @param {string} flightDate - Ngày bay (YYYY-MM-DD)
   * @returns {Object} Dữ liệu mẫu của chuyến bay
   * @private
   */
  _getMockFlightData(flightIata, flightDate) {
    // Tạo ngẫu nhiên giờ khởi hành và thời gian bay
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const flightDuration = 60 + Math.floor(Math.random() * 120); // 1-3 giờ
    
    // Tạo thời gian khởi hành và đến
    const departureTime = new Date(`${flightDate}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
    const arrivalTime = new Date(departureTime.getTime() + flightDuration * 60000);
    
    // Xác định nếu là chuyến bay nội địa hoặc quốc tế
    const isDomestic = /^VN|VJ|QH|BL/.test(flightIata);
    
    // Các sân bay phổ biến ở Việt Nam
    const domesticAirports = [
      { name: "Nội Bài International Airport", iata: "HAN", icao: "VVNB", city: "Hà Nội" },
      { name: "Tan Son Nhat International Airport", iata: "SGN", icao: "VVTS", city: "Hồ Chí Minh" },
      { name: "Da Nang International Airport", iata: "DAD", icao: "VVDN", city: "Đà Nẵng" },
      { name: "Phu Quoc International Airport", iata: "PQC", icao: "VVPQ", city: "Phú Quốc" },
      { name: "Cam Ranh International Airport", iata: "CXR", icao: "VVCR", city: "Nha Trang" }
    ];
    
    // Các sân bay quốc tế phổ biến
    const internationalAirports = [
      { name: "Incheon International Airport", iata: "ICN", icao: "RKSI", city: "Seoul" },
      { name: "Changi Airport", iata: "SIN", icao: "WSSS", city: "Singapore" },
      { name: "Narita International Airport", iata: "NRT", icao: "RJAA", city: "Tokyo" },
      { name: "Suvarnabhumi Airport", iata: "BKK", icao: "VTBS", city: "Bangkok" },
      { name: "Hong Kong International Airport", iata: "HKG", icao: "VHHH", city: "Hong Kong" }
    ];
    
    // Chọn sân bay khởi hành và đến
    let departureAirport, arrivalAirport;
    
    if (isDomestic) {
      // Nếu là chuyến bay nội địa, chọn 2 sân bay Việt Nam khác nhau
      departureAirport = domesticAirports[0]; // Mặc định Hà Nội
      arrivalAirport = domesticAirports[2];   // Mặc định Đà Nẵng
      
      // Xử lý theo mã chuyến bay
      if (flightIata.substring(0, 2) === "VN") {
        if (flightIata.includes("1")) {
          departureAirport = domesticAirports[0]; // HAN
          arrivalAirport = domesticAirports[1];   // SGN
        } else if (flightIata.includes("2")) {
          departureAirport = domesticAirports[1]; // SGN
          arrivalAirport = domesticAirports[0];   // HAN
        }
      }
    } else {
      // Nếu là chuyến bay quốc tế, chọn 1 sân bay VN và 1 sân bay quốc tế
      departureAirport = domesticAirports[1];   // SGN
      arrivalAirport = internationalAirports[0]; // ICN
      
      // Lựa chọn dựa trên mã chuyến bay
      if (/^KE|OZ|KA/.test(flightIata)) {
        if (parseInt(flightIata.substring(2)) % 2 === 0) {
          departureAirport = internationalAirports[0]; // ICN
          arrivalAirport = domesticAirports[1];       // SGN
        }
      }
    }
    
    // Tạo mock data
    const mockData = {
      flight_date: flightDate,
      flight_status: "scheduled",
      departure: {
        airport: departureAirport.name,
        timezone: "Asia/Ho_Chi_Minh",
        iata: departureAirport.iata,
        icao: departureAirport.icao,
        terminal: isDomestic ? "T1" : "International",
        gate: `G${Math.floor(Math.random() * 20) + 1}`,
        delay: null,
        scheduled: departureTime.toISOString(),
        estimated: departureTime.toISOString(),
        actual: null,
        city: departureAirport.city
      },
      arrival: {
        airport: arrivalAirport.name,
        timezone: isDomestic ? "Asia/Ho_Chi_Minh" : "Asia/Seoul",
        iata: arrivalAirport.iata,
        icao: arrivalAirport.icao,
        terminal: "Main",
        gate: `G${Math.floor(Math.random() * 20) + 1}`,
        baggage: `B${Math.floor(Math.random() * 10) + 1}`,
        delay: null,
        scheduled: arrivalTime.toISOString(),
        estimated: arrivalTime.toISOString(),
        actual: null,
        city: arrivalAirport.city
      },
      airline: {
        name: /^VN/.test(flightIata) ? "Vietnam Airlines" : 
              /^VJ/.test(flightIata) ? "VietJet Air" : 
              /^QH/.test(flightIata) ? "Bamboo Airways" : 
              /^BL/.test(flightIata) ? "Pacific Airlines" : 
              /^KE/.test(flightIata) ? "Korean Air" :
              /^OZ/.test(flightIata) ? "Asiana Airlines" :
              /^TG/.test(flightIata) ? "Thai Airways" :
              /^SQ/.test(flightIata) ? "Singapore Airlines" : "Hãng bay quốc tế",
        iata: flightIata.substring(0, 2),
        icao: flightIata.substring(0, 2) === "VN" ? "HVN" : 
              flightIata.substring(0, 2) === "VJ" ? "VJC" : 
              flightIata.substring(0, 2) === "QH" ? "BAV" : 
              flightIata.substring(0, 2) === "BL" ? "PIC" : 
              flightIata.substring(0, 2) === "KE" ? "KAL" :
              flightIata.substring(0, 2) === "OZ" ? "AAR" :
              flightIata.substring(0, 2) === "TG" ? "THA" :
              flightIata.substring(0, 2) === "SQ" ? "SIA" : "INT"
      },
      flight: {
        number: flightIata.substring(2),
        iata: flightIata,
        icao: `${
          flightIata.substring(0, 2) === "VN" ? "HVN" : 
          flightIata.substring(0, 2) === "VJ" ? "VJC" : 
          flightIata.substring(0, 2) === "QH" ? "BAV" : 
          flightIata.substring(0, 2) === "BL" ? "PIC" : 
          flightIata.substring(0, 2) === "KE" ? "KAL" :
          flightIata.substring(0, 2) === "OZ" ? "AAR" :
          flightIata.substring(0, 2) === "TG" ? "THA" :
          flightIata.substring(0, 2) === "SQ" ? "SIA" : "INT"
        }${flightIata.substring(2)}`,
        codeshared: null
      },
      aircraft: {
        registration: `VN-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        iata: isDomestic ? "320" : "787",
        icao: isDomestic ? "A320" : "B787",
        model: isDomestic ? "Airbus A320" : "Boeing 787-9"
      },
      live: null,
      // Thêm thông tin giá và ghế trống - dữ liệu tùy chỉnh
      price: {
        economy: isDomestic ? 
          (1200000 + Math.floor(Math.random() * 800000)) : // 1.2-2M VND cho nội địa
          (5000000 + Math.floor(Math.random() * 3000000)), // 5-8M VND cho quốc tế
        business: isDomestic ?
          (3500000 + Math.floor(Math.random() * 1500000)) : // 3.5-5M VND cho nội địa
          (15000000 + Math.floor(Math.random() * 5000000)), // 15-20M VND cho quốc tế
        firstClass: isDomestic ?
          (8000000 + Math.floor(Math.random() * 2000000)) : // 8-10M VND cho nội địa
          (30000000 + Math.floor(Math.random() * 10000000)) // 30-40M VND cho quốc tế
      },
      seatsAvailable: {
        economy: 30 + Math.floor(Math.random() * 70), // 30-100 ghế
        business: 5 + Math.floor(Math.random() * 15), // 5-20 ghế
        firstClass: isDomestic ? 0 : (0 + Math.floor(Math.random() * 5)) // 0-5 ghế (chỉ có ở chuyến quốc tế)
      },
      features: {
        wifi: !isDomestic || Math.random() > 0.5,
        meals: true,
        entertainment: !isDomestic || Math.random() > 0.3,
        powerOutlets: !isDomestic || Math.random() > 0.4,
        usb: !isDomestic || Math.random() > 0.2
      },
      duration: {
        hours: Math.floor(flightDuration / 60),
        minutes: flightDuration % 60
      }
    };
    
    return mockData;
  }

  /**
   * Lấy danh sách sân bay
   * @param {Object} params - Tham số tìm kiếm (search, limit, offset)
   * @returns {Promise<Object>} Dữ liệu sân bay
   */
  async getAirports(params = {}) {
    try {
      const response = await this.axios.get('/airports', {
        params: {
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu sân bay:', error.message);
      throw new Error('Không thể lấy dữ liệu sân bay từ Aviationstack API');
    }
  }

  /**
   * Lấy danh sách hãng hàng không
   * @param {Object} params - Tham số tìm kiếm (search, limit, offset)
   * @returns {Promise<Object>} Dữ liệu hãng hàng không
   */
  async getAirlines(params = {}) {
    try {
      const response = await this.axios.get('/airlines', {
        params: {
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu hãng hàng không:', error.message);
      throw new Error('Không thể lấy dữ liệu hãng hàng không từ Aviationstack API');
    }
  }

  /**
   * Lấy lịch trình chuyến bay
   * @param {string} iataCode - Mã IATA của sân bay
   * @param {string} type - Loại chuyến bay (departure hoặc arrival)
   * @param {Object} params - Tham số bổ sung
   * @returns {Promise<Object>} Dữ liệu lịch trình
   */
  async getFlightSchedules(iataCode, type, params = {}) {
    try {
      const response = await this.axios.get('/timetable', {
        params: {
          iataCode,
          type,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy lịch trình chuyến bay:', error.message);
      throw new Error('Không thể lấy lịch trình chuyến bay từ Aviationstack API');
    }
  }

  /**
   * Lấy dữ liệu chuyến bay trong tương lai
   * @param {string} iataCode - Mã IATA của sân bay
   * @param {string} type - Loại chuyến bay (departure hoặc arrival)
   * @param {string} date - Ngày cần tìm kiếm (YYYY-MM-DD)
   * @param {Object} params - Tham số bổ sung
   * @returns {Promise<Object>} Dữ liệu chuyến bay tương lai
   */
  async getFutureFlights(iataCode, type, date, params = {}) {
    try {
      const response = await this.axios.get('/flightsFuture', {
        params: {
          iataCode,
          type,
          date,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu chuyến bay tương lai:', error.message);
      throw new Error('Không thể lấy dữ liệu chuyến bay tương lai từ Aviationstack API');
    }
  }

  /**
   * Tìm kiếm chuyến bay theo các tiêu chí
   * @param {string} departureIata - Mã IATA sân bay khởi hành
   * @param {string} arrivalIata - Mã IATA sân bay đến
   * @param {string} departureDate - Ngày khởi hành (YYYY-MM-DD)
   * @returns {Promise<Array>} Danh sách chuyến bay phù hợp
   */
  async searchFlights(departureIata, arrivalIata, departureDate) {
    try {
      const response = await this.axios.get('/flights', {
        params: {
          dep_iata: departureIata,
          arr_iata: arrivalIata,
          flight_date: departureDate
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Lỗi khi tìm kiếm chuyến bay:', error.message);
      throw new Error('Không thể tìm kiếm chuyến bay từ Aviationstack API');
    }
  }
}

module.exports = new AviationApiService(); 