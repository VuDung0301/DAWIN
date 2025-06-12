import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (phone.trim() && !/^[0-9]{10}$/.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số)';
    }

    if (!password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData = {
        name,
        email,
        password,
        phone: phone || undefined,
      };

      const result = await register(userData);
      if (result.success) {
        Alert.alert(
          'Đăng ký thành công', 
          'Tài khoản của bạn đã được tạo thành công! Vui lòng đăng nhập để tiếp tục.', 
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(auth)/login');
              },
            },
          ]
        );
      } else {
        if (result.message && result.message.toLowerCase().includes('email already exists')) {
          Alert.alert('Email đã tồn tại', 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.');
        } else if (result.message && result.message.toLowerCase().includes('duplicate')) {
          Alert.alert('Email đã tồn tại', 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.');
        } else {
          Alert.alert('Đăng ký thất bại', result.message || 'Vui lòng kiểm tra lại thông tin đăng ký');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Đăng ký',
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Tạo tài khoản mới</Text>
            <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
              Đăng ký để khám phá và đặt tour du lịch dễ dàng
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Họ tên */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Họ và tên</Text>
              <View style={[
                styles.inputWrapper,
                {
                  borderColor: errors.name ? colors.error : colors.border,
                  backgroundColor: colors.cardBackground,
                }
              ]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.tabIconDefault}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nhập họ và tên của bạn"
                  placeholderTextColor={colors.tabIconDefault}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      setErrors({ ...errors, name: '' });
                    }
                  }}
                />
              </View>
              {errors.name ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <View style={[
                styles.inputWrapper,
                {
                  borderColor: errors.email ? colors.error : colors.border,
                  backgroundColor: colors.cardBackground,
                }
              ]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.tabIconDefault}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor={colors.tabIconDefault}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Số điện thoại */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Số điện thoại (tùy chọn)</Text>
              <View style={[
                styles.inputWrapper,
                {
                  borderColor: errors.phone ? colors.error : colors.border,
                  backgroundColor: colors.cardBackground,
                }
              ]}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.tabIconDefault}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nhập số điện thoại của bạn"
                  placeholderTextColor={colors.tabIconDefault}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) {
                      setErrors({ ...errors, phone: '' });
                    }
                  }}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.phone}</Text>
              ) : null}
            </View>

            {/* Mật khẩu */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mật khẩu</Text>
              <View style={[
                styles.inputWrapper,
                {
                  borderColor: errors.password ? colors.error : colors.border,
                  backgroundColor: colors.cardBackground,
                }
              ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.tabIconDefault}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor={colors.tabIconDefault}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.tabIconDefault}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Xác nhận mật khẩu</Text>
              <View style={[
                styles.inputWrapper,
                {
                  borderColor: errors.confirmPassword ? colors.error : colors.border,
                  backgroundColor: colors.cardBackground,
                }
              ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.tabIconDefault}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nhập lại mật khẩu của bạn"
                  placeholderTextColor={colors.tabIconDefault}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.tabIconDefault}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: colors.tint, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.registerButtonText}>Đang xử lý...</Text>
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.tabIconDefault }]}>
                Đã có tài khoản?
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={[styles.loginLink, { color: colors.tint }]}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
  },
  inputIcon: {
    marginLeft: 14,
    marginRight: 8,
  },
  passwordToggle: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
}); 