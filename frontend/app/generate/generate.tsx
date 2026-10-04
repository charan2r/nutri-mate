import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { KemaMatePlan } from '../plan/plan';

const COLORS = {
  brand: '#438e3b',
  brandDark: '#285d2b',
  brandButton: '#265d29',
  screenBg: '#f7faf5',
  cardBg: '#ffffff',
  cardBorder: '#e2ece0',
  prefBoxBg: '#f0f7ec',
  prefBoxBorder: '#dbe8d6',
  heading: '#18202a',
  muted: '#7c8ba0',
  label: '#7c8490',
  iconBgGreen: '#edf6e5',
  iconColorGreen: '#438e3b',
  aiBoxBg: '#e8f5f6',
  aiBoxBorder: '#d1ecf1',
  aiIconColor: '#0ea5e9',
  chevron: '#9aa5b1',
};

export function KemaMateGenerate({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter();
  const { user } = useAuthStore();

  // Settings States
  const [startDate, setStartDate] = useState<string>('Today');
  const [durationDays, setDurationDays] = useState<number>(3);
  const [calorieTarget, setCalorieTarget] = useState<number>(1480);
  const [strictCalorieControl, setStrictCalorieControl] = useState<boolean>(false);

  // Preference Summary States from Backend
  const [goal, setGoal] = useState<string>('Weight Management');
  const [budget, setBudget] = useState<number>(2000);
  const [dietType, setDietType] = useState<string>('Balanced');
  const [allergiesText, setAllergiesText] = useState<string>('None');
  const [preferredFoodsText, setPreferredFoodsText] = useState<string>(
    'Red rice, Dhal, Eggs, Fish, Bananas'
  );
  const [avoidedFoodsText, setAvoidedFoodsText] = useState<string>(
    ''
  );

  // Loading & Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [showGeneratedPlan, setShowGeneratedPlan] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Fetch initial profile & preferences
  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, prefRes, allergyRes] = await Promise.allSettled([
          apiClient.get('/profile'),
          apiClient.get('/preferences'),
          apiClient.get('/allergies'),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          const p = profileRes.value.data;
          if (p.dailyCalorieTarget) {
            setCalorieTarget(Math.round(Number(p.dailyCalorieTarget)));
          }
          if (p.goal) {
            const goalMap: { [k: string]: string } = {
              weight_loss: 'Weight Loss',
              muscle_gain: 'Muscle Gain',
              maintenance: 'Weight Management',
              general_health: 'General Health',
              energy: 'Higher Energy',
            };
            setGoal(goalMap[p.goal] || p.goal);
          }
        }

        if (prefRes.status === 'fulfilled' && prefRes.value.data) {
          const pr = prefRes.value.data;
          if (pr.dailyBudget != null) {
            setBudget(Math.round(Number(pr.dailyBudget)));
          }
          if (pr.dietType) {
            const dietMap: { [k: string]: string } = {
              balanced: 'Balanced (Vegetarian leaning)',
              vegetarian: 'Vegetarian',
              vegan: 'Vegan',
              high_protein: 'High Protein',
              low_carb: 'Low Carb',
            };
            setDietType(dietMap[pr.dietType] || pr.dietType);
          }
          if (Array.isArray(pr.preferredCuisines) && pr.preferredCuisines.length) {
            setPreferredFoodsText(pr.preferredCuisines.join(', '));
          }
          if (Array.isArray(pr.excludedIngredients) && pr.excludedIngredients.length) {
            setAvoidedFoodsText(pr.excludedIngredients.join(', '));
          }
        }

        if (allergyRes.status === 'fulfilled' && Array.isArray(allergyRes.value.data)) {
          const list = allergyRes.value.data.map((a: any) => a.allergen);
          if (list.length) setAllergiesText(list.join(', '));
        }
      } catch (err) {
        console.log('Error loading initial profile data for generator:', err);
      }
    }

    loadData();
  }, []);

  if (showGeneratedPlan && generatedPlan) {
    return (
      <KemaMatePlan
        planData={generatedPlan}
        planId={generatedPlan?.planId || generatedPlan?.plan?.id || generatedPlan?.id}
        onBack={() => {
          setShowGeneratedPlan(false);
          if (onBack) onBack();
        }}
      />
    );
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      // Calculate ISO date string
      const todayISO = new Date().toISOString().split('T')[0];

      const payload = {
        startDate: todayISO,
        durationDays: durationDays,
        strictCalorieControl: strictCalorieControl,
      };

      const response = await apiClient.post('/meal-plans/generate', payload, {
        timeout: 510000,
      });
      setGeneratedPlan(response.data);
      setShowGeneratedPlan(true);
      showToast('Meal plan generated successfully! 🎉', 'success');
    } catch (err: any) {
      console.log('Error generating meal plan:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not generate meal plan. Please ensure your profile and preferences are complete.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setIsGenerating(false);
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
        {/* Top App Bar with Back & Avatar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (onBack) {
                onBack();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.heading} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Generate Meal Plan</Text>
            <Text style={styles.headerSubtitle}>
              Personalized meals, goals and grocery list.
            </Text>
          </View>

          <View style={styles.topActions}>
            <Pressable
              style={styles.bellButton}
              onPress={() => Alert.alert('Alerts', 'No new alerts.')}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.heading} />
              <View style={styles.notificationDot} />
            </Pressable>

            <Pressable
              style={styles.avatarWrapper}
              onPress={() => Alert.alert('Profile', `User: ${user?.email}`)}
            >
              <Image
                source={require('@/assets/images/boy.png')}
                style={styles.avatarImage}
              />
            </Pressable>
          </View>
        </View>

        {/* Hero Graphic: 3D Salad Bowl with Calendar & Sparkles */}
        <View style={styles.heroGraphicWrapper}>
          <Image
            source={require('@/assets/images/foods.png')}
            style={styles.heroGraphic}
            resizeMode="contain"
          />
          <View style={styles.sparkleTopLeft}>
            <Ionicons name="sparkles" size={16} color="#EAB308" />
          </View>
          <View style={styles.sparkleBottomRight}>
            <Ionicons name="sparkles" size={14} color="#EAB308" />
          </View>
        </View>

        {/* Settings Card */}
        <View style={styles.settingsCard}>
          {/* Row 1: Start Date */}
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.85 }]}
            onPress={() => setActiveModal('date')}
          >
            <View style={styles.settingIconWrapper}>
              <Feather name="calendar" size={18} color={COLORS.iconColorGreen} />
            </View>
            <Text style={styles.settingTitle}>Start Date</Text>
            <Text style={styles.settingValue}>{startDate}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.settingChevron} />
          </Pressable>

          {/* Row 2: Duration */}
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.85 }]}
            onPress={() => setActiveModal('duration')}
          >
            <View style={styles.settingIconWrapper}>
              <Feather name="clock" size={18} color={COLORS.iconColorGreen} />
            </View>
            <Text style={styles.settingTitle}>Duration</Text>
            <Text style={styles.settingValue}>{durationDays} Days</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.settingChevron} />
          </Pressable>

          {/* Row 3: Calorie Target */}
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.85 }]}
            onPress={() => setActiveModal('calories')}
          >
            <View style={styles.settingIconWrapper}>
              <MaterialCommunityIcons name="leaf" size={18} color={COLORS.iconColorGreen} />
            </View>
            <Text style={styles.settingTitle}>Calorie Target</Text>
            <Text style={styles.settingValue}>{calorieTarget.toLocaleString()} kcal / day</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.settingChevron} />
          </Pressable>

          {/* Row 4: Strict Calorie Control Switch */}
          <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 2 }]}>
            <View style={styles.settingIconWrapper}>
              <MaterialCommunityIcons name="scale-balance" size={19} color={COLORS.iconColorGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Strict Calorie Control</Text>
              <Text style={styles.settingSubtitle}>Keep daily calories within ±5%</Text>
            </View>
            <Switch
              value={strictCalorieControl}
              onValueChange={setStrictCalorieControl}
              trackColor={{ false: '#d1d5db', true: COLORS.brandDark }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#d1d5db"
            />
          </View>
        </View>

        {/* Your Preferences Box */}
        <View style={styles.preferencesBox}>
          <Text style={styles.preferencesBoxTitle}>Your Preferences</Text>

          {/* Diet Preference */}
          <View style={styles.prefRow}>
            <MaterialCommunityIcons name="sprout" size={18} color={COLORS.brand} />
            <Text style={styles.prefLabel}>Diet Preference</Text>
            <Text style={styles.prefValue} numberOfLines={1}>{dietType}</Text>
          </View>

          {/* Allergies */}
          <View style={styles.prefRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color={COLORS.brand} />
            <Text style={styles.prefLabel}>Allergies</Text>
            <Text style={styles.prefValue} numberOfLines={1}>{allergiesText}</Text>
          </View>

          {/* Foods You Prefer */}
          <View style={styles.prefRow}>
            <Ionicons name="heart-outline" size={18} color={COLORS.brand} />
            <Text style={styles.prefLabel}>Foods You Prefer</Text>
            <Text style={styles.prefValue} numberOfLines={1}>{preferredFoodsText}</Text>
          </View>

          {/* Foods You Avoid */}
          <View style={[styles.prefRow, { marginBottom: 0 }]}>
            <MaterialCommunityIcons name="close-circle-outline" size={18} color={COLORS.brand} />
            <Text style={styles.prefLabel}>Foods You Avoid</Text>
            <Text style={styles.prefValue} numberOfLines={1}>{avoidedFoodsText}</Text>
          </View>
        </View>

        {/* 3 Mini Summary Stat Cards */}
        <View style={styles.miniCardsRow}>
          {/* Goals */}
          <View style={styles.miniCard}>
            <View style={[styles.miniIconWrapper, { backgroundColor: '#e0f2fe' }]}>
              <MaterialCommunityIcons name="target" size={17} color="#0284c7" />
            </View>
            <Text style={styles.miniLabel}>Goals</Text>
            <Text style={styles.miniValue}>{goal}</Text>
            <Text style={styles.miniSubtitle} numberOfLines={1}>Feel active & energetic</Text>
          </View>

          {/* Budget */}
          <View style={styles.miniCard}>
            <View style={[styles.miniIconWrapper, { backgroundColor: COLORS.iconBgGreen }]}>
              <MaterialCommunityIcons name="wallet-outline" size={17} color={COLORS.iconColorGreen} />
            </View>
            <Text style={styles.miniLabel}>Daily Budget</Text>
            <Text style={styles.miniValue}>LKR {budget}</Text>
            <Text style={styles.miniSubtitle}>Target per day</Text>
          </View>

          {/* Diet */}
          <View style={styles.miniCard}>
            <View style={[styles.miniIconWrapper, { backgroundColor: COLORS.iconBgGreen }]}>
              <MaterialCommunityIcons name="leaf" size={17} color={COLORS.iconColorGreen} />
            </View>
            <Text style={styles.miniLabel}>Diet</Text>
            <Text style={styles.miniValue}>{dietType.split(' ')[0]}</Text>
            <Text style={styles.miniSubtitle} numberOfLines={1}>Vegetarian leaning</Text>
          </View>
        </View>

        {/* AI Note Box */}
        <View style={styles.aiNoteBox}>
          <View style={styles.aiIconWrapper}>
            <Ionicons name="sparkles" size={18} color={COLORS.aiIconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiNoteTitle}>AI will create a personalized plan</Text>
            <Text style={styles.aiNoteSubtitle}>
              Based on your goals, preferences and calorie target.
            </Text>
          </View>
        </View>

        {/* Bottom CTA Generate Button */}
        <Pressable
          style={({ pressed }) => [
            styles.generateButton,
            pressed && { opacity: 0.9 },
            isGenerating && { opacity: 0.75 },
          ]}
          onPress={handleGeneratePlan}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.generateButtonContent}>
              <View style={styles.generateButtonHeadingRow}>
                <Text style={styles.generateButtonTitle}>Generate {durationDays}-Day Plan</Text>
              </View>
              <Text style={styles.generateButtonSubtitle}>
                Get your meals, recipes & grocery list
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      {/* --- EDIT MODALS --- */}

      {/* Duration Modal */}
      <Modal visible={activeModal === 'duration'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Plan Duration</Text>
            {[3, 5, 7, 14].map((d) => (
              <Pressable
                key={d}
                style={[
                  styles.modalOptionBtn,
                  durationDays === d && styles.modalOptionBtnActive,
                ]}
                onPress={() => {
                  setDurationDays(d);
                  setActiveModal(null);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    durationDays === d && styles.modalOptionTextActive,
                  ]}
                >
                  {d} Days
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Calories Modal */}
      <Modal visible={activeModal === 'calories'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Calorie Target</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setCalorieTarget((prev) => Math.max(800, prev - 50))}
              >
                <Ionicons name="remove" size={22} color="#333" />
              </Pressable>
              <Text style={styles.stepperVal}>{calorieTarget} kcal</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setCalorieTarget((prev) => Math.min(4000, prev + 50))}
              >
                <Ionicons name="add" size={22} color="#333" />
              </Pressable>
            </View>
            <Pressable
              style={styles.modalDoneBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Date Modal */}
      <Modal visible={activeModal === 'date'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Start Date</Text>
            {['Today', 'Tomorrow', 'Next Monday', 'May 18, 2025'].map((dt) => (
              <Pressable
                key={dt}
                style={[
                  styles.modalOptionBtn,
                  startDate === dt && styles.modalOptionBtnActive,
                ]}
                onPress={() => {
                  setStartDate(dt);
                  setActiveModal(null);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    startDate === dt && styles.modalOptionTextActive,
                  ]}
                >
                  {dt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 24,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
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
    marginTop: 2,
    textAlign: 'center',
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

  // Hero Graphic
  heroGraphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  heroGraphic: {
    width: 80,
    height: 75,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 10,
    left: 45,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 45,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5ef',
  },
  settingIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.heading,
    flex: 1,
  },
  settingSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  settingChevron: {
    marginLeft: 2,
  },

  // Preferences Box
  preferencesBox: {
    backgroundColor: COLORS.prefBoxBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.prefBoxBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  preferencesBoxTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.heading,
    marginBottom: 8,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  prefLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.heading,
    minWidth: 110,
  },
  prefValue: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
  },

  // 3 Mini Summary Stat Cards
  miniCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 10,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  miniIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.label,
  },
  miniValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.heading,
    marginTop: 1,
  },
  miniSubtitle: {
    fontSize: 9.5,
    color: COLORS.muted,
    marginTop: 1,
  },

  // AI Note Box
  aiNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.aiBoxBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.aiBoxBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 14,
  },
  aiIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiNoteTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.heading,
  },
  aiNoteSubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },

  // Bottom CTA Generate Button
  generateButton: {
    backgroundColor: COLORS.brandButton,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brandButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  generateButtonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  generateButtonSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.heading,
    marginBottom: 14,
    textAlign: 'center',
  },
  modalOptionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOptionBtnActive: {
    backgroundColor: COLORS.iconBgGreen,
    borderColor: COLORS.brand,
  },
  modalOptionText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  modalOptionTextActive: {
    color: COLORS.brandDark,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 14,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.heading,
    minWidth: 100,
    textAlign: 'center',
  },
  modalDoneBtn: {
    backgroundColor: COLORS.brand,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  modalDoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default KemaMateGenerate;
