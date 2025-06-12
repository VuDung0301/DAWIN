export const isEmail = (email: string): boolean => {
  // Kiểm tra email hợp lệ
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isPhone = (phone: string): boolean => {
  // Kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
  const phoneRegex = /^(0)[0-9]{9}$/;
  return phoneRegex.test(phone);
};

export const isRequired = (value: string | null | undefined): boolean => {
  if (value === null || value === undefined) return false;
  return value.trim().length > 0;
};

export const isNumber = (value: string): boolean => {
  // Kiểm tra chuỗi là số
  return /^\d+$/.test(value);
};

export const isPositiveNumber = (value: string): boolean => {
  // Kiểm tra chuỗi là số dương
  return isNumber(value) && parseInt(value) > 0;
};

export const isValidName = (name: string): boolean => {
  // Kiểm tra tên hợp lệ (chỉ chứa chữ cái, khoảng trắng, và dấu gạch ngang)
  const nameRegex = /^[\p{L}\s-]+$/u;
  return nameRegex.test(name);
};

export const isDate = (value: string): boolean => {
  // Kiểm tra chuỗi là ngày hợp lệ
  const date = new Date(value);
  return !isNaN(date.getTime());
};

export const isFutureDate = (value: string): boolean => {
  // Kiểm tra ngày trong tương lai
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(date.getTime()) && date >= today;
};

export const validateBookingForm = (data: any) => {
  const errors: Record<string, string> = {};

  // Kiểm tra tên
  if (!isRequired(data.name)) {
    errors.name = 'Vui lòng nhập họ tên';
  } else if (!isValidName(data.name)) {
    errors.name = 'Họ tên không hợp lệ';
  }

  // Kiểm tra email
  if (!isRequired(data.email)) {
    errors.email = 'Vui lòng nhập email';
  } else if (!isEmail(data.email)) {
    errors.email = 'Email không hợp lệ';
  }

  // Kiểm tra số điện thoại
  if (!isRequired(data.phone)) {
    errors.phone = 'Vui lòng nhập số điện thoại';
  } else if (!isPhone(data.phone)) {
    errors.phone = 'Số điện thoại không hợp lệ';
  }

  // Kiểm tra ngày
  if (data.date === null) {
    errors.date = 'Vui lòng chọn ngày';
  }

  // Kiểm tra số lượng
  if (data.guests !== undefined) {
    if (isNaN(data.guests) || data.guests < 1) {
      errors.guests = 'Số lượng không hợp lệ';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateTourBooking = (data: any) => {
  const baseValidation = validateBookingForm(data);
  const errors = { ...baseValidation.errors };

  // Kiểm tra thêm các trường đặc thù cho tour
  if (!data.startDate) {
    errors.startDate = 'Vui lòng chọn ngày khởi hành';
  }

  if (!isPositiveNumber(data.numOfPeople?.toString() || '')) {
    errors.numOfPeople = 'Vui lòng nhập số người hợp lệ';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateHotelBooking = (data: any) => {
  const baseValidation = validateBookingForm(data);
  const errors = { ...baseValidation.errors };

  // Kiểm tra thêm các trường đặc thù cho khách sạn
  if (!data.checkInDate) {
    errors.checkInDate = 'Vui lòng chọn ngày nhận phòng';
  }

  if (!data.checkOutDate) {
    errors.checkOutDate = 'Vui lòng chọn ngày trả phòng';
  } else if (data.checkInDate && new Date(data.checkOutDate) <= new Date(data.checkInDate)) {
    errors.checkOutDate = 'Ngày trả phòng phải sau ngày nhận phòng';
  }

  if (!data.roomType) {
    errors.roomType = 'Vui lòng chọn loại phòng';
  }

  if (!isPositiveNumber(data.guests?.toString() || '')) {
    errors.guests = 'Vui lòng nhập số khách hợp lệ';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateFlightBooking = (data: any) => {
  const baseValidation = validateBookingForm(data);
  const errors = { ...baseValidation.errors };

  // Kiểm tra thêm các trường đặc thù cho vé máy bay
  if (!data.seatClass) {
    errors.seatClass = 'Vui lòng chọn hạng ghế';
  }

  // Kiểm tra thông tin hành khách
  if (!data.passengers || data.passengers.length === 0) {
    errors.passengers = 'Vui lòng nhập thông tin hành khách';
  } else {
    const passengerErrors: Record<string, any>[] = [];
    let hasPassengerError = false;

    data.passengers.forEach((passenger: any, index: number) => {
      const passengerError: Record<string, string> = {};

      if (!isRequired(passenger.name)) {
        passengerError.name = 'Vui lòng nhập họ tên';
        hasPassengerError = true;
      }

      if (!isRequired(passenger.type)) {
        passengerError.type = 'Vui lòng chọn loại hành khách';
        hasPassengerError = true;
      }

      passengerErrors[index] = passengerError;
    });

    if (hasPassengerError) {
      errors.passengerDetails = passengerErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 