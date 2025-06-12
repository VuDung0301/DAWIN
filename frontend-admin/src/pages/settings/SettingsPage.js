import React, { useState, useEffect } from 'react';
import { FaSave, FaRedo } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { settingsAPI } from '../../services/api';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    system: {
      siteName: '',
      siteDescription: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      logo: '',
      favicon: ''
    },
    booking: {
      paymentMethods: {
        creditCard: true,
        bankTransfer: true,
        paypal: false,
        cash: true
      },
      cancellationPolicy: '',
      refundPolicy: '',
      bookingExpiration: 24, // giờ
      confirmationRequired: true
    },
    email: {
      emailProvider: 'smtp',
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      emailFrom: '',
      emailReplyTo: ''
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      googleAnalyticsId: '',
      sitemap: true
    },
    appearance: {
      primaryColor: '#4f46e5',
      secondaryColor: '#10b981',
      fontFamily: 'Inter, sans-serif',
      darkMode: false
    },
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      linkedin: ''
    }
  });
  
  const [activeTab, setActiveTab] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await settingsAPI.getAll();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải cài đặt:', error);
      setSaveStatus({
        type: 'error',
        message: 'Không thể tải cài đặt. Vui lòng thử lại.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (section, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [field]: value
      }
    }));
    setHasChanges(true);
    setSaveStatus({ type: '', message: '' });
  };
  
  const handleNestedChange = (section, parent, field, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [parent]: {
          ...prevSettings[section][parent],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
    setSaveStatus({ type: '', message: '' });
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus({ type: '', message: '' });
    
    try {
      const response = await settingsAPI.update(settings);
      if (response.success) {
        setSaveStatus({
          type: 'success',
          message: 'Cài đặt đã được lưu thành công!'
        });
        setHasChanges(false);
      } else {
        setSaveStatus({
          type: 'error',
          message: 'Không thể lưu cài đặt. Vui lòng thử lại.'
        });
      }
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt:', error);
      setSaveStatus({
        type: 'error',
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên trang web</label>
          <input
            type="text"
            value={settings.system.siteName}
            onChange={(e) => handleChange('system', 'siteName', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Tên trang web của bạn"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email liên hệ</label>
          <input
            type="email"
            value={settings.system.contactEmail}
            onChange={(e) => handleChange('system', 'contactEmail', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="support@example.com"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ</label>
          <input
            type="text"
            value={settings.system.contactPhone}
            onChange={(e) => handleChange('system', 'contactPhone', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="+84 xxx xxx xxx"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
          <input
            type="text"
            value={settings.system.address}
            onChange={(e) => handleChange('system', 'address', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả trang web</label>
        <textarea
          value={settings.system.siteDescription}
          onChange={(e) => handleChange('system', 'siteDescription', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Mô tả ngắn về trang web của bạn"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo</label>
          <input
            type="text"
            value={settings.system.logo}
            onChange={(e) => handleChange('system', 'logo', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="https://example.com/logo.png"
          />
          {settings.system.logo && (
            <div className="mt-2">
              <img 
                src={settings.system.logo} 
                alt="Logo Preview" 
                className="h-12 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Favicon</label>
          <input
            type="text"
            value={settings.system.favicon}
            onChange={(e) => handleChange('system', 'favicon', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="https://example.com/favicon.ico"
          />
          {settings.system.favicon && (
            <div className="mt-2">
              <img 
                src={settings.system.favicon} 
                alt="Favicon Preview" 
                className="h-8 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderBookingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-medium mb-2">Phương thức thanh toán</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="creditCard"
              checked={settings.booking.paymentMethods.creditCard}
              onChange={(e) => handleNestedChange('booking', 'paymentMethods', 'creditCard', e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="creditCard" className="ml-2 text-sm text-gray-700">Thẻ tín dụng</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="bankTransfer"
              checked={settings.booking.paymentMethods.bankTransfer}
              onChange={(e) => handleNestedChange('booking', 'paymentMethods', 'bankTransfer', e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="bankTransfer" className="ml-2 text-sm text-gray-700">Chuyển khoản ngân hàng</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="paypal"
              checked={settings.booking.paymentMethods.paypal}
              onChange={(e) => handleNestedChange('booking', 'paymentMethods', 'paypal', e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="paypal" className="ml-2 text-sm text-gray-700">PayPal</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="cash"
              checked={settings.booking.paymentMethods.cash}
              onChange={(e) => handleNestedChange('booking', 'paymentMethods', 'cash', e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="cash" className="ml-2 text-sm text-gray-700">Tiền mặt</label>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian hết hạn đặt chỗ (giờ)</label>
        <input
          type="number"
          value={settings.booking.bookingExpiration}
          onChange={(e) => handleChange('booking', 'bookingExpiration', Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md"
          min="1"
          max="72"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="confirmationRequired"
          checked={settings.booking.confirmationRequired}
          onChange={(e) => handleChange('booking', 'confirmationRequired', e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="confirmationRequired" className="ml-2 text-sm text-gray-700">Yêu cầu xác nhận đặt chỗ</label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chính sách hủy đặt chỗ</label>
        <textarea
          value={settings.booking.cancellationPolicy}
          onChange={(e) => handleChange('booking', 'cancellationPolicy', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Mô tả chính sách hủy đặt chỗ"
          rows={4}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chính sách hoàn tiền</label>
        <textarea
          value={settings.booking.refundPolicy}
          onChange={(e) => handleChange('booking', 'refundPolicy', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Mô tả chính sách hoàn tiền"
          rows={4}
        />
      </div>
    </div>
  );
  
  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp Email</label>
        <select
          value={settings.email.emailProvider}
          onChange={(e) => handleChange('email', 'emailProvider', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="smtp">SMTP</option>
          <option value="sendgrid">SendGrid</option>
          <option value="mailchimp">Mailchimp</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
          <input
            type="text"
            value={settings.email.smtpHost}
            onChange={(e) => handleChange('email', 'smtpHost', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="smtp.example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
          <input
            type="text"
            value={settings.email.smtpPort}
            onChange={(e) => handleChange('email', 'smtpPort', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="587"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
          <input
            type="text"
            value={settings.email.smtpUser}
            onChange={(e) => handleChange('email', 'smtpUser', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="username@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
          <input
            type="password"
            value={settings.email.smtpPassword}
            onChange={(e) => handleChange('email', 'smtpPassword', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="••••••••"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email From</label>
          <input
            type="email"
            value={settings.email.emailFrom}
            onChange={(e) => handleChange('email', 'emailFrom', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="no-reply@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Reply To</label>
          <input
            type="email"
            value={settings.email.emailReplyTo}
            onChange={(e) => handleChange('email', 'emailReplyTo', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="support@example.com"
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
        >
          Gửi email thử nghiệm
        </button>
      </div>
    </div>
  );
  
  const renderSeoSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề meta mặc định</label>
        <input
          type="text"
          value={settings.seo.metaTitle}
          onChange={(e) => handleChange('seo', 'metaTitle', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Tiêu đề trang web của bạn"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả meta mặc định</label>
        <textarea
          value={settings.seo.metaDescription}
          onChange={(e) => handleChange('seo', 'metaDescription', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Mô tả ngắn gọn về trang web của bạn"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ID Google Analytics</label>
        <input
          type="text"
          value={settings.seo.googleAnalyticsId}
          onChange={(e) => handleChange('seo', 'googleAnalyticsId', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="UA-XXXXXXXXX-X hoặc G-XXXXXXXXXX"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="sitemap"
          checked={settings.seo.sitemap}
          onChange={(e) => handleChange('seo', 'sitemap', e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="sitemap" className="ml-2 text-sm text-gray-700">Tự động tạo sitemap</label>
      </div>
    </div>
  );
  
  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Màu chính</label>
          <div className="flex items-center">
            <input
              type="color"
              value={settings.appearance.primaryColor}
              onChange={(e) => handleChange('appearance', 'primaryColor', e.target.value)}
              className="w-10 h-10 p-0 border-0"
            />
            <input
              type="text"
              value={settings.appearance.primaryColor}
              onChange={(e) => handleChange('appearance', 'primaryColor', e.target.value)}
              className="ml-2 w-full p-2 border border-gray-300 rounded-md"
              placeholder="#4f46e5"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Màu phụ</label>
          <div className="flex items-center">
            <input
              type="color"
              value={settings.appearance.secondaryColor}
              onChange={(e) => handleChange('appearance', 'secondaryColor', e.target.value)}
              className="w-10 h-10 p-0 border-0"
            />
            <input
              type="text"
              value={settings.appearance.secondaryColor}
              onChange={(e) => handleChange('appearance', 'secondaryColor', e.target.value)}
              className="ml-2 w-full p-2 border border-gray-300 rounded-md"
              placeholder="#10b981"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Font chữ</label>
        <select
          value={settings.appearance.fontFamily}
          onChange={(e) => handleChange('appearance', 'fontFamily', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="Inter, sans-serif">Inter</option>
          <option value="Roboto, sans-serif">Roboto</option>
          <option value="'Open Sans', sans-serif">Open Sans</option>
          <option value="'Montserrat', sans-serif">Montserrat</option>
          <option value="'Raleway', sans-serif">Raleway</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="darkMode"
          checked={settings.appearance.darkMode}
          onChange={(e) => handleChange('appearance', 'darkMode', e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="darkMode" className="ml-2 text-sm text-gray-700">Chế độ tối mặc định</label>
      </div>
      
      <div className="p-4 border border-gray-200 rounded-md">
        <h3 className="font-medium mb-4">Xem trước</h3>
        <div 
          className={`p-4 rounded-lg ${settings.appearance.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
          style={{ fontFamily: settings.appearance.fontFamily }}
        >
          <div style={{ color: settings.appearance.primaryColor }} className="text-lg font-bold mb-2">
            Tiêu đề mẫu
          </div>
          <p className="mb-4">Đây là đoạn văn mẫu để xem trước font chữ và màu sắc của trang web.</p>
          <button
            className="px-4 py-2 rounded-md text-white"
            style={{ backgroundColor: settings.appearance.primaryColor }}
          >
            Nút chính
          </button>
          <button
            className="px-4 py-2 rounded-md text-white ml-2"
            style={{ backgroundColor: settings.appearance.secondaryColor }}
          >
            Nút phụ
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderSocialSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
        <div className="flex items-center">
          <span className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-gray-300 text-gray-500">
            https://facebook.com/
          </span>
          <input
            type="text"
            value={settings.social.facebook}
            onChange={(e) => handleChange('social', 'facebook', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-r-md"
            placeholder="your.page"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
        <div className="flex items-center">
          <span className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-gray-300 text-gray-500">
            https://twitter.com/
          </span>
          <input
            type="text"
            value={settings.social.twitter}
            onChange={(e) => handleChange('social', 'twitter', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-r-md"
            placeholder="username"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
        <div className="flex items-center">
          <span className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-gray-300 text-gray-500">
            https://instagram.com/
          </span>
          <input
            type="text"
            value={settings.social.instagram}
            onChange={(e) => handleChange('social', 'instagram', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-r-md"
            placeholder="username"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
        <div className="flex items-center">
          <span className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-gray-300 text-gray-500">
            https://youtube.com/
          </span>
          <input
            type="text"
            value={settings.social.youtube}
            onChange={(e) => handleChange('social', 'youtube', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-r-md"
            placeholder="channel"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
        <div className="flex items-center">
          <span className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-gray-300 text-gray-500">
            https://linkedin.com/company/
          </span>
          <input
            type="text"
            value={settings.social.linkedin}
            onChange={(e) => handleChange('social', 'linkedin', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-r-md"
            placeholder="company-name"
          />
        </div>
      </div>
    </div>
  );
  
  const tabs = [
    { id: 'system', label: 'Hệ thống', content: renderSystemSettings },
    { id: 'booking', label: 'Đặt chỗ', content: renderBookingSettings },
    { id: 'email', label: 'Email', content: renderEmailSettings },
    { id: 'seo', label: 'SEO', content: renderSeoSettings },
    { id: 'appearance', label: 'Giao diện', content: renderAppearanceSettings },
    { id: 'social', label: 'Mạng xã hội', content: renderSocialSettings }
  ];
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h1>
          <div className="flex space-x-2">
            <button
              onClick={fetchSettings}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition flex items-center"
              disabled={isLoading}
            >
              <FaRedo className="mr-2" /> Làm mới
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center"
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <span className="inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span>
              ) : (
                <FaSave className="mr-2" />
              )}
              Lưu cài đặt
            </button>
          </div>
        </div>
        
        {saveStatus.message && (
          <div className={`p-4 rounded-md ${saveStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {saveStatus.message}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-6">
              {tabs.find(tab => tab.id === activeTab)?.content()}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SettingsPage; 