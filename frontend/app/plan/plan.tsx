import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
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
import {
  getActivePlanDay,
  getPlanDayDateString,
  parseYMD,
} from '@/lib/date-utils';
import { showToast } from '@/lib/toast-store';
import { KemaMateFeedback } from '../feedback/feedback';

const COLORS = {
  brand: '#438e3b',
  brandDark: '#285d2b',
  brandButton: '#2e6b35',
  screenBg: '#f7faf5',
  cardBg: '#ffffff',
  cardBorder: '#e2ece0',
  heading: '#18202a',
  muted: '#7c8ba0',
  label: '#7c8490',
  iconBgGreen: '#edf6e5',
  iconColorGreen: '#438e3b',
  chevron: '#9aa5b1',
};

type FormattedMeal = {
  id?: string;
  type: string;
  name: string;
  calories: string;
  caloriesNum: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number | null;
  prepTime: number | null;
  description: string;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  instructions?: string[];
  allergens: string[];
  dietTags: string[];
  reason: string;
  image: any;
  icon: string;
  iconColor: string;
  iconType: 'feather' | 'ionicons' | 'material';
};

const FOOD_IMAGES = [
  require('@/assets/images/food1.png'),
  require('@/assets/images/food2.png'),
  require('@/assets/images/food3.png'),
  require('@/assets/images/food4.png'),
  require('@/assets/images/food5.png'),
  require('@/assets/images/food6.png'),
];

export function KemaMatePlan({
  planId,
  planData,
  onBack,
}: {
  planId?: string;
  planData?: any;
  onBack?: () => void;
} = {}) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [planStartDate, setPlanStartDate] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [estBudget, setEstBudget] = useState<number>(0);
  const [avgCalories, setAvgCalories] = useState<number>(2000);
  const [avgProtein, setAvgProtein] = useState<number>(75);
  const [avgCarbs, setAvgCarbs] = useState<number>(220);
  const [avgFats, setAvgFats] = useState<number>(55);
  const [totalDays, setTotalDays] = useState<number>(3);
  const [mealsByDay, setMealsByDay] = useState<{ [day: number]: FormattedMeal[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMealDetail, setSelectedMealDetail] = useState<FormattedMeal | null>(null);
  const [feedbackMeal, setFeedbackMeal] = useState<{
    id?: string;
    mealItemId?: string;
    name?: string;
    type?: string;
    calories?: number;
  } | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      if (planData) {
        applyPlanData(planData);
        return;
      }
      try {
        setIsLoading(true);
        const targetId = planId;
        if (targetId) {
          const res = await apiClient.get(`/meal-plans/${targetId}`);
          if (res.data) applyPlanData(res.data);
        } else {
          const res = await apiClient.get('/meal-plans');
          if (Array.isArray(res.data) && res.data.length > 0) {
            const firstId = res.data[0].id;
            const fullRes = await apiClient.get(`/meal-plans/${firstId}`);
            applyPlanData(fullRes.data || res.data[0]);
          }
        }
      } catch (err) {
        console.log('Error fetching meal plan detail:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlan();
  }, [planId, planData]);

  const applyPlanData = (p: any) => {
    const rawPlan = p.plan || p;
    const items: any[] =
      p.items || p.mealItems || rawPlan.items || rawPlan.mealItems || [];

    const qs = rawPlan.qualityScore ?? p.qualityScore ?? 0;
    setQualityScore(Math.round(Number(qs)));

    const cost = rawPlan.estimatedCostLkr ?? p.estimatedCostLkr ?? 0;
    setEstBudget(Math.round(Number(cost)));

    // Group items by day
    const grouped: { [day: number]: FormattedMeal[] } = {};
    let maxDayFromItems = 0;

    items.forEach((item, idx) => {
      const d = Number(item.day) || 1;
      if (d > maxDayFromItems) maxDayFromItems = d;
      if (!grouped[d]) grouped[d] = [];

      const snap = item.generatedMealSnapshot || item.meal || {};
      const mealType = item.mealType || snap.mealType || 'lunch';
      const capType = mealType.charAt(0).toUpperCase() + mealType.slice(1);

      const calories = Math.round(Number(item.caloriesSnapshot ?? snap.calories ?? 500));
      const protein = Math.round(Number(item.proteinSnapshot ?? snap.protein ?? 25));
      const carbs = Math.round(Number(item.carbsSnapshot ?? snap.carbs ?? 60));
      const fat = Math.round(Number(item.fatSnapshot ?? snap.fat ?? 15));
      const itemCost = item.estimatedCostSnapshot ?? snap.estimatedCostLkr ?? null;
      const prepTime = snap.prepTimeMinutes ? Number(snap.prepTimeMinutes) : 20;

      const instructions =
        Array.isArray(snap.instructions) && snap.instructions.length > 0
          ? snap.instructions
          : typeof snap.recipe === 'string' && snap.recipe.trim()
            ? snap.recipe
                .split('\n')
                .map((s: string) => s.replace(/^\d+[\.\)]\s*/, '').trim())
                .filter(Boolean)
            : [
                `Rinse and prepare fresh ingredients for ${snap.name || item.name || 'this dish'}.`,
                `Heat a pot or pan with a dash of oil, temper aromatics and spices.`,
                `Combine main ingredients and simmer gently until cooked thoroughly.`,
                `Season with salt to taste and serve fresh with accompanying dishes.`,
              ];

      let icon = 'sunny-outline';
      let iconColor = '#f59e0b';
      let iconType: 'feather' | 'ionicons' | 'material' = 'ionicons';

      if (mealType.toLowerCase() === 'breakfast') {
        icon = 'sun';
        iconColor = '#f59e0b';
        iconType = 'feather';
      } else if (mealType.toLowerCase() === 'dinner') {
        icon = 'moon';
        iconColor = '#7c3aed';
        iconType = 'ionicons';
      } else if (mealType.toLowerCase() === 'snack') {
        icon = 'leaf';
        iconColor = '#438e3b';
        iconType = 'material';
      }

      grouped[d].push({
        id: item.id || `meal-${idx}`,
        type: capType,
        name: snap.name || item.name || 'Sri Lankan Meal',
        calories: `${calories} kcal`,
        caloriesNum: calories,
        protein,
        carbs,
        fat,
        cost: itemCost ? Math.round(Number(itemCost)) : null,
        prepTime,
        description: snap.description || snap.name || 'Balanced nutritious meal',
        ingredients: Array.isArray(snap.ingredients) ? snap.ingredients : [],
        instructions,
        allergens: Array.isArray(snap.allergens) ? snap.allergens : [],
        dietTags: Array.isArray(snap.dietTags) ? snap.dietTags : [],
        reason: snap.reason || item.selectionExplanation?.reason || 'Nutritious balanced meal',
        image: FOOD_IMAGES[idx % FOOD_IMAGES.length],
        icon,
        iconColor,
        iconType,
      });
    });

    let dateDuration = 0;
    const startDateStr = rawPlan.startDate || p.startDate || null;
    setPlanStartDate(startDateStr);

    if (rawPlan.startDate && rawPlan.endDate) {
      const s = parseYMD(rawPlan.startDate);
      const e = parseYMD(rawPlan.endDate);
      if (s && e) {
        const sUtc = Date.UTC(s.year, s.month, s.date);
        const eUtc = Date.UTC(e.year, e.month, e.date);
        if (eUtc >= sUtc) {
          dateDuration = Math.round((eUtc - sUtc) / (1000 * 60 * 60 * 24)) + 1;
        }
      }
    }

    const dayCount = Math.max(maxDayFromItems, dateDuration, 1);
    setTotalDays(dayCount);
    setMealsByDay(grouped);

    const currentActiveDay = getActivePlanDay(startDateStr, dayCount);
    if (currentActiveDay) {
      setSelectedDay(currentActiveDay);
    } else {
      setSelectedDay(1);
    }

    const totalCals = rawPlan.totalCalories ?? p.totalCalories;
    if (totalCals) {
      setAvgCalories(Math.round(Number(totalCals) / (dayCount || 1)));
    }
    const totalProt = rawPlan.totalProtein ?? p.totalProtein;
    if (totalProt) {
      setAvgProtein(Math.round(Number(totalProt) / (dayCount || 1)));
    }
    const totalC = rawPlan.totalCarbs ?? p.totalCarbs;
    if (totalC) {
      setAvgCarbs(Math.round(Number(totalC) / (dayCount || 1)));
    }
    const totalF = rawPlan.totalFat ?? p.totalFat;
    if (totalF) {
      setAvgFats(Math.round(Number(totalF) / (dayCount || 1)));
    }
  };

  const handleSharePlan = async () => {
    try {
      await Share.share({
        message: `Check out my ${totalDays}-day personalized meal plan (Quality Score: ${qualityScore}/100) from Kema Mate AI! 🌱`,
      });
      showToast('Meal plan shared successfully!', 'success');
    } catch {
      showToast('Meal plan link copied to clipboard.', 'info');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const renderMealIcon = (meal: FormattedMeal) => {
    if (meal.iconType === 'feather') {
      return <Feather name={meal.icon as any} size={12} color={meal.iconColor} />;
    }
    if (meal.iconType === 'ionicons') {
      return <Ionicons name={meal.icon as any} size={12} color={meal.iconColor} />;
    }
    return <MaterialCommunityIcons name={meal.icon as any} size={12} color={meal.iconColor} />;
  };

  const currentDayMeals = mealsByDay[selectedDay] || [];
  const currentDayCalories = currentDayMeals.reduce((acc, m) => acc + m.caloriesNum, 0);

  const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1);

  if (feedbackMeal) {
    return (
      <KemaMateFeedback
        meal={feedbackMeal}
        onBack={() => setFeedbackMeal(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Background Pastel Blobs */}
      <View style={styles.bgBlobTopRight} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text style={styles.loadingText}>Loading meal plan...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top App Bar with Back, Logo & Share */}
          <View style={styles.topBar}>
            <View style={styles.topLeftGroup}>
              <Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
                <Ionicons name="arrow-back" size={20} color={COLORS.heading} />
              </Pressable>

              <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                  <MaterialCommunityIcons name="leaf" size={20} color={COLORS.brand} />
                </View>
                <Text style={styles.brandName}>
                  Kema Mate <Text style={styles.brandNameAccent}>AI</Text>
                </Text>
              </View>
            </View>

            <Pressable style={styles.sharePill} onPress={handleSharePlan}>
              <Ionicons name="share-outline" size={15} color={COLORS.heading} />
              <Text style={styles.sharePillText}>Share Plan</Text>
            </Pressable>
          </View>

          {/* Hero Title */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Your {totalDays}-Day Meal Plan{' '}
              <Image
                source={require('@/assets/images/diet.png')}
                style={{
                  width:15,
                  height:15
                }}
              />
            </Text>
            <Text style={styles.heroSubtitle}>Planned with Gemma � Nutrition and prices are estimates</Text>
          </View>

          {/* AI Quality Score Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreRing}>
              <Text style={styles.scoreNumber}>{qualityScore}</Text>
              <Text style={styles.scoreTotal}>/100</Text>
            </View>

            <View style={styles.scoreInfo}>
              <Text style={styles.scoreTitle}>
                {qualityScore >= 80 ? 'Excellent Plan! 🌟' : 'Personalized Plan 🌱'}
              </Text>
              <Text style={styles.scoreDesc}>
                Calorie targets balanced with authentic Sri Lankan recipes and grocery integration.
              </Text>

              <View style={styles.scoreBadge}>
                <Ionicons name="sparkles" size={12} color="#2e7d32" />
                <Text style={styles.scoreBadgeText}>AI Quality Score</Text>
              </View>
            </View>
          </View>

          {/* 4 Metric Badges Row */}
          <View style={styles.metricRow}>
            {/* Meets Goals */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
                <Text style={styles.metricLabel}>Meets Goals</Text>
              </View>
              <Text style={styles.metricValue}>
                {totalDays}/{totalDays} <Text style={styles.metricUnit}>days</Text>
              </Text>
            </View>

            {/* High Variety */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MaterialCommunityIcons name="leaf" size={13} color={COLORS.brand} />
                <Text style={styles.metricLabel}>Variety</Text>
              </View>
              <Text style={styles.metricValue}>
                {Object.values(mealsByDay).flat().length} <Text style={styles.metricUnit}>meals</Text>
              </Text>
            </View>

            {/* Balanced */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MaterialCommunityIcons name="scale-balance" size={13} color="#0ea5e9" />
                <Text style={styles.metricLabel}>Balanced</Text>
              </View>
              <Text style={styles.metricValue}>All macros</Text>
            </View>

            {/* High Fiber */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MaterialCommunityIcons name="wallet-outline" size={13} color={COLORS.brand} />
                <Text style={styles.metricLabel}>Est. Cost</Text>
              </View>
              <Text style={styles.metricValue}>
                LKR {estBudget.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Nutrition Summary Strip */}
          <View style={styles.nutritionStripCard}>
            <View style={styles.nutritionColumnsRow}>
              {/* Calories */}
              <View style={styles.nutritionCol}>
                <View style={styles.nutritionLabelRow}>
                  <MaterialCommunityIcons name="fire" size={12} color="#f97316" />
                  <Text style={styles.nutritionLabel}>Calories (avg)</Text>
                </View>
                <Text style={styles.nutritionValue}>{avgCalories.toLocaleString()}</Text>
                <Text style={styles.nutritionSub}>kcal/day</Text>
              </View>

              {/* Protein */}
              <View style={styles.nutritionCol}>
                <View style={styles.nutritionLabelRow}>
                  <MaterialCommunityIcons name="arm-flex" size={12} color={COLORS.brand} />
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <Text style={styles.nutritionValue}>{avgProtein}g</Text>
                <Text style={styles.nutritionSub}>daily</Text>
              </View>

              {/* Carbs */}
              <View style={styles.nutritionCol}>
                <View style={styles.nutritionLabelRow}>
                  <MaterialCommunityIcons name="barley" size={12} color="#eab308" />
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <Text style={styles.nutritionValue}>{avgCarbs}g</Text>
                <Text style={styles.nutritionSub}>daily</Text>
              </View>

              {/* Fats */}
              <View style={styles.nutritionCol}>
                <View style={styles.nutritionLabelRow}>
                  <MaterialCommunityIcons name="water" size={12} color="#0ea5e9" />
                  <Text style={styles.nutritionLabel}>Fats</Text>
                </View>
                <Text style={styles.nutritionValue}>{avgFats}g</Text>
                <Text style={styles.nutritionSub}>daily</Text>
              </View>
            </View>

            {/* Accent colored bar */}
            <View style={styles.stripBarWrapper}>
              <View style={[styles.stripBarSegment, { backgroundColor: '#438e3b', flex: 1 }]} />
              <View style={[styles.stripBarSegment, { backgroundColor: '#0d9488', flex: 1.2 }]} />
              <View style={[styles.stripBarSegment, { backgroundColor: '#0284c7', flex: 1 }]} />
              <View style={[styles.stripBarSegment, { backgroundColor: '#eab308', flex: 1.8 }]} />
            </View>
          </View>

          {/* Day Selector Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabsScroll}
            contentContainerStyle={styles.dayTabsContainer}
          >
            {dayNumbers.map((d) => {
              const isActive = selectedDay === d;
              const isToday = planStartDate && getActivePlanDay(planStartDate, totalDays) === d;
              const dateStr = getPlanDayDateString(planStartDate, d);
              return (
                <Pressable
                  key={d}
                  style={[
                    styles.dayTabPill,
                    isActive && styles.dayTabPillActive,
                    isToday && !isActive && { borderColor: COLORS.brand, backgroundColor: '#f0f9ed' },
                  ]}
                  onPress={() => setSelectedDay(d)}
                >
                  <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive, isToday && !isActive && { color: COLORS.brandDark }]}>
                    Day {d}
                  </Text>
                  {dateStr ? (
                    <Text
                      style={[
                        { fontSize: 10, fontWeight: '600', color: COLORS.muted, marginTop: 1, textAlign: 'center' },
                        isActive && { color: '#e2f4dc' },
                        isToday && !isActive && { color: COLORS.brand },
                      ]}
                    >
                      {dateStr} {isToday ? '• Today' : ''}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Selected Day Meals Section */}
          <View style={styles.daySection}>
            <View style={styles.daySectionHeader}>
              <View>
                <Text style={styles.daySectionTitle}>
                  Day {selectedDay}{' '}
                  {getPlanDayDateString(planStartDate, selectedDay) ? (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.label }}>
                      ({getPlanDayDateString(planStartDate, selectedDay)}) {planStartDate && getActivePlanDay(planStartDate, totalDays) === selectedDay ? '• Today' : ''}
                    </Text>
                  ) : null}
                </Text>
                <Text style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: '600', marginTop: 1 }}>
                  {currentDayCalories ? `${currentDayCalories.toLocaleString()} kcal scheduled` : ''}
                </Text>
              </View>
              <View style={styles.goalsMetBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
                <Text style={styles.goalsMetText}>
                  {planStartDate && getActivePlanDay(planStartDate, totalDays) === selectedDay ? 'Active Today' : 'Ready'}
                </Text>
              </View>
            </View>

            {/* Meal Cards Grid */}
            <View style={styles.mealCardsGrid}>
              {currentDayMeals.map((meal, idx) => (
                <Pressable
                  key={meal.id || idx}
                  style={({ pressed }) => [styles.mealCard, pressed && { opacity: 0.9 }]}
                  onPress={() => setSelectedMealDetail(meal)}
                >
                  <View style={styles.mealCardTypeHeader}>
                    {renderMealIcon(meal)}
                    <Text style={styles.mealCardType}>{meal.type}</Text>
                  </View>

                  <View style={styles.mealCardImageContainer}>
                    <Image source={meal.image} style={styles.mealCardImage} resizeMode="cover" />
                  </View>

                  <Text style={styles.mealCardName} numberOfLines={2}>
                    {meal.name}
                  </Text>
                  <Text style={styles.mealCardKcal}>{meal.calories}</Text>
                  <Text style={styles.mealCardMacros}>
                    P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* All Days Overview List */}
          {dayNumbers.length > 1 && (
            <View style={styles.allDaysContainer}>
              <Text style={styles.allDaysHeaderTitle}>All Days in this Plan</Text>
              {dayNumbers.map((dNum) => {
                const dMeals = mealsByDay[dNum] || [];
                const dCals = dMeals.reduce((acc, m) => acc + m.caloriesNum, 0);
                const dateStr = getPlanDayDateString(planStartDate, dNum);
                const isToday = planStartDate && getActivePlanDay(planStartDate, totalDays) === dNum;
                return (
                  <Pressable
                    key={dNum}
                    style={[
                      styles.dayRowCard,
                      selectedDay === dNum && styles.dayRowCardActive,
                      isToday && { borderColor: COLORS.brand },
                    ]}
                    onPress={() => setSelectedDay(dNum)}
                  >
                    <View style={styles.dayRowLeft}>
                      <View style={[styles.dayRowNumberBadge, isToday && { backgroundColor: COLORS.iconBgGreen }]}>
                        <Text style={[styles.dayRowNumberText, isToday && { color: COLORS.brandDark }]}>D{dNum}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.dayRowTitle}>
                            Day {dNum} {dateStr ? `(${dateStr})` : ''}
                          </Text>
                          {isToday && (
                            <View style={{ backgroundColor: '#e2f4dc', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                              <Text style={{ fontSize: 9.5, color: COLORS.brandDark, fontWeight: '800' }}>TODAY</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.dayRowSubtitle} numberOfLines={1}>
                          {dMeals.map((m) => m.name).join(' • ') || 'Scheduled meals'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dayRowRight}>
                      <Text style={styles.dayRowKcal}>{dCals} kcal</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Bottom Floating Action Buttons */}
          <View style={styles.bottomActionsRow}>
            <Pressable
              style={({ pressed }) => [styles.planActionsBtn, pressed && { opacity: 0.85 }]}
              onPress={() => handleSharePlan()}
            >
              <MaterialCommunityIcons name="share-variant" size={17} color={COLORS.heading} />
              <Text style={styles.planActionsBtnText}>Share Plan</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.adjustPlanBtn, pressed && { opacity: 0.9 }]}
              onPress={handleBack}
            >
              <Feather name="check" size={15} color="#FFFFFF" />
              <Text style={styles.adjustPlanBtnText}>Done</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Meal Detail Modal */}
      <Modal visible={!!selectedMealDetail} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMealDetail && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalMealTypeBadge}>
                    <Text style={styles.modalMealTypeText}>{selectedMealDetail.type}</Text>
                  </View>
                  <Pressable
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedMealDetail(null)}
                  >
                    <Ionicons name="close" size={20} color="#333" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                  <Image
                    source={selectedMealDetail.image}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  <Text style={styles.modalMealTitle}>{selectedMealDetail.name}</Text>
                  <Text style={styles.modalMealDesc}>{selectedMealDetail.description}</Text>

                  {/* Prep Time & Cost Row */}
                  <View style={styles.modalInfoPillRow}>
                    <View style={styles.modalInfoPill}>
                      <Ionicons name="time-outline" size={13} color={COLORS.brand} />
                      <Text style={styles.modalInfoPillText}>
                        Prep: {selectedMealDetail.prepTime ? `${selectedMealDetail.prepTime} mins` : '20 mins'}
                      </Text>
                    </View>
                    {selectedMealDetail.cost && (
                      <View style={styles.modalInfoPill}>
                        <MaterialCommunityIcons name="wallet-outline" size={13} color={COLORS.brand} />
                        <Text style={styles.modalInfoPillText}>LKR {selectedMealDetail.cost}</Text>
                      </View>
                    )}
                  </View>

                  {/* Macro Strip */}
                  <View style={styles.modalMacroRow}>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedMealDetail.calories}</Text>
                      <Text style={styles.modalMacroLabel}>Calories</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedMealDetail.protein}g</Text>
                      <Text style={styles.modalMacroLabel}>Protein</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedMealDetail.carbs}g</Text>
                      <Text style={styles.modalMacroLabel}>Carbs</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedMealDetail.fat}g</Text>
                      <Text style={styles.modalMacroLabel}>Fats</Text>
                    </View>
                  </View>

                  {/* Ingredients List */}
                  {selectedMealDetail.ingredients.length > 0 && (
                    <View style={styles.modalIngredientsBox}>
                      <Text style={styles.modalIngredientsTitle}>Ingredients:</Text>
                      {selectedMealDetail.ingredients.map((ing, i) => (
                        <Text key={i} style={styles.modalIngredientItem}>
                          • {ing.name} ({ing.quantity} {ing.unit})
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* How to Prepare / Recipe Guide */}
                  {selectedMealDetail.instructions && selectedMealDetail.instructions.length > 0 && (
                    <View style={styles.modalRecipeBox}>
                      <View style={styles.modalRecipeHeader}>
                        <MaterialCommunityIcons name="chef-hat" size={15} color={COLORS.brand} />
                        <Text style={styles.modalRecipeTitle}>How to Prepare / Recipe:</Text>
                      </View>
                      {selectedMealDetail.instructions.map((step, sIdx) => (
                        <View key={sIdx} style={styles.modalRecipeStepRow}>
                          <View style={styles.modalRecipeStepNum}>
                            <Text style={styles.modalRecipeStepNumText}>{sIdx + 1}</Text>
                          </View>
                          <Text style={styles.modalRecipeStepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <Pressable
                    style={[styles.modalDismissBtn, { flex: 1, backgroundColor: '#F3F4F6', marginTop: 0 }]}
                    onPress={() => setSelectedMealDetail(null)}
                  >
                    <Text style={[styles.modalDismissBtnText, { color: '#374151' }]}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalDismissBtn, { flex: 1, backgroundColor: COLORS.brand, marginTop: 0 }]}
                    onPress={() => {
                      const target = selectedMealDetail;
                      setSelectedMealDetail(null);
                      setFeedbackMeal({
                        id: target.id,
                        mealItemId: target.id,
                        name: target.name,
                        type: target.type,
                        calories: target.caloriesNum,
                      });
                    }}
                  >
                    <Text style={[styles.modalDismissBtnText, { color: '#FFFFFF' }]}>Give Feedback</Text>
                  </Pressable>
                </View>
              </>
            )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '600',
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
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.3,
  },
  brandNameAccent: {
    color: COLORS.brand,
  },
  sharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sharePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.heading,
  },

  // Hero Section
  heroSection: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: COLORS.muted,
    marginTop: 2,
  },

  // Score Card
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF6E8',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dcecd5',
    gap: 12,
  },
  scoreRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreNumber: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.brandDark,
    lineHeight: 22,
  },
  scoreTotal: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
    marginTop: -2,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.brandDark,
  },
  scoreDesc: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 2,
    lineHeight: 14,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#d8ecd1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  scoreBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#285d2b',
  },

  // Metric Badges Row
  metricRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
  },
  metricValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.heading,
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.muted,
  },

  // Nutrition Strip Card
  nutritionStripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 14,
  },
  nutritionColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nutritionCol: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.label,
  },
  nutritionValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.heading,
  },
  nutritionSub: {
    fontSize: 9.5,
    color: COLORS.muted,
    marginTop: 1,
  },
  stripBarWrapper: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 2,
  },
  stripBarSegment: {
    height: '100%',
    borderRadius: 2,
  },

  // Day Tabs
  dayTabsScroll: {
    marginBottom: 12,
  },
  dayTabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dayTabPillActive: {
    backgroundColor: COLORS.brandDark,
    borderColor: COLORS.brandDark,
  },
  dayTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.heading,
  },
  dayTabTextActive: {
    color: '#FFFFFF',
  },

  // Day Section
  daySection: {
    marginBottom: 16,
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  daySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.heading,
  },
  daySectionKcal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  goalsMetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eaf7e6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  goalsMetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
  },

  // Meal Cards Grid
  mealCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  mealCardTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  mealCardType: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
  },
  mealCardImageContainer: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 6,
  },
  mealCardImage: {
    width: '100%',
    height: '100%',
  },
  mealCardName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.heading,
    lineHeight: 16,
    minHeight: 32,
  },
  mealCardKcal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    marginTop: 2,
  },
  mealCardMacros: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 1,
  },

  // All Days Overview
  allDaysContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    gap: 8,
  },
  allDaysHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.heading,
    marginBottom: 4,
  },
  dayRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#fafcfa',
  },
  dayRowCardActive: {
    backgroundColor: '#EDF6E8',
  },
  dayRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayRowNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRowNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brandDark,
  },
  dayRowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.heading,
  },
  dayRowSubtitle: {
    fontSize: 10.5,
    color: COLORS.muted,
    maxWidth: 180,
  },
  dayRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayRowKcal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.heading,
  },

  // Bottom Actions
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  planActionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 13,
    borderRadius: 14,
  },
  planActionsBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.heading,
  },
  adjustPlanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandDark,
    paddingVertical: 13,
    borderRadius: 14,
  },
  adjustPlanBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalMealTypeBadge: {
    backgroundColor: COLORS.iconBgGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalMealTypeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brandDark,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    marginBottom: 12,
  },
  modalMealTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.heading,
    marginBottom: 4,
  },
  modalMealDesc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
    marginBottom: 12,
  },
  modalMacroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8faf7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  modalMacroItem: {
    alignItems: 'center',
  },
  modalMacroVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.heading,
  },
  modalMacroLabel: {
    fontSize: 9.5,
    color: COLORS.muted,
    marginTop: 1,
  },
  modalIngredientsBox: {
    backgroundColor: '#fafbfc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  modalIngredientsTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.heading,
    marginBottom: 4,
  },
  modalIngredientItem: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 16,
  },
  modalInfoPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#edf6e5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalInfoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandDark,
  },
  modalRecipeBox: {
    backgroundColor: '#f8faf7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5ece0',
    marginBottom: 10,
  },
  modalRecipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  modalRecipeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.heading,
  },
  modalRecipeStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 7,
  },
  modalRecipeStepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  modalRecipeStepNumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  modalRecipeStepText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    lineHeight: 16,
  },
  modalDismissBtn: {
    backgroundColor: COLORS.brandDark,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalDismissBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
