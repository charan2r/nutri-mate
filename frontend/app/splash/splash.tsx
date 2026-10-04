import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function KemaMateSplash({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted?: () => void;
  onSignIn?: () => void;
} = {}) {
  const router = useRouter();
  const { height } = useWindowDimensions();

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push('/login/kema-mate-login' as any);
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      router.push('/login/kema-mate-login' as any);
    }
  };

  // Adjust hero image size based on screen height
  const heroImageHeight = height < 700 ? 220 : height < 820 ? 270 : 310;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Background Soft Organic Blobs */}
      <View style={styles.bgBlobTopLeft} pointerEvents="none" />
      <View style={styles.bgBlobTopRight} pointerEvents="none" />
      <View style={styles.bgBlobCenter} pointerEvents="none" />
      <View style={styles.bgBlobBottom} pointerEvents="none" />

      {/* Top Floating Leaves Accents */}
      <View style={styles.floatingLeafTopRight} pointerEvents="none">
        <MaterialCommunityIcons name="leaf" size={42} color="#9ecb98" style={{ opacity: 0.75, transform: [{ rotate: '45deg' }] }} />
      </View>
      <View style={styles.floatingLeafMiddleLeft} pointerEvents="none">
        <MaterialCommunityIcons name="leaf" size={32} color="#b3dcb0" style={{ opacity: 0.6, transform: [{ rotate: '-35deg' }] }} />
      </View>
      <View style={styles.floatingLeafBottomRight} pointerEvents="none">
        <MaterialCommunityIcons name="leaf" size={36} color="#a6d4a2" style={{ opacity: 0.65, transform: [{ rotate: '120deg' }] }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Logo & Branding */}
        <View style={styles.brandContainer}>
          {/* Logo Mark */}
          <View style={styles.logoMarkWrapper}>
            <View style={styles.logoMarkCircle}>
              <View style={styles.logoDot} />
              <View style={styles.logoLeavesRow}>
                <MaterialCommunityIcons
                  name="leaf"
                  size={24}
                  color="#2ea457"
                  
                />
               
              </View>
              
            </View>
          </View>

          {/* Brand Title: Kema Mate AI */}
          <View style={styles.titleRow}>
            <Text style={styles.brandTitleText}>Kema Mate</Text>
            <Text style={styles.brandAiText}> AI</Text>
          </View>

          {/* Tagline */}
          <View style={styles.taglineRow}>
            <MaterialCommunityIcons
              name="leaf"
              size={13}
              color="#499a57"
              style={{ transform: [{ rotate: '-25deg' }] }}
            />
            <Text style={styles.taglineText}>Eat smart. Live well.</Text>
            <MaterialCommunityIcons
              name="leaf"
              size={13}
              color="#499a57"
              style={{ transform: [{ rotate: '-25deg' }] }}
            />
          </View>
        </View>

        {/* Center Hero Salad Bowl Graphic */}
        <View style={[styles.heroImageContainer, { height: heroImageHeight }]}>
          <Image
            source={require('@/assets/images/splash.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Feature Card / Sheet */}
        <View style={styles.bottomCard}>
          {/* Card Headings */}
          <Text style={styles.cardHeading}>Personalized meal plans</Text>
          <Text style={styles.cardSubheading}>
            for your goals, budget &amp; lifestyle
          </Text>

          {/* 3 Feature Highlights */}
          <View style={styles.featuresRow}>
           
            <View style={styles.featurePill}>
              <View style={styles.featureIconCircle}>
                <MaterialCommunityIcons
                  name="bullseye-arrow"
                  size={17}
                  color="#2ea457"
                />
              </View>
              <View style={styles.featureTextWrapper}>
                <Text style={styles.featureText}>Goal-based</Text>
                <Text style={styles.featureText}>plans</Text>
              </View>
            </View>

          
            <View style={styles.featurePill}>
              <View style={styles.featureIconCircle}>
                <MaterialCommunityIcons
                  name="currency-usd"
                  size={18}
                  color="#2ea457"
                />
              </View>
              <View style={styles.featureTextWrapper}>
                <Text style={styles.featureText}>Budget</Text>
                <Text style={styles.featureText}>friendly</Text>
              </View>
            </View>

           
            <View style={styles.featurePill}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="person" size={15} color="#2ea457" />
              </View>
              <View style={styles.featureTextWrapper}>
                <Text style={styles.featureText}>Made for</Text>
                <Text style={styles.featureText}>you</Text>
              </View>
            </View>
          </View>

          {/* Primary CTA Button: Get Started */}
          <Pressable
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <View style={styles.buttonContent}>
              
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons
                name="arrow-forward"
                size={22}
                color="#FFFFFF"
                style={styles.btnArrow}
              />
            </View>
          </Pressable>

          {/* Sign In Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Already have an account? </Text>
            <Pressable onPress={handleSignIn} hitSlop={8}>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#e6f3e6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
  },

  // Soft Organic Background Shapes
  bgBlobTopLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#d8eed7',
    opacity: 0.8,
  },
  bgBlobTopRight: {
    position: 'absolute',
    top: 20,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ddf2dc',
    opacity: 0.7,
  },
  bgBlobCenter: {
    position: 'absolute',
    top: '32%',
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#d4ebd3',
    opacity: 0.45,
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#cde7cc',
    opacity: 0.6,
  },

  // Floating Leaves
  floatingLeafTopRight: {
    position: 'absolute',
    top: 12,
    right: 14,
  },
  floatingLeafMiddleLeft: {
    position: 'absolute',
    top: '38%',
    left: -8,
  },
  floatingLeafBottomRight: {
    position: 'absolute',
    bottom: '22%',
    right: 4,
  },

  // Brand Header
  brandContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  logoMarkWrapper: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkCircle: {
    width: 46,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#72c76b',
    marginBottom: 1,
  },
  logoLeavesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -4,
    marginTop: -2,
  },
  logoBaseCurve: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1b643b',
    marginTop: -2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  brandTitleText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f3825',
    letterSpacing: -0.8,
  },
  brandAiText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#4db55b',
    letterSpacing: -0.6,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  taglineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#387848',
    letterSpacing: 0.2,
  },

  // Hero Image
  heroImageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Bottom Card
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#12391c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8f3e6',
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0d3824',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cardSubheading: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5a7866',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
  },

  // Features Row
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 6,
  },
  featurePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6fbf5',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: '#e6f3e4',
    gap: 6,
  },
  featureIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e6f6e4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1d432e',
    lineHeight: 13,
  },

  // Get Started Button
  getStartedButton: {
    backgroundColor: '#2fa459',
    borderRadius: 24,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2fa459',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  btnArrow: {
    position: 'absolute',
    right: 20,
  },

  // Footer Link
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  footerPrompt: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#63806f',
  },
  signInLink: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#288849',
  },
});

export default KemaMateSplash;
