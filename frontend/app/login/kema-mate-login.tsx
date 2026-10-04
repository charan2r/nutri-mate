import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth-store';

export function KemaMateLogin({
  onBackToSplash,
}: {
  onBackToSplash?: () => void;
} = {}) {
  const [activeTab, setActiveTab] = useState<'signin' | 'create'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, register, loginAsGuest } = useAuthStore();

  const handleAuth = async () => {
    setErrorMessage(null);

    if (activeTab === 'create' && !fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (activeTab === 'create' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'signin') {
        await login({ email: cleanEmail, password });
      } else {
        await register({ name: fullName.trim(), email: cleanEmail, password });
      }
      Alert.alert(
        'Success',
        activeTab === 'signin'
          ? 'Welcome back to Kema Mate AI!'
          : 'Account created successfully!',
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please try again.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await loginAsGuest();
      Alert.alert('Guest Access', 'Continuing as guest with local preview mode.');
    } catch {
      setErrorMessage('Failed to start guest session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      'Google Sign-In',
      'Google authentication will link with your Sri Lankan Kema Mate AI profile.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Organic Background Pastel Shapes */}
      <View style={styles.bgBlobTopRight} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Combined Hero Section */}
          <View style={styles.heroContainer}>
            <View style={styles.heroLeft}>
              {onBackToSplash && (
                <Pressable
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#e2ece0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                  onPress={onBackToSplash}
                  hitSlop={8}
                >
                  <Ionicons name="arrow-back" size={18} color="#18202a" />
                </Pressable>
              )}
              {/* 1. Kema Mate AI Brand */}
              <View style={styles.brandRow}>
                <View style={styles.brandLogoContainer}>
                  <MaterialCommunityIcons name="leaf" size={24} color="#3E8E34" />
                </View>
                <Text style={styles.brandTitle}>
                  Kema Mate <Text style={styles.brandTitleGreen}>AI</Text>
                </Text>
              </View>

              {/* 2. Welcome Back Title */}
              <View style={styles.titleRow}>
                <Text style={styles.heroTitle}>
                  {activeTab === 'signin' ? 'Welcome back!' : 'Create account'}
                </Text>
                <MaterialCommunityIcons
                  name="sprout"
                  size={19}
                  color="#438E38"
                />
              </View>

              {/* 3. Subtitle */}
              <Text style={styles.heroSubtitle}>
                {activeTab === 'signin'
                  ? 'Sign in to continue your\njourney to better health.'
                  : 'Start making smarter,\nhealthier choices.'}
              </Text>
            </View>

            {/* Right Aligned Salad Bowl Image */}
            <View style={styles.saladImageContainer}>
              <Image
                source={require('@/assets/images/nutrio-salad.png')}
                style={styles.saladImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Auth Switcher Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              onPress={() => {
                setActiveTab('signin');
                setErrorMessage(null);
              }}
              style={styles.tabItem}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'signin' && styles.tabLabelActive,
                ]}
              >
                Sign In
              </Text>
              {activeTab === 'signin' && <View style={styles.tabUnderline} />}
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveTab('create');
                setErrorMessage(null);
              }}
              style={styles.tabItem}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'create' && styles.tabLabelActive,
                ]}
              >
                Create Account
              </Text>
              {activeTab === 'create' && <View style={styles.tabUnderline} />}
            </Pressable>
          </View>

          {/* Error Notification */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Input Fields */}
          <View style={styles.formContainer}>
            {/* Full Name Field  */}
            {activeTab === 'create' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputCard}>
                  <Feather name="user" size={19} color="#438E38" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. John Doe"
                    placeholderTextColor="#8A99AD"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputCard}>
                <Feather name="mail" size={19} color="#438E38" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="youremail@gmail.com"
                  placeholderTextColor="#8A99AD"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  underlineColorAndroid="transparent"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputCard}>
                <Feather name="lock" size={19} color="#438E38" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#8A99AD"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  underlineColorAndroid="transparent"
                />
                <Pressable
                  hitSlop={10}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={19}
                    color="#8A99AD"
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password (Create Account Tab) */}
            {activeTab === 'create' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputCard}>
                  <Feather name="shield" size={19} color="#438E38" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Repeat your password"
                    placeholderTextColor="#8A99AD"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    underlineColorAndroid="transparent"
                  />
                  <Pressable
                    hitSlop={10}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={19}
                      color="#8A99AD"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Forgot Password Link */}
            {activeTab === 'signin' && (
              <Pressable
                style={styles.forgotPassBtn}
                onPress={() =>
                  Alert.alert(
                    'Forgot Password',
                    'Please contact support or enter your registered email to reset your password.',
                  )
                }
              >
                <Text style={styles.forgotPassText}>Forgot password?</Text>
              </Pressable>
            )}

            {/* Primary Action Button */}
            <Pressable
              onPress={handleAuth}
              disabled={isSubmitting}
              style={[
                styles.primaryBtn,
                isSubmitting && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
              <Feather name="arrow-right" size={21} color="#1E3A1A" />
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Continue with Google */}
            <Pressable
              onPress={handleGoogleLogin}
              style={styles.googleBtn}
            >
              <Ionicons name="logo-google" size={19} color="#4285F4" style={{ marginRight: 8 }} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </Pressable>

            {/* Continue as Guest */}
            <Pressable
              onPress={handleGuestLogin}
              style={styles.guestBtn}
            >
              <Feather name="user" size={18} color="#3B8226" style={{ marginRight: 8 }} />
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </Pressable>
          </View>

          {/* Footer Branding */}
          <View style={styles.footerContainer}>
            <View style={styles.footerIconRow}>
              <Text style={styles.footerSparkle}>✦</Text>
              <View style={styles.footerLeafCircle}>
                <MaterialCommunityIcons name="leaf" size={17} color="#2E7D32" />
              </View>
              <Text style={styles.footerSparkleSmall}>✦</Text>
            </View>
            <Text style={styles.footerText}>
              Small steps, smarter choices,{'\n'}healthier tomorrow.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgBlobTopRight: {
    position: 'absolute',
    width: 280,
    height: 240,
    right: -70,
    top: -20,
    borderRadius: 140,
    backgroundColor: '#EDF6E8',
    opacity: 0.75,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    width: 220,
    height: 220,
    left: -70,
    bottom: -60,
    borderRadius: 110,
    backgroundColor: '#EDF6E8',
    opacity: 0.65,
  },
  scrollContent: {
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 28,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  heroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  brandLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#18202A',
    letterSpacing: -0.6,
  },
  brandTitleGreen: {
    color: '#3E8E34',
    fontWeight: '900',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    color: '#18202A',
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#7C8BA0',
    marginTop: 6,
    fontWeight: '400',
  },
  saladImageContainer: {
    width: 144,
    height: 144,
    borderRadius: 72,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  saladImage: {
    width: 144,
    height: 144,
    borderRadius: 72,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F8FAF6',
    borderWidth: 1,
    borderColor: '#E8EFE5',
    paddingHorizontal: 6,
    alignItems: 'center',
    marginBottom: 18,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#8A99AD',
  },
  tabLabelActive: {
    color: '#3B8226',
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 4,
    left: 20,
    right: 20,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#3B8226',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '500',
  },
  formContainer: {
    gap: 13,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#18202A',
    marginLeft: 2,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4ECE2',
  },
  inputIcon: {
    marginRight: 11,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#18202A',
    padding: 0,
    borderWidth: 0,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: 2,
  },
  forgotPassText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2E7D32',
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#CCE7B0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 3,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A1A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6ECE4',
  },
  dividerText: {
    fontSize: 12.5,
    color: '#8A99AD',
    fontWeight: '500',
  },
  googleBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4ECE2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#18202A',
  },
  guestBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E8D2',
    backgroundColor: '#F3F9EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#28552B',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 8,
  },
  footerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  footerLeafCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2F0D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSparkle: {
    color: '#f8d774ff',
    fontSize: 17,
  },
  footerSparkleSmall: {
    color: '#f7d366ff',
    fontSize: 12,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
  },
});

export default KemaMateLogin;
