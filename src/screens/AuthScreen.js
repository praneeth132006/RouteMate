import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp, resetPassword, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!showForgotPassword) {
      // Password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      // Sign up specific validations
      if (!isLogin) {
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (showForgotPassword) {
      // Handle forgot password
      const result = await resetPassword(formData.email.trim());
      if (result.success) {
        Alert.alert(
          'Email Sent',
          'Check your email for password reset instructions.',
          [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } else if (isLogin) {
      // Handle login
      const result = await signIn(formData.email.trim(), formData.password);
      if (!result.success) {
        Alert.alert('Sign In Failed', result.error);
      }
    } else {
      // Handle sign up
      const result = await signUp(formData.email.trim(), formData.password, formData.name.trim());
      if (!result.success) {
        Alert.alert('Sign Up Failed', result.error);
      }
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setShowForgotPassword(false);
    setErrors({});
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const renderInput = (field, placeholder, icon, options = {}) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputIconBg}>
        <View>{icon}</View>
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={formData[field]}
        onChangeText={(text) => {
          setFormData({ ...formData, [field]: text });
          if (errors[field]) setErrors({ ...errors, [field]: null });
        }}
        autoCapitalize={options.autoCapitalize || 'none'}
        keyboardType={options.keyboardType || 'default'}
        secureTextEntry={options.secureTextEntry && !showPassword}
        editable={!loading}
      />
      {options.secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="route" size={50} color={colors.primary} />
            </View>
            <Text style={styles.appName}>RouteMate</Text>
            <Text style={styles.tagline}>Your journey begins here</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {showForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back!' : 'Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {showForgotPassword
                ? 'Enter your email to receive reset instructions'
                : isLogin
                  ? 'Sign in to continue your adventures'
                  : 'Start planning your dream trips'}
            </Text>

            {/* Name Input (Sign Up only) */}
            {!isLogin && !showForgotPassword && (
              <View style={styles.inputWrapper}>
                {renderInput('name', 'Full Name', <Icon name="user" size={18} color={colors.primary} />, { autoCapitalize: 'words' })}
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              {renderInput('email', 'Email Address', <Icon name="email" size={18} color={colors.primary} />, { keyboardType: 'email-address' })}
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            {!showForgotPassword && (
              <View style={styles.inputWrapper}>
                {renderInput('password', 'Password', <Icon name="password" size={18} color={colors.primary} />, { secureTextEntry: true })}
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
            )}

            {/* Confirm Password (Sign Up only) */}
            {!isLogin && !showForgotPassword && (
              <View style={styles.inputWrapper}>
                {renderInput('confirmPassword', 'Confirm Password', <Icon name="password" size={18} color={colors.primary} />, { secureTextEntry: true })}
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
            )}

            {/* Forgot Password Link */}
            {isLogin && !showForgotPassword && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => setShowForgotPassword(true)}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {showForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Login (from Forgot Password) */}
            {showForgotPassword && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text style={styles.backButtonText}>← Back to Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Switch Mode */}
          {!showForgotPassword && (
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={switchMode}>
                <Text style={styles.switchButton}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Terms */}
          {!isLogin && !showForgotPassword && (
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.textMuted,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 4,
  },
  inputIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  inputIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
    paddingHorizontal: 8,
    outlineStyle: 'none',
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.bg,
    fontSize: 17,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  switchButton: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
