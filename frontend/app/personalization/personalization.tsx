import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { UserProfileDto, UserPreferenceDto } from '@/lib/types';

const COLORS = {
  brand: '#438e3b',
  brandDark: '#285d2b',
  iconBg: '#edf6e5',
  iconColor: '#438e3b',
  muted: '#7c8ba0',
  label: '#7c8490',
  heading: '#18202a',
  stepInactive: '#8a99ad',
  stepLine: '#e2e8df',
  stepCircleBorder: '#dce2dc',
  cardBg: '#ffffff',
  cardBorder: '#e2ece0',
  chevron: '#9aa5b1',
  chipBg: '#ffffff',
  chipBorder: '#d8e8d2',
  addBorder: '#438e3b',
  addText: '#2e7d32',
  screenBg: '#f7faf5',
};

export function KemaMatePersonalization() {
  const router = useRouter();

  // Profile States
  const [age, setAge] = useState<number>(26);
  const [birthYear, setBirthYear] = useState<number>(new Date().getFullYear() - 26);
  const [biologicalSex, setBiologicalSex] = useState<'male' | 'female' | 'prefer_not_to_say'>('male');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [goal, setGoal] = useState<'lose_weight' | 'maintain' | 'gain_weight'>('maintain');

  // Preferences States
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'moderately_active' | 'very_active'>('moderately_active');
  const [dietType, setDietType] = useState<'non-veg' | 'vegetarian' | 'vegan' | 'other'>('non-veg');
  const [appetiteLevel, setAppetiteLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [dailyBudget, setDailyBudget] = useState<number>(2000);
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>(['Sri Lankan']);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);

  // Allergies State
  const [allergies, setAllergies] = useState<string[]>([]);

  // Modal States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [newAllergyInput, setNewAllergyInput] = useState<string>('');
  const [newExcludedInput, setNewExcludedInput] = useState<string>('');

  // Fetch initial profile & preferences from backend if existing
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
          if (p.heightCm) setHeightCm(Number(p.heightCm));
          if (p.weightKg) setWeightKg(Number(p.weightKg));
          if (p.goal) setGoal(p.goal);
          if (p.activityLevel) setActivityLevel(p.activityLevel);
          if (p.biologicalSex) setBiologicalSex(p.biologicalSex);
          if (p.dateOfBirth) {
            const bYear = new Date(p.dateOfBirth).getFullYear();
            const currentYear = new Date().getFullYear();
            if (!isNaN(bYear) && bYear > 1920) {
              setBirthYear(bYear);
              setAge(currentYear - bYear);
            }
          }
        }

        if (prefRes.status === 'fulfilled' && prefRes.value.data) {
          const pr = prefRes.value.data;
          if (pr.dietType) setDietType(pr.dietType);
          if (pr.appetiteLevel) setAppetiteLevel(pr.appetiteLevel);
          if (pr.mealsPerDay) setMealsPerDay(Number(pr.mealsPerDay));
          if (pr.dailyBudget != null) setDailyBudget(Number(pr.dailyBudget));
          if (Array.isArray(pr.preferredCuisines) && pr.preferredCuisines.length) {
            setPreferredCuisines(pr.preferredCuisines);
          }
          if (Array.isArray(pr.excludedIngredients)) {
            setExcludedIngredients(pr.excludedIngredients);
          }
        }

        if (allergyRes.status === 'fulfilled' && Array.isArray(allergyRes.value.data)) {
          const list = allergyRes.value.data.map((a: any) => a.allergen);
          setAllergies(list);
        }
      } catch (err) {
        console.log('Error loading initial profile data:', err);
      }
    }

    loadData();
  }, []);

  const removeAllergy = (allergy: string) => {
    setAllergies((current) => current.filter((item) => item !== allergy));
  };

  const handleAddAllergy = () => {
    const trimmed = newAllergyInput.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies((prev) => [...prev, trimmed]);
      setNewAllergyInput('');
      setActiveModal(null);
    }
  };

  const removeExcluded = (item: string) => {
    setExcludedIngredients((current) => current.filter((i) => i !== item));
  };

  const handleAddExcluded = () => {
    const trimmed = newExcludedInput.trim();
    if (trimmed && !excludedIngredients.includes(trimmed)) {
      setExcludedIngredients((prev) => [...prev, trimmed]);
      setNewExcludedInput('');
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setPreferredCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const dateOfBirth = `${birthYear}-01-15`;

      const profilePayload: UserProfileDto = {
        dateOfBirth,
        biologicalSex,
        heightCm,
        weightKg,
        goal,
        activityLevel,
      };

      await apiClient.put('/profile', profilePayload);

      const preferencesPayload: UserPreferenceDto = {
        dietType,
        appetiteLevel,
        mealsPerDay,
        dailyBudget,
        preferredCuisines: preferredCuisines.length ? preferredCuisines : ['Sri Lankan'],
        excludedIngredients,
        dislikedFoods: [],
        servings: 1,
        preferredLanguage: 'en',
      };

      await apiClient.put('/preferences', preferencesPayload);

      for (const allergen of allergies) {
        try {
          await apiClient.post('/allergies', { allergen });
        } catch {
          // Ignore duplicate warnings
        }
      }

      useAuthStore.setState({ isOnboarded: true });

      Alert.alert(
        'Success!',
        'Your personalized Sri Lankan nutrition profile is ready.',
        [{ text: 'Continue', onPress: () => router.replace('/') }]
      );
    } catch (err: any) {
      console.error('Error saving personalization:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to save your preferences. Please try again.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper labels
  const getGenderLabel = (g: string) => {
    if (g === 'male') return 'Male';
    if (g === 'female') return 'Female';
    return 'Prefer not to say';
  };

  const getGoalLabel = (g: string) => {
    if (g === 'lose_weight') return 'Lose weight';
    if (g === 'gain_weight') return 'Gain weight';
    return 'Maintain';
  };

  const getActivityLabel = (a: string) => {
    if (a === 'very_active') return 'Very Active';
    if (a === 'moderately_active') return 'Moderate';
    return 'Sedentary';
  };

  const getDietLabel = (d: string) => {
    if (d === 'vegetarian') return 'Vegetarian';
    if (d === 'vegan') return 'Vegan';
    if (d === 'non-veg') return 'Non-Veg';
    return 'Other';
  };

  const getAppetiteLabel = (ap: string) => {
    if (ap === 'high') return 'High';
    if (ap === 'low') return 'Low';
    return 'Medium';
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
        {/* Top Spacing & Brand Row */}
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <MaterialCommunityIcons name="leaf" size={22} color={COLORS.brand} />
          </View>
          <Text style={styles.brandName}>
            Kema Mate <Text style={styles.brandNameAccent}>AI</Text>
          </Text>
        </View>

        {/* Hero Section: Welcome Copy on left, Salad on right */}
        <View style={styles.heroContainer}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>
              Let&apos;s personalize{'\n'}Kema Mate AI for you{' '}
              <MaterialCommunityIcons name="sprout" size={20} color={COLORS.brand} />
            </Text>
            <Text style={styles.heroSubtitle}>
              This helps us create meal plans{'\n'}that fit you perfectly.
            </Text>
          </View>

          <View style={styles.saladWrapper}>
            <Image
              source={require('@/assets/images/nutrio-salad.png')}
              style={styles.salad}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Step Indicator */}
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, styles.stepNumberActive]}>1</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Profile</Text>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Preferences</Text>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Allergies</Text>
          </View>
        </View>

        {/* Section 1: Profile (Row 1: DOB/Age, Gender | Row 2: Height, Weight | Row 3: Goal) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.sectionSubtitle}>Tell us a bit about yourself.</Text>

          <View style={styles.grid}>
            {/* Row 1, Col 1: Age / DOB */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('age')}
            >
              <View style={styles.cardIcon}>
                <Feather name="calendar" size={19} color={COLORS.iconColor} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Age / Born</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{age} yrs ({birthYear})</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>

            {/* Row 1, Col 2: Biological Sex / Gender */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('gender')}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="person-outline" size={19} color={COLORS.iconColor} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Gender</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{getGenderLabel(biologicalSex)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>

            {/* Row 2, Col 1: Height */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('height')}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="human-male-height"
                  size={21}
                  color={COLORS.iconColor}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Height</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{heightCm} cm</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>

            {/* Row 2, Col 2: Weight */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('weight')}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="scale-bathroom"
                  size={21}
                  color={COLORS.iconColor}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Weight</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{weightKg} kg</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>
          </View>

          {/* Row 3: Goal */}
          <Pressable
            style={({ pressed }) => [styles.cardWide, { marginTop: 10 }, pressed && { opacity: 0.85 }]}
            onPress={() => setActiveModal('goal')}
          >
            <View style={styles.cardIcon}>
              <Feather name="target" size={19} color={COLORS.iconColor} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Health Goal</Text>
              <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{getGoalLabel(goal)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
          </Pressable>
        </View>

        {/* Section 2: Preferences (2x3 Grid + Excluded Ingredients Below) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text style={styles.sectionSubtitle}>Your lifestyle and food preferences.</Text>

          <View style={styles.grid}>
            {/* Row 1, Col 1: Activity Level */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('activity')}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons name="run" size={21} color={COLORS.iconColor} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Activity Level</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{getActivityLabel(activityLevel)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>

            {/* Row 1, Col 2: Diet Type */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('diet')}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons name="leaf" size={19} color={COLORS.iconColor} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Diet Type</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{getDietLabel(dietType)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>

            {/* Row 2, Col 1: Appetite */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('appetite')}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="speedometer"
                  size={21}
                  color={COLORS.iconColor}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Appetite</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{getAppetiteLabel(appetiteLevel)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>

            {/* Row 2, Col 2: Meals per day */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('meals')}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="silverware-fork-knife"
                  size={19}
                  color={COLORS.iconColor}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Meals per day</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{mealsPerDay} meals</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>

            {/* Row 3, Col 1: Budget */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('budget')}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={21}
                  color={COLORS.iconColor}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Budget</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">LKR {dailyBudget}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>

            {/* Row 3, Col 2: Preferred Cuisines */}
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => setActiveModal('cuisines')}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="noodles"
                  size={21}
                  color={COLORS.iconColor}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Preferred Cuisine</Text>
                <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">
                  {preferredCuisines.join(', ') || 'Sri Lankan'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
            </Pressable>
          </View>

          {/* Excluded Ingredients (Positioned Below the 2x3 Grid) */}
          <Pressable
            style={({ pressed }) => [
              styles.cardWide,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setActiveModal('excluded')}
          >
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons
                name="food-off"
                size={21}
                color={COLORS.iconColor}
              />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardLabel} numberOfLines={1} ellipsizeMode="tail">Excluded Ingredients</Text>
              <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">
                {excludedIngredients.length > 0
                  ? excludedIngredients.join(', ')
                  : 'Mushrooms, Celery'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} style={styles.cardChevron} />
          </Pressable>
        </View>

        {/* Section 3: Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <Text style={styles.sectionSubtitle}>
            Let us know about any allergies or intolerances.
          </Text>

          <View style={styles.allergyRow}>
            {allergies.map((allergy) => (
              <View style={styles.allergyChip} key={allergy}>
                <Text style={styles.allergyChipText}>{allergy}</Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => removeAllergy(allergy)}
                  accessibilityLabel={`Remove ${allergy}`}
                >
                  <Ionicons name="close" size={15} color={COLORS.heading} />
                </Pressable>
              </View>
            ))}

            <Pressable
              style={styles.addAllergy}
              onPress={() => setActiveModal('addAllergy')}
            >
              <Text style={styles.addAllergyText}>+ Add allergy</Text>
            </Pressable>
          </View>
        </View>

        {/* Centered Continue Action Button */}
        <View style={styles.continueButtonWrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && { opacity: 0.9 },
              isSaving && { opacity: 0.7 },
            ]}
            onPress={handleSaveAndContinue}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>

        {/* Security Note */}
        <View style={styles.secureNote}>
          <Ionicons name="lock-closed-outline" size={15} color={COLORS.muted} />
          <Text style={styles.secureNoteText}>Your data is secure and private</Text>
        </View>
      </ScrollView>

      {/* --- EDIT MODALS --- */}

      {/* Age / Date of Birth Modal */}
      <Modal visible={activeModal === 'age'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Date of Birth & Age</Text>
            <Text style={{ fontSize: 12, color: COLORS.muted, textAlign: 'center', marginBottom: 12 }}>
              Birth Year: {birthYear} ({age} years old)
            </Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => {
                  setAge((prev) => {
                    const nextAge = Math.max(12, prev - 1);
                    setBirthYear(new Date().getFullYear() - nextAge);
                    return nextAge;
                  });
                }}
              >
                <Ionicons name="remove" size={24} color="#333" />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.stepperVal}>{age} years</Text>
                <Text style={{ fontSize: 11, color: COLORS.brand, fontWeight: '700' }}>Born in {birthYear}</Text>
              </View>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => {
                  setAge((prev) => {
                    const nextAge = Math.min(100, prev + 1);
                    setBirthYear(new Date().getFullYear() - nextAge);
                    return nextAge;
                  });
                }}
              >
                <Ionicons name="add" size={24} color="#333" />
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

      {/* Gender / Biological Sex Modal */}
      <Modal visible={activeModal === 'gender'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {(['male', 'female', 'prefer_not_to_say'] as const).map((g) => (
              <Pressable
                key={g}
                style={[
                  styles.optionBtn,
                  biologicalSex === g && styles.optionBtnActive,
                ]}
                onPress={() => {
                  setBiologicalSex(g);
                  setActiveModal(null);
                }}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    biologicalSex === g && styles.optionBtnTextActive,
                  ]}
                >
                  {getGenderLabel(g)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Height Modal */}
      <Modal visible={activeModal === 'height'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Height (cm)</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setHeightCm((prev) => Math.max(100, prev - 1))}
              >
                <Ionicons name="remove" size={24} color="#333" />
              </Pressable>
              <Text style={styles.stepperVal}>{heightCm} cm</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setHeightCm((prev) => Math.min(250, prev + 1))}
              >
                <Ionicons name="add" size={24} color="#333" />
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

      {/* Weight Modal */}
      <Modal visible={activeModal === 'weight'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Weight (kg)</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setWeightKg((prev) => Math.max(30, prev - 1))}
              >
                <Ionicons name="remove" size={24} color="#333" />
              </Pressable>
              <Text style={styles.stepperVal}>{weightKg} kg</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setWeightKg((prev) => Math.min(200, prev + 1))}
              >
                <Ionicons name="add" size={24} color="#333" />
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

      {/* Goal Modal */}
      <Modal visible={activeModal === 'goal'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Goal</Text>
            {(['lose_weight', 'maintain', 'gain_weight'] as const).map((g) => (
              <Pressable
                key={g}
                style={[
                  styles.optionBtn,
                  goal === g && styles.optionBtnActive,
                ]}
                onPress={() => {
                  setGoal(g);
                  setActiveModal(null);
                }}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    goal === g && styles.optionBtnTextActive,
                  ]}
                >
                  {getGoalLabel(g)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Activity Modal */}
      <Modal visible={activeModal === 'activity'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Activity Level</Text>
            {(['sedentary', 'moderately_active', 'very_active'] as const).map((a) => (
              <Pressable
                key={a}
                style={[
                  styles.optionBtn,
                  activityLevel === a && styles.optionBtnActive,
                ]}
                onPress={() => {
                  setActivityLevel(a);
                  setActiveModal(null);
                }}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    activityLevel === a && styles.optionBtnTextActive,
                  ]}
                >
                  {getActivityLabel(a)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Diet Type Modal */}
      <Modal visible={activeModal === 'diet'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Diet Type</Text>
            {(['vegetarian', 'vegan', 'non-veg', 'other'] as const).map((d) => (
              <Pressable
                key={d}
                style={[
                  styles.optionBtn,
                  dietType === d && styles.optionBtnActive,
                ]}
                onPress={() => {
                  setDietType(d);
                  setActiveModal(null);
                }}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    dietType === d && styles.optionBtnTextActive,
                  ]}
                >
                  {getDietLabel(d)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Appetite Modal */}
      <Modal visible={activeModal === 'appetite'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Appetite</Text>
            {(['low', 'medium', 'high'] as const).map((ap) => (
              <Pressable
                key={ap}
                style={[
                  styles.optionBtn,
                  appetiteLevel === ap && styles.optionBtnActive,
                ]}
                onPress={() => {
                  setAppetiteLevel(ap);
                  setActiveModal(null);
                }}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    appetiteLevel === ap && styles.optionBtnTextActive,
                  ]}
                >
                  {getAppetiteLabel(ap)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Meals Modal */}
      <Modal visible={activeModal === 'meals'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Meals per Day</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setMealsPerDay((prev) => Math.max(1, prev - 1))}
              >
                <Ionicons name="remove" size={24} color="#333" />
              </Pressable>
              <Text style={styles.stepperVal}>{mealsPerDay} meals</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setMealsPerDay((prev) => Math.min(6, prev + 1))}
              >
                <Ionicons name="add" size={24} color="#333" />
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

      {/* Budget Modal */}
      <Modal visible={activeModal === 'budget'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Budget (LKR)</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setDailyBudget((prev) => Math.max(100, prev - 50))}
              >
                <Ionicons name="remove" size={24} color="#333" />
              </Pressable>
              <Text style={styles.stepperVal}>LKR {dailyBudget} / day</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setDailyBudget((prev) => Math.min(5000, prev + 50))}
              >
                <Ionicons name="add" size={24} color="#333" />
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

      {/* Cuisines Modal */}
      <Modal visible={activeModal === 'cuisines'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Preferred Cuisine</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
              {['Sri Lankan Traditional', 'Sri Lankan Coastal', 'Sri Lankan Village Style', 'Sri Lankan Vegetarian'].map((c) => {
                const isSelected = preferredCuisines.includes(c);
                return (
                  <Pressable
                    key={c}
                    style={[
                      styles.allergyChip,
                      isSelected && { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
                    ]}
                    onPress={() => toggleCuisine(c)}
                  >
                    <Text
                      style={[
                        styles.allergyChipText,
                        isSelected && { color: '#FFFFFF', fontWeight: '600' },
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
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

      {/* Excluded Ingredients Modal */}
      <Modal visible={activeModal === 'excluded'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Excluded Ingredients</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
              {excludedIngredients.map((item) => (
                <View style={styles.allergyChip} key={item}>
                  <Text style={styles.allergyChipText}>{item}</Text>
                  <Pressable onPress={() => removeExcluded(item)}>
                    <Ionicons name="close" size={16} color="#333" />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput
                placeholder="e.g. Mushrooms, Pork"
                placeholderTextColor="#8A99AD"
                value={newExcludedInput}
                onChangeText={setNewExcludedInput}
                style={[styles.modalInput, { flex: 1 }]}
              />
              <Pressable
                style={[styles.modalDoneBtn, { marginTop: 0, paddingHorizontal: 16 }]}
                onPress={handleAddExcluded}
              >
                <Text style={styles.modalDoneBtnText}>Add</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.modalDoneBtn, { marginTop: 16 }]}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Allergy Modal */}
      <Modal visible={activeModal === 'addAllergy'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Allergy / Intolerance</Text>
            <TextInput
              placeholder="e.g. Gluten, Soy, Tree nuts"
              placeholderTextColor="#8A99AD"
              value={newAllergyInput}
              onChangeText={setNewAllergyInput}
              style={styles.modalInput}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={[styles.modalDoneBtn, { flex: 1, backgroundColor: '#E5E7EB' }]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalDoneBtnText, { color: '#374151' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalDoneBtn, { flex: 1 }]}
                onPress={handleAddAllergy}
              >
                <Text style={styles.modalDoneBtnText}>Add</Text>
              </Pressable>
            </View>
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
    right: -40,
    top: -15,
    borderRadius: 85,
    backgroundColor: '#EDF6E8',
    opacity: 0.5,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    width: 130,
    height: 130,
    left: -40,
    bottom: -30,
    borderRadius: 65,
    backgroundColor: '#EDF6E8',
    opacity: 0.4,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 14,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.5,
  },
  brandNameAccent: {
    color: COLORS.brand,
    fontWeight: '900',
  },
  heroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.heading,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginTop: 4,
  },
  saladWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2b412a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  salad: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  step: {
    alignItems: 'center',
    minWidth: 60,
    gap: 5,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.stepCircleBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.stepInactive,
  },
  stepNumberActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 12.5,
    color: COLORS.stepInactive,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: COLORS.brandDark,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: COLORS.stepLine,
    marginTop: 18,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardWide: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    marginTop: 10,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 11,
    color: COLORS.label,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.heading,
    marginTop: 1,
  },
  cardChevron: {
    flexShrink: 0,
    marginLeft: 'auto',
  },
  allergyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  allergyChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.heading,
  },
  addAllergy: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.addBorder,
    backgroundColor: 'transparent',
  },
  addAllergyText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.addText,
  },
  continueButtonWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
  },
  continueButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#326E38',
    shadowColor: '#326E38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  secureNoteText: {
    fontSize: 12.5,
    color: COLORS.muted,
    fontWeight: '500',
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
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.heading,
    marginBottom: 16,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 16,
  },
  stepperBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.heading,
    minWidth: 100,
    textAlign: 'center',
  },
  optionBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionBtnActive: {
    backgroundColor: COLORS.iconBg,
    borderColor: COLORS.brand,
  },
  optionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  optionBtnTextActive: {
    color: COLORS.brandDark,
    fontWeight: '700',
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.heading,
  },
  modalDoneBtn: {
    backgroundColor: COLORS.brand,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default KemaMatePersonalization;
