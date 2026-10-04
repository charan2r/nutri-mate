import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { showToast } from '@/lib/toast-store';

const COLORS = {
  brand: '#438e3b',
  brandDark: '#285d2b',
  brandButton: '#2e6b35',
  brandActive: '#2e6b35',
  screenBg: '#f7faf5',
  cardBg: '#ffffff',
  cardBorder: '#e2ece0',
  currentCardBg: '#f2f8ee',
  heading: '#18202a',
  muted: '#7c8ba0',
  label: '#7c8490',
  iconBgGreen: '#edf6e5',
  iconColorGreen: '#438e3b',
  iconBgBlue: '#e0f2fe',
  iconColorBlue: '#0284c7',
  chevron: '#9aa5b1',
  fitBoxBg: '#edf6e5',
  fitBoxBorder: '#dbe8d6',
  tagBlueBg: '#e0f2fe',
  tagBlueText: '#0284c7',
  tagGreenBg: '#eef8eb',
  tagGreenText: '#2e7d32',
  tagYellowBg: '#fef3c7',
  tagYellowText: '#b45309',
};

const ALT_IMAGES = [
  require('@/assets/images/food2.png'),
  require('@/assets/images/food6.png'),
  require('@/assets/images/food5.png'),
  require('@/assets/images/food1.png'),
  require('@/assets/images/food4.png'),
];

export type MealAlternative = {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  budgetLkr: number;
  allergens: string[];
  prepTimeMinutes: number;
  mealId?: string | null;
  tags: string[];
  ingredients?: Array<{ name: string; quantity: number; unit: string }>;
  instructions?: string[];
  image?: any;
  bestMatch?: boolean;
  reason?: string;
};

export function KemaMateReplace({
  currentMeal,
  onBack,
  onMealReplaced,
}: {
  currentMeal?: {
    id?: string;
    name: string;
    type: string;
    calories: number;
    image?: any;
    reason?: string;
  };
  onBack?: () => void;
  onMealReplaced?: (newMeal: MealAlternative) => void;
} = {}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [alternatives, setAlternatives] = useState<MealAlternative[]>([]);
  const [currentMealData, setCurrentMealData] = useState(
    currentMeal || {
      id: undefined,
      name: 'Current Meal',
      type: 'Meal',
      calories: 520,
      image: require('@/assets/images/food3.png'),
      reason: 'Choose a replacement that fits your daily plan and preferences.',
    }
  );
  const [isLoadingAlts, setIsLoadingAlts] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch real AI alternatives from backend
  async function loadAlternatives() {
    if (!currentMeal?.id) {
      setIsLoadingAlts(false);
      return;
    }

    try {
      setIsLoadingAlts(true);
      const res = await apiClient.get(`/meal-items/${currentMeal.id}/alternatives`, { timeout: 270000 });

      if (res.data) {
        if (res.data.currentMeal) {
          setCurrentMealData((prev) => ({
            ...prev,
            ...res.data.currentMeal,
            image: prev.image || require('@/assets/images/food3.png'),
          }));
        }

        if (Array.isArray(res.data.alternatives) && res.data.alternatives.length > 0) {
          const mapped: MealAlternative[] = res.data.alternatives.map((alt: any, idx: number) => ({
            id: alt.id || `alt-${idx}`,
            name: alt.name || 'Nutritious Meal',
            calories: Math.round(Number(alt.calories)),
            protein: Math.round(Number(alt.protein)),
            carbs: Math.round(Number(alt.carbs)),
            fat: Math.round(Number(alt.fat)),
            budgetLkr: Math.round(Number(alt.budgetLkr)),
            tags: alt.tags,
            ingredients: alt.ingredients,
            instructions: alt.instructions,
            allergens: alt.allergens,
            prepTimeMinutes: alt.prepTimeMinutes,
            mealId: alt.mealId,
            image: ALT_IMAGES[idx % ALT_IMAGES.length],
            bestMatch: Boolean(alt.bestMatch || idx === 0),
            reason: alt.reason,
          }));
          setAlternatives(mapped);
          setSelectedIndex(0);
        }
      }
    } catch (err: any) {
      setAlternatives([]);
      Alert.alert('No suitable replacements', err.response?.data?.message || 'Could not load replacement meals. Please try again.');
    } finally {
      setIsLoadingAlts(false);
    }
  }

  useEffect(() => {
    loadAlternatives();
  }, [currentMeal?.id]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleReplaceSubmit = async () => {
    if (alternatives.length === 0) {
      Alert.alert('Notice', 'No alternative meal selected.');
      return;
    }

    const chosenAlternative = alternatives[selectedIndex];
    setIsSubmitting(true);
    try {
      if (currentMealData.id) {
        await apiClient.post(`/meal-items/${currentMealData.id}/replace`, {
          name: chosenAlternative.name,
          calories: chosenAlternative.calories,
          protein: chosenAlternative.protein,
          carbs: chosenAlternative.carbs,
          fat: chosenAlternative.fat,
          budgetLkr: chosenAlternative.budgetLkr,
          tags: chosenAlternative.tags,
          ingredients: chosenAlternative.ingredients,
          instructions: chosenAlternative.instructions,
          allergens: chosenAlternative.allergens,
          prepTimeMinutes: chosenAlternative.prepTimeMinutes,
          ...(chosenAlternative.mealId ? { mealId: chosenAlternative.mealId } : {}),
          reason: chosenAlternative.reason,
        });
      }

      showToast(`Replaced with "${chosenAlternative.name}"! 🎉`, 'success');

      if (onMealReplaced) {
        onMealReplaced(chosenAlternative);
      } else {
        handleBack();
      }
    } catch (err: any) {
      console.log('Error replacing meal item:', err);
      const msg = err.response?.data?.message || err.message || 'Could not replace meal. Please try again.';
      Alert.alert('Notice', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Background Pastel Blobs */}
      <View style={styles.bgBlobTopRight} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header App Bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={COLORS.heading} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.brandTitleRow}>
              <MaterialCommunityIcons name="sprout" size={18} color={COLORS.brand} />
              <Text style={styles.headerTitle}>Replace Meal</Text>
            </View>
            <Text style={styles.headerSubtitle}>Nutrition and prices are estimates</Text>
          </View>

          <View style={styles.topActions}>
            <Pressable
              style={styles.bellButton}
              onPress={() => Alert.alert('Notifications', 'Meal alternatives tailored to your goals.')}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.heading} />
              <View style={styles.notificationDot} />
            </Pressable>

            <Pressable
              style={styles.avatarWrapper}
              onPress={() => Alert.alert('Profile', `Signed in as ${user?.email || 'Charan'}`)}
            >
              <Image
                source={require('@/assets/images/boy.png')}
                style={styles.avatarImage}
              />
            </Pressable>
          </View>
        </View>

        {/* Current Meal Section Card */}
        <View style={styles.currentMealContainer}>
          <Text style={styles.sectionHeading}>Current Meal</Text>

          <View style={styles.currentMealCard}>
            {/* Top Row: Image & Details */}
            <View style={styles.currentMealTopRow}>
              <View style={styles.currentMealImageWrapper}>
                <Image
                  source={currentMealData.image || require('@/assets/images/food3.png')}
                  style={styles.currentMealImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.currentMealInfo}>
                <Text style={styles.currentMealName}>{currentMealData.name}</Text>
                <View style={styles.currentMealTypeRow}>
                  <Feather name="sun" size={12} color="#eab308" />
                  <Text style={styles.currentMealType}>{currentMealData.type}</Text>
                </View>
                <View style={styles.currentMealCalRow}>
                  <Text style={styles.currentMealCalVal}>{currentMealData.calories}</Text>
                  <Text style={styles.currentMealCalUnit}> kcal</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Bottom Row: Why replace */}
            <View style={styles.whyReplaceRow}>
              <View style={styles.whyIconCircle}>
                <MaterialCommunityIcons name="fire" size={14} color={COLORS.brand} />
              </View>
              <View style={styles.whyTextContainer}>
                <Text style={styles.whyTitle}>Why replace?</Text>
                <Text style={styles.whySubtitle}>
                  {currentMealData.reason || 'Choose a replacement that fits your daily plan and preferences.'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Better Alternatives Section */}
        <View style={styles.alternativesSection}>
          <Text style={styles.sectionHeading}>Better Alternatives</Text>

          {isLoadingAlts ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.brand} />
              <Text style={styles.loadingText}>Generating AI meal alternatives...</Text>
            </View>
          ) : alternatives.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No alternatives available right now.</Text>
              <Pressable style={styles.retryBtn} onPress={loadAlternatives}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            alternatives.map((alt, index) => {
              const isSelected = selectedIndex === index;

              return (
                <Pressable
                  key={alt.id}
                  style={[
                    styles.altCard,
                    isSelected && styles.altCardSelected,
                  ]}
                  onPress={() => setSelectedIndex(index)}
                >
                  {/* Alternative Image with Best match badge */}
                  <View style={styles.altImageWrapper}>
                    <Image
                      source={alt.image || ALT_IMAGES[index % ALT_IMAGES.length]}
                      style={styles.altImage}
                      resizeMode="cover"
                    />
                    {alt.bestMatch && (
                      <View style={styles.bestMatchBadge}>
                        <Text style={styles.bestMatchText}>Best match</Text>
                      </View>
                    )}
                  </View>

                  {/* Alternative Details */}
                  <View style={styles.altInfo}>
                    <Text style={styles.altName}>{alt.name}</Text>
                    <View style={styles.altCalRow}>
                      <Text style={styles.altCalVal}>{alt.calories}</Text>
                      <Text style={styles.altCalUnit}> kcal</Text>
                    </View>
                    <View style={styles.altBudgetRow}>
                      <MaterialCommunityIcons name="wallet-outline" size={13} color={COLORS.brand} />
                      <Text style={styles.altBudgetText}>Budget: ₹{alt.budgetLkr}</Text>
                    </View>

                    {/* Tag Row */}
                    <View style={styles.altTagsRow}>
                      {alt.tags.map((t, idx) => (
                        <View
                          key={t}
                          style={[
                            styles.altTagPill,
                            idx === 0 ? styles.altTagBlue : styles.altTagGreen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.altTagText,
                              idx === 0 ? styles.altTagBlueText : styles.altTagGreenText,
                            ]}
                          >
                            {t}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Radio Button */}
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Fit Note Box */}
        <View style={styles.fitNoteBox}>
          <Text style={styles.fitNoteText}>
            All alternatives fit your remaining{'\n'}calorie and budget
          </Text>
          <Ionicons name="sparkles" size={14} color="#eab308" style={styles.fitSparkle} />
          <MaterialCommunityIcons
            name="leaf"
            size={36}
            color="#d4e8cb"
            style={styles.fitLeafWatermark}
          />
        </View>

        {/* Bottom CTA Button */}
        <Pressable
          style={({ pressed }) => [
            styles.replaceButton,
            (pressed || alternatives.length === 0) && { opacity: 0.9 },
            isSubmitting && { opacity: 0.75 },
          ]}
          onPress={handleReplaceSubmit}
          disabled={isSubmitting || alternatives.length === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.replaceButtonText}>Replace Meal</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  screen: {
    flex: 1,
  },
  bgBlobTopRight: {
    position: 'absolute',
    width: 170,
    height: 150,
    right: -35,
    top: -15,
    borderRadius: 85,
    backgroundColor: '#EDF6E8',
    opacity: 0.55,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    width: 130,
    height: 130,
    left: -35,
    bottom: 20,
    borderRadius: 65,
    backgroundColor: '#EDF6E8',
    opacity: 0.4,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 6,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: COLORS.muted,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brand,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#438e3b',
  },
  avatarImage: {
    width: 36,
    height: 36,
  },

  // Current Meal Section
  currentMealContainer: {
    backgroundColor: COLORS.currentCardBg,
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.heading,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  currentMealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  currentMealTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentMealImageWrapper: {
    width: 86,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
  },
  currentMealImage: {
    width: '100%',
    height: '100%',
  },
  currentMealInfo: {
    flex: 1,
  },
  currentMealName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.heading,
  },
  currentMealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  currentMealType: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  currentMealCalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },
  currentMealCalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2e7d32',
  },
  currentMealCalUnit: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.muted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5ef',
    marginVertical: 10,
  },
  whyReplaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whyIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTextContainer: {
    flex: 1,
  },
  whyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.heading,
  },
  whySubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
  },

  // Alternatives Section
  alternativesSection: {
    marginBottom: 12,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12.5,
    color: COLORS.muted,
    fontWeight: '500',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.iconBgGreen,
  },
  retryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.brand,
  },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 10,
    marginBottom: 10,
    gap: 10,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  altCardSelected: {
    borderColor: COLORS.brand,
    backgroundColor: '#FAFDF9',
  },
  altImageWrapper: {
    width: 84,
    height: 74,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  altImage: {
    width: '100%',
    height: '100%',
  },
  bestMatchBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestMatchText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  altInfo: {
    flex: 1,
  },
  altName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.heading,
  },
  altCalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 1,
  },
  altCalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2e7d32',
  },
  altCalUnit: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.muted,
  },
  altBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  altBudgetText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  altTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  altTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  altTagBlue: {
    backgroundColor: COLORS.tagBlueBg,
  },
  altTagBlueText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.tagBlueText,
  },
  altTagGreen: {
    backgroundColor: COLORS.tagGreenBg,
  },
  altTagGreenText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.tagGreenText,
  },
  altTagText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Radio button
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  radioOuterSelected: {
    borderColor: COLORS.brand,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.brand,
  },

  // Fit Note Box
  fitNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fitBoxBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.fitBoxBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  fitNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#285d2b',
    lineHeight: 16,
    flex: 1,
  },
  fitSparkle: {
    marginRight: 10,
  },
  fitLeafWatermark: {
    position: 'absolute',
    right: -4,
    bottom: -6,
    opacity: 0.7,
  },

  // Bottom CTA Button
  replaceButton: {
    backgroundColor: COLORS.brandButton,
    borderRadius: 18,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brandButton,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  replaceButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default KemaMateReplace;
