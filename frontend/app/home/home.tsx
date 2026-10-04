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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { showToast } from '@/lib/toast-store';
import {
  getActivePlanDay,
  getPlanDayDateString,
  parseYMD,
} from '@/lib/date-utils';
import { KemaMateGenerate } from '../generate/generate';
import { KemaMatePlan } from '../plan/plan';
import { KemaMateGrocery } from '../grocery/grocery';
import { KemaMateFeedback } from '../feedback/feedback';
import { KemaMateHistory } from '../history/history';
import { KemaMateReplace } from '../replace/replace';

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
  iconBgBlue: '#e3f2fd',
  iconColorBlue: '#0288d1',
  bannerBg: '#e7f3e4',
  bannerBorder: '#d8e8d2',
  progressTrack: '#e8efe6',
  chevron: '#9aa5b1',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
};

const FOOD_IMAGES = [
  require('@/assets/images/food1.png'),
  require('@/assets/images/food2.png'),
  require('@/assets/images/food3.png'),
  require('@/assets/images/food4.png'),
  require('@/assets/images/food5.png'),
  require('@/assets/images/food6.png'),
];

type TodayMeal = {
  id: string;
  type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number | null;
  prepTime: number | null;
  description?: string;
  ingredients?: Array<{ name: string; quantity: number; unit: string }>;
  instructions?: string[];
  image: any;
};

export function KemaMateHome() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'home' | 'plans' | 'grocery' | 'profile'>('home');
  const [showPlanDetail, setShowPlanDetail] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState<boolean>(false);
  const [selectedMealForDetail, setSelectedMealForDetail] = useState<TodayMeal | null>(null);
  const [selectedMealForReplace, setSelectedMealForReplace] = useState<any | null>(null);
  const [selectedMealForFeedback, setSelectedMealForFeedback] = useState<{
    id?: string;
    mealItemId?: string;
    name: string;
    type: string;
    calories: number;
  } | null>(null);

  // Dynamic Dashboard State
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);
  const [dailyBudget, setDailyBudget] = useState<number>(2000);
  const [proteinTarget, setProteinTarget] = useState<number>(100);
  const [userGoal, setUserGoal] = useState<string>('Weight Gain');
  const [userDiet, setUserDiet] = useState<string>('High Protein');
  const [latestPlan, setLatestPlan] = useState<any>(null);
  const [currentActiveDay, setCurrentActiveDay] = useState<number>(1);
  const [planTotalDays, setPlanTotalDays] = useState<number>(3);
  const [todaysMeals, setTodaysMeals] = useState<TodayMeal[]>([]);
  const [completedMealIds, setCompletedMealIds] = useState<{ [id: string]: boolean }>({});
  const [groceryCount, setGroceryCount] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  async function loadDashboardData() {
    setIsLoadingData(true);
    try {
      const [profileRes, prefRes, plansRes] = await Promise.allSettled([
        apiClient.get('/profile'),
        apiClient.get('/preferences'),
        apiClient.get('/meal-plans'),
      ]);

      let targetCal = 2000;
      let targetBud = 2000;
      let targetProt = 100;

      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        const p = profileRes.value.data;
        if (p.dailyCalorieTarget) {
          targetCal = Math.round(Number(p.dailyCalorieTarget));
        }
        if (p.goal) {
          const goalMap: { [k: string]: string } = {
            weight_loss: 'Weight Loss',
            lose_weight: 'Weight Loss',
            gain_weight: 'Weight Gain',
            muscle_gain: 'Muscle Gain',
            maintenance: 'Weight Management',
            general_health: 'General Health',
          };
          setUserGoal(goalMap[p.goal] || p.goal.replace(/_/g, ' '));
        }
      }

      if (prefRes.status === 'fulfilled' && prefRes.value.data) {
        const pr = prefRes.value.data;
        if (pr.dailyBudget != null) {
          targetBud = Math.round(Number(pr.dailyBudget));
        }
        if (pr.dailyCalorieTarget) {
          targetCal = Math.round(Number(pr.dailyCalorieTarget));
        }
        if (pr.dietType) {
          setUserDiet(pr.dietType.charAt(0).toUpperCase() + pr.dietType.slice(1));
        }
      }

      setCalorieTarget(targetCal);
      setDailyBudget(targetBud);

      let foundActivePlan = false;

      if (
        plansRes.status === 'fulfilled' &&
        Array.isArray(plansRes.value.data) &&
        plansRes.value.data.length > 0
      ) {
        // Iterate to find the plan currently active today (not expired, not future)
        for (const planSummary of plansRes.value.data) {
          if (!['validated', 'active'].includes(planSummary.status)) continue;
          try {
            const detailRes = await apiClient.get(`/meal-plans/${planSummary.id}`);
            const planDetail = detailRes.data;

            if (planDetail) {
              const items: any[] = planDetail.items || planDetail.mealItems || [];
              let maxDay = 0;
              items.forEach((it: any) => {
                const d = Number(it.day) || 1;
                if (d > maxDay) maxDay = d;
              });

              let dateDuration = 0;
              if (planDetail.startDate && planDetail.endDate) {
                const s = parseYMD(planDetail.startDate);
                const e = parseYMD(planDetail.endDate);
                if (s && e) {
                  const sUtc = Date.UTC(s.year, s.month, s.date);
                  const eUtc = Date.UTC(e.year, e.month, e.date);
                  if (eUtc >= sUtc) {
                    dateDuration = Math.round((eUtc - sUtc) / (1000 * 60 * 60 * 24)) + 1;
                  }
                }
              }

              const planDuration = Math.max(maxDay, dateDuration, 1);
              const activeDay = getActivePlanDay(planDetail.startDate, planDuration);

             
              if (activeDay !== null) {
                foundActivePlan = true;
                setLatestPlan(planDetail);
                setCurrentActiveDay(activeDay);
                setPlanTotalDays(planDuration);

               
                const todaysDayItems = items.filter((it: any) => Number(it.day) === activeDay && it.status !== 'replaced');
                const mealsToShow = todaysDayItems.length > 0 ? todaysDayItems : items.filter((it: any) => it.status !== 'replaced').slice(0, 3);

                const formatted: TodayMeal[] = mealsToShow.map((it: any, idx: number) => {
                  const snap = it.generatedMealSnapshot || it.meal || {};
                  const mealType = it.mealType || snap.mealType || 'lunch';
                  const capType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
                  const cals = Math.round(Number(it.caloriesSnapshot ?? snap.calories ?? 500));
                  const prot = Math.round(Number(it.proteinSnapshot ?? snap.protein ?? 30));
                  const carbs = Math.round(Number(it.carbsSnapshot ?? snap.carbs ?? 60));
                  const fat = Math.round(Number(it.fatSnapshot ?? snap.fat ?? 15));
                  const cost = it.estimatedCostSnapshot ?? snap.estimatedCostLkr ?? null;
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
                            `Rinse and prepare fresh ingredients for ${snap.name || it.name || 'this dish'}.`,
                            `Heat pan or clay pot with a small amount of oil, temper aromatics and spices.`,
                            `Combine main ingredients and simmer gently until cooked thoroughly.`,
                            `Season to taste and serve fresh with recommended portions.`,
                          ];

                  return {
                    id: it.id || `meal-${idx}`,
                    type: capType,
                    name: snap.name || it.name || 'Sri Lankan Meal',
                    calories: cals,
                    protein: prot,
                    carbs,
                    fat,
                    cost: cost ? Math.round(Number(cost)) : null,
                    prepTime,
                    description: snap.description || snap.name || 'Balanced nutritious meal',
                    ingredients: Array.isArray(snap.ingredients) ? snap.ingredients : [],
                    instructions,
                    image: FOOD_IMAGES[idx % FOOD_IMAGES.length],
                  };
                });

                // Initialize completed meal statuses from database
                const initialCompletedMap: { [id: string]: boolean } = {};
                mealsToShow.forEach((it: any) => {
                  if (it.id && it.status === 'completed') {
                    initialCompletedMap[it.id] = true;
                  }
                });
                setCompletedMealIds(initialCompletedMap);

                setTodaysMeals(formatted);

                // Compute protein target from meals if available
                const totalDayProtein = formatted.reduce((sum, m) => sum + m.protein, 0);
                if (totalDayProtein > 0) setProteinTarget(totalDayProtein);

                // Check if grocery list exists
                if (planDetail.groceryList?.items) {
                  setGroceryCount(planDetail.groceryList.items.length);
                }

                // Stop at the first currently active plan
                break;
              }
            }
          } catch (err) {
            console.log('Error fetching plan items detail:', err);
          }
        }
      }

      // If no plan is active today (all expired or empty), clear active state so user sees empty state
      if (!foundActivePlan) {
        setLatestPlan(null);
        setTodaysMeals([]);
        setGroceryCount(0);
      }
    } catch (err) {
      console.log('Error loading dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const toggleMealComplete = async (id: string) => {
    const willBeCompleted = !completedMealIds[id];

    // Optimistically update UI
    setCompletedMealIds((prev) => ({ ...prev, [id]: willBeCompleted }));

    try {
      await apiClient.patch(`/meal-items/${id}/toggle`);
      if (willBeCompleted) {
        showToast('Meal marked as eaten! Calories & progress updated.', 'success');
      } else {
        showToast('Meal marked as pending.', 'info');
      }
    } catch (err) {
      console.log('Error toggling meal item status:', err);
      // Revert optimistic state
      setCompletedMealIds((prev) => ({ ...prev, [id]: !willBeCompleted }));
      showToast('Could not update meal status. Please check your connection.', 'error');
    }
  };

  const openFeedbackForMeal = (meal: TodayMeal) => {
    setSelectedMealForFeedback({
      id: meal.id,
      mealItemId: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
    });
    setShowFeedback(true);
  };

  const handleLogout = async () => {
    setShowProfileDrawer(false);
    await logout();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  };

  const rawName = user?.name?.trim() || user?.email?.split('@')[0] || 'User';
  const capitalizedUserName =
    rawName.charAt(0).toUpperCase() + rawName.slice(1);

  // Dynamic calculations based on checked meals
  const completedList = todaysMeals.filter((m) => completedMealIds[m.id]);
  const completedCount = completedList.length;
  const totalCount = todaysMeals.length || 3;

  const caloriesConsumed = completedList.reduce((sum, m) => sum + m.calories, 0);
  const proteinConsumed = completedList.reduce((sum, m) => sum + m.protein, 0);
  const budgetSpent = completedList.reduce((sum, m) => sum + (m.cost || 0), 0);

  const caloriePercent = Math.min(
    100,
    Math.round((caloriesConsumed / (calorieTarget || 2000)) * 100)
  );
  const caloriesRemaining = Math.max(0, calorieTarget - caloriesConsumed);

  if (selectedMealForReplace) {
    return (
      <KemaMateReplace
        currentMeal={selectedMealForReplace}
        onBack={() => setSelectedMealForReplace(null)}
        onMealReplaced={() => {
          setSelectedMealForReplace(null);
          setSelectedMealForDetail(null);
          setActiveTab('home');
          loadDashboardData();
        }}
      />
    );
  }

  if (showFeedback) {
    return (
      <KemaMateFeedback
        meal={selectedMealForFeedback}
        onBack={() => setShowFeedback(false)}
      />
    );
  }

  if (showHistory) {
    return (
      <KemaMateHistory
        onBack={() => {
          setShowHistory(false);
          loadDashboardData();
        }}
        onNavigateHome={() => {
          setShowHistory(false);
          setActiveTab('home');
        }}
        onNavigateGrocery={() => {
          setShowHistory(false);
          setActiveTab('grocery');
        }}
        onNavigateProfile={() => {
          setShowHistory(false);
          setShowProfileDrawer(true);
        }}
      />
    );
  }

  if (showPlanDetail) {
    return (
      <KemaMatePlan
        planId={latestPlan?.id}
        planData={latestPlan}
        onBack={() => {
          setShowPlanDetail(false);
          loadDashboardData();
        }}
      />
    );
  }

  if (activeTab === 'plans') {
    return (
      <KemaMateGenerate
        onBack={() => {
          setActiveTab('home');
          loadDashboardData();
        }}
      />
    );
  }

  if (activeTab === 'grocery') {
    return (
      <KemaMateGrocery
        mealPlanId={latestPlan?.id}
        onBack={() => setActiveTab('home')}
      />
    );
  }

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
        {/* Top Header / App Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons name="leaf" size={22} color={COLORS.brand} />
            </View>
            <Text style={styles.brandName}>
              Kema Mate <Text style={styles.brandNameAccent}>AI</Text>
            </Text>
          </View>

          <View style={styles.topActions}>
            <Pressable
              style={styles.bellButton}
              onPress={() => loadDashboardData()}
            >
              <Ionicons
                name="refresh-outline"
                size={19}
                color={COLORS.heading}
              />
            </Pressable>

            {/* Clickable Profile Avatar */}
            <Pressable
              style={styles.avatarWrapper}
              onPress={() => setShowProfileDrawer(true)}
              hitSlop={8}
            >
              <Image
                source={require('@/assets/images/boy.png')}
                style={styles.avatarImage}
              />
            </Pressable>
          </View>
        </View>

        {/* Greeting Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            {getGreeting()}, {capitalizedUserName}{' '}
          </Text>
          <Text style={styles.heroSubtitle}>
            {latestPlan ? 'Here are your personalized meals for today.' : 'Ready to generate your first healthy meal plan?'}
          </Text>
        </View>

        {/* Main Calorie Progress Card */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieLeft}>
            <View style={styles.calorieHeaderRow}>
              <MaterialCommunityIcons name="fire" size={20} color={COLORS.brand} />
              <Text style={styles.calorieHeaderTitle}>Calories</Text>
            </View>

            <View style={styles.calorieNumbersRow}>
              <Text style={styles.calorieCurrent}>{caloriesConsumed.toLocaleString()}</Text>
              <Text style={styles.calorieTarget}> / {calorieTarget.toLocaleString()} kcal</Text>
            </View>

            {/* Horizontal Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${caloriePercent}%` }]} />
            </View>

            <Text style={styles.calorieRemaining}>
              {caloriesRemaining.toLocaleString()} kcal remaining today
            </Text>
          </View>

          {/* Right Circular Progress Ring */}
          <View style={styles.ringContainer}>
            <View style={styles.ringOuter}>
              <Text style={styles.ringPercent}>{caloriePercent}%</Text>
              <Text style={styles.ringLabel}>consumed</Text>
            </View>
          </View>
        </View>

        {/* 3-Stat Cards Row */}
        <View style={styles.statsRow}>
          {/* Budget */}
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.85 }]}
            onPress={() => Alert.alert('Daily Budget', `Spent LKR ${budgetSpent} of LKR ${dailyBudget} target.`)}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: COLORS.iconBgGreen }]}>
              <MaterialCommunityIcons name="wallet-outline" size={18} color={COLORS.iconColorGreen} />
            </View>
            <View style={styles.statCopy}>
              <Text style={styles.statLabel}>Budget</Text>
              <Text style={styles.statValue}>LKR {budgetSpent}</Text>
              <Text style={styles.statDetail}>of LKR {dailyBudget}</Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color={COLORS.chevron} style={styles.statChevron} />
          </Pressable>

          {/* Meals */}
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.85 }]}
            onPress={() => Alert.alert('Meals Progress', `${completedCount} of ${totalCount} meals logged today.`)}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: COLORS.iconBgBlue }]}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={17} color={COLORS.iconColorBlue} />
            </View>
            <View style={styles.statCopy}>
              <Text style={styles.statLabel}>Meals</Text>
              <Text style={styles.statValue}>
                {completedCount} <Text style={{ fontSize: 11, fontWeight: '500' }}>of</Text> {totalCount}
              </Text>
              <Text style={styles.statDetail}>completed</Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color={COLORS.chevron} style={styles.statChevron} />
          </Pressable>

          {/* Protein */}
          <Pressable
            style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.85 }]}
            onPress={() => Alert.alert('Protein Intake', `${proteinConsumed}g of ${proteinTarget}g daily protein target.`)}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: COLORS.iconBgGreen }]}>
              <MaterialCommunityIcons name="arm-flex" size={17} color={COLORS.iconColorGreen} />
            </View>
            <View style={styles.statCopy}>
              <Text style={styles.statLabel}>Protein</Text>
              <Text style={styles.statValue}>{proteinConsumed}g</Text>
              <Text style={styles.statDetail}>of {proteinTarget}g</Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color={COLORS.chevron} style={styles.statChevron} />
          </Pressable>
        </View>

        {/* Dynamic Plan Banner */}
        {latestPlan ? (
          <Pressable
            style={({ pressed }) => [styles.generateBanner, pressed && { opacity: 0.92 }]}
            onPress={() => setShowPlanDetail(true)}
          >
            <View style={styles.bannerLeft}>
              <View style={styles.planScorePill}>
                <Ionicons name="sparkles" size={11} color="#285d2b" />
                <Text style={styles.planScoreText}>
                  Day {currentActiveDay} of {planTotalDays} • AI Score {latestPlan.qualityScore ?? 0}/100
                </Text>
              </View>
              <Text style={styles.bannerTitle}>Active Meal Plan</Text>
              <Text style={styles.bannerSubtitle}>
                {getPlanDayDateString(latestPlan.startDate, currentActiveDay) ? `${getPlanDayDateString(latestPlan.startDate, currentActiveDay)} (Today)` : 'Current Plan'} • Tap to view full plan & recipes
              </Text>
            </View>

            <View style={styles.bannerGraphicWrapper}>
              <Image
                source={require('@/assets/images/nutrio-salad.png')}
                style={styles.bannerSalad}
                resizeMode="cover"
              />
            </View>

            <View style={styles.bannerArrowBtn}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.generateBanner, pressed && { opacity: 0.92 }]}
            onPress={() => setActiveTab('plans')}
          >
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerTitle}>Generate Meal Plan</Text>
              <Text style={styles.bannerSubtitle}>
                Personalized meals,{'\n'}goals and grocery list.
              </Text>
            </View>

            <View style={styles.bannerGraphicWrapper}>
              <Image
                source={require('@/assets/images/nutrio-salad.png')}
                style={styles.bannerSalad}
                resizeMode="cover"
              />
            </View>

            <View style={styles.bannerArrowBtn}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </Pressable>
        )}

        {/* Today's Meals Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
            {latestPlan && (
              <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '500', marginTop: 2 }}>
                Day {currentActiveDay} of {planTotalDays} {getPlanDayDateString(latestPlan.startDate, currentActiveDay) ? `(${getPlanDayDateString(latestPlan.startDate, currentActiveDay)})` : ''}
              </Text>
            )}
          </View>
          {latestPlan && (
            <Pressable onPress={() => setShowPlanDetail(true)}>
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          )}
        </View>

        {/* Today's Meals Cards Grid (Dynamic from DB) */}
        {todaysMeals.length > 0 ? (
          <View style={styles.mealsGrid}>
            {todaysMeals.map((meal) => {
              const isChecked = !!completedMealIds[meal.id];
              return (
                <View key={meal.id} style={styles.mealCard}>
                  <Pressable
                    style={styles.mealImageContainer}
                    onPress={() => setSelectedMealForDetail(meal)}
                  >
                    <Image
                      source={meal.image}
                      style={styles.mealImage}
                      resizeMode="cover"
                    />
                    <View
                      style={[
                        styles.mealTimeBadge,
                        meal.type.toLowerCase() === 'breakfast'
                          ? { backgroundColor: '#eef8eb' }
                          : meal.type.toLowerCase() === 'dinner'
                          ? { backgroundColor: '#f3e8ff' }
                          : { backgroundColor: '#fffbeb' },
                      ]}
                    >
                      {meal.type.toLowerCase() === 'breakfast' ? (
                        <Feather name="sun" size={13} color={COLORS.brand} />
                      ) : meal.type.toLowerCase() === 'dinner' ? (
                        <Ionicons name="moon" size={12} color="#8b5cf6" />
                      ) : (
                        <Ionicons name="sunny-outline" size={14} color="#f59e0b" />
                      )}
                    </View>
                  </Pressable>

                  <View style={styles.mealCardBody}>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => setSelectedMealForDetail(meal)}
                    >
                      <Text style={styles.mealTypeName}>{meal.type}</Text>
                      <Text style={styles.mealDishName} numberOfLines={1}>
                        {meal.name}
                      </Text>
                      <Text style={styles.mealKcalText}>{meal.calories} kcal</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => toggleMealComplete(meal.id)}
                      hitSlop={8}
                    >
                      {isChecked ? (
                        <View style={styles.checkCircleCompleted}>
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.checkCirclePending} />
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={COLORS.brand} />
            <Text style={styles.emptyStateTitle}>No meal plan active</Text>
            <Text style={styles.emptyStateSubtitle}>
              Tap below to create your personalized 3-day meal plan with recipes and ingredients.
            </Text>
            <Pressable
              style={styles.emptyStateButton}
              onPress={() => setActiveTab('plans')}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.emptyStateButtonText}>Generate Plan</Text>
            </Pressable>
          </View>
        )}

        {/* Grocery Preview Card */}
        <Pressable
          style={({ pressed }) => [styles.groceryCard, pressed && { opacity: 0.9 }]}
          onPress={() => setActiveTab('grocery')}
        >
          <View style={styles.groceryIconWrapper}>
            <MaterialCommunityIcons name="shopping" size={20} color={COLORS.iconColorGreen} />
          </View>

          <View style={styles.groceryCopy}>
            <Text style={styles.groceryTitle}>Grocery List</Text>
            <Text style={styles.grocerySubtitle}>
              {groceryCount > 0 ? `${groceryCount} ingredients consolidated from your meals` : 'View and check off ingredients for your plan'}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={COLORS.chevron} />
        </Pressable>
      </ScrollView>

      {/* Bottom Floating Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          {/* 1. Home */}
          <Pressable
            style={styles.navItem}
            onPress={() => {
              setActiveTab('home');
              setShowPlanDetail(false);
            }}
          >
            <Ionicons
              name={activeTab === 'home' && !showPlanDetail ? 'home' : 'home-outline'}
              size={20}
              color={activeTab === 'home' && !showPlanDetail ? COLORS.brand : COLORS.muted}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'home' && !showPlanDetail && styles.navLabelActive,
              ]}
            >
              Home
            </Text>
          </Pressable>

          {/* 2. Plan */}
          <Pressable
            style={styles.navItem}
            onPress={() => {
              if (latestPlan) {
                setShowPlanDetail(true);
              } else {
                setActiveTab('plans');
              }
            }}
          >
            <Ionicons
              name={showPlanDetail ? 'calendar' : 'calendar-outline'}
              size={20}
              color={showPlanDetail ? COLORS.brand : COLORS.muted}
            />
            <Text
              style={[
                styles.navLabel,
                showPlanDetail && styles.navLabelActive,
              ]}
            >
              Plans
            </Text>
          </Pressable>

          {/* 3. Grocery */}
          <Pressable
            style={styles.navItem}
            onPress={() => setActiveTab('grocery')}
          >
            <Ionicons
              name="cart-outline"
              size={20}
              color={COLORS.muted}
            />
            <Text style={styles.navLabel}>
              Grocery
            </Text>
          </Pressable>

          {/* 4. Profile / Logout Drawer */}
          <Pressable
            style={styles.navItem}
            onPress={() => setShowProfileDrawer(true)}
          >
            <Ionicons
              name={showProfileDrawer ? 'person' : 'person-outline'}
              size={20}
              color={showProfileDrawer ? COLORS.brand : COLORS.muted}
            />
            <Text
              style={[
                styles.navLabel,
                showProfileDrawer && styles.navLabelActive,
              ]}
            >
              Profile
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Account / Profile Drawer Modal */}
      <Modal visible={showProfileDrawer} transparent animationType="slide">
        <Pressable
          style={styles.drawerOverlay}
          onPress={() => setShowProfileDrawer(false)}
        >
          <Pressable
            style={styles.drawerContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.drawerHandle} />

            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>My Account</Text>
              <Pressable
                style={styles.drawerCloseBtn}
                onPress={() => setShowProfileDrawer(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.heading} />
              </Pressable>
            </View>

            {/* User Info Card */}
            <View style={styles.profileUserCard}>
              <View style={styles.profileAvatarLarge}>
                <Image
                  source={require('@/assets/images/boy.png')}
                  style={styles.avatarImage}
                />
              </View>
              <View style={styles.profileUserInfo}>
                <Text style={styles.profileUserName} numberOfLines={1} ellipsizeMode="tail">
                  {capitalizedUserName}
                </Text>
                <Text style={styles.profileUserEmail} numberOfLines={1} ellipsizeMode="tail">
                  {user?.email || 'user@kemamate.local'}
                </Text>
                <View style={styles.profileStatusBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.profileStatusText}>Active</Text>
                </View>
              </View>
            </View>

            {/* Profile Nutrition Stats */}
            <View style={styles.profileStatsBox}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatVal} numberOfLines={1} ellipsizeMode="tail">
                  {calorieTarget} kcal
                </Text>
                <Text style={styles.profileStatLabel} numberOfLines={1}>
                  Target Cal
                </Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatVal} numberOfLines={1} ellipsizeMode="tail">
                  LKR {dailyBudget}
                </Text>
                <Text style={styles.profileStatLabel} numberOfLines={1}>
                  Daily Budget
                </Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatVal} numberOfLines={1} ellipsizeMode="tail">
                  {userGoal}
                </Text>
                <Text style={styles.profileStatLabel} numberOfLines={1}>
                  Goal
                </Text>
              </View>
            </View>

            {/* Quick Actions List */}
            <View style={styles.profileActionsList}>
              <Pressable
                style={({ pressed }) => [styles.profileActionRow, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setShowProfileDrawer(false);
                  setShowHistory(true);
                }}
              >
                <View style={[styles.actionIconBg, { backgroundColor: COLORS.iconBgGreen }]}>
                  <Feather name="calendar" size={17} color={COLORS.brand} />
                </View>
                <Text style={styles.actionRowText}>Plan History</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.profileActionRow, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setShowProfileDrawer(false);
                  setActiveTab('plans');
                }}
              >
                <View style={[styles.actionIconBg, { backgroundColor: COLORS.iconBgGreen }]}>
                  <Ionicons name="sparkles" size={17} color={COLORS.brand} />
                </View>
                <Text style={styles.actionRowText}>Generate New Meal Plan</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.profileActionRow, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  loadDashboardData();
                  showToast('Dashboard nutrition data refreshed!', 'success');
                }}
              >
                <View style={[styles.actionIconBg, { backgroundColor: COLORS.iconBgBlue }]}>
                  <Ionicons name="sync-outline" size={17} color={COLORS.iconColorBlue} />
                </View>
                <Text style={styles.actionRowText}>Refresh Nutrition Data</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.profileActionRow, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setShowProfileDrawer(false);
                  useAuthStore.setState({ isOnboarded: false });
                }}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="options-outline" size={17} color="#d97706" />
                </View>
                <Text style={styles.actionRowText}>Edit Health Preferences</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.chevron} />
              </Pressable>
            </View>

            {/* Logout Button */}
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.85 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Meal Detail & Recipe Modal */}
      <Modal visible={!!selectedMealForDetail} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMealForDetail && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalMealTypeBadge}>
                    <Text style={styles.modalMealTypeText}>{selectedMealForDetail.type}</Text>
                  </View>
                  <Pressable
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedMealForDetail(null)}
                  >
                    <Ionicons name="close" size={20} color="#333" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                  <Image
                    source={selectedMealForDetail.image}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  <Text style={styles.modalMealTitle}>{selectedMealForDetail.name}</Text>
                  <Text style={styles.modalMealDesc}>{selectedMealForDetail.description}</Text>

                  {/* Prep Time & Cost Row */}
                  <View style={styles.modalInfoPillRow}>
                    <View style={styles.modalInfoPill}>
                      <Ionicons name="time-outline" size={13} color={COLORS.brand} />
                      <Text style={styles.modalInfoPillText}>
                        Prep: {selectedMealForDetail.prepTime ? `${selectedMealForDetail.prepTime} mins` : '20 mins'}
                      </Text>
                    </View>
                    {selectedMealForDetail.cost && (
                      <View style={styles.modalInfoPill}>
                        <MaterialCommunityIcons name="wallet-outline" size={13} color={COLORS.brand} />
                        <Text style={styles.modalInfoPillText}>LKR {selectedMealForDetail.cost}</Text>
                      </View>
                    )}
                  </View>

                  {/* Macro Strip */}
                  <View style={styles.modalMacroRow}>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedMealForDetail.calories}</Text>
                      <Text style={styles.modalMacroLabel}>Calories</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedMealForDetail.protein}g</Text>
                      <Text style={styles.modalMacroLabel}>Protein</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedMealForDetail.carbs}g</Text>
                      <Text style={styles.modalMacroLabel}>Carbs</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedMealForDetail.fat}g</Text>
                      <Text style={styles.modalMacroLabel}>Fats</Text>
                    </View>
                  </View>

                  {/* Ingredients List */}
                  {selectedMealForDetail.ingredients && selectedMealForDetail.ingredients.length > 0 && (
                    <View style={styles.modalIngredientsBox}>
                      <Text style={styles.modalIngredientsTitle}>Ingredients:</Text>
                      {selectedMealForDetail.ingredients.map((ing, i) => (
                        <Text key={i} style={styles.modalIngredientItem}>
                          • {ing.name} ({ing.quantity} {ing.unit})
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* How to Prepare / Recipe Guide */}
                  {selectedMealForDetail.instructions && selectedMealForDetail.instructions.length > 0 && (
                    <View style={styles.modalRecipeBox}>
                      <View style={styles.modalRecipeHeader}>
                        <MaterialCommunityIcons name="chef-hat" size={15} color={COLORS.brand} />
                        <Text style={styles.modalRecipeTitle}>How to Prepare / Recipe:</Text>
                      </View>
                      {selectedMealForDetail.instructions.map((step, sIdx) => (
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

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  <Pressable
                    style={[styles.modalDismissBtn, { flex: 1, backgroundColor: '#F3F4F6', marginTop: 0 }]}
                    onPress={() => setSelectedMealForDetail(null)}
                  >
                    <Text style={[styles.modalDismissBtnText, { color: '#374151' }]}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalDismissBtn,
                      {
                        flex: 1.2,
                        backgroundColor: '#edf6e5',
                        borderWidth: 1,
                        borderColor: '#cde4c2',
                        marginTop: 0,
                      },
                    ]}
                    onPress={() => {
                      const target = selectedMealForDetail;
                      setSelectedMealForDetail(null);
                      setSelectedMealForReplace(target);
                    }}
                  >
                    <Text style={[styles.modalDismissBtnText, { color: '#285d2b' }]}>Replace Meal</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalDismissBtn, { flex: 1.2, backgroundColor: COLORS.brand, marginTop: 0 }]}
                    onPress={() => {
                      const target = selectedMealForDetail;
                      setSelectedMealForDetail(null);
                      openFeedbackForMeal(target);
                    }}
                  >
                    <Text style={[styles.modalDismissBtnText, { color: '#FFFFFF' }]}>Feedback</Text>
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
    paddingBottom: 90,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.3,
  },
  brandNameAccent: {
    color: COLORS.brand,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.brand,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },

  // Hero Section
  heroSection: {
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },

  // Calorie Card
  calorieCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  calorieLeft: {
    flex: 1,
    marginRight: 12,
  },
  calorieHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  calorieHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.muted,
  },
  calorieNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  calorieCurrent: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.heading,
  },
  calorieTarget: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: 3,
  },
  calorieRemaining: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3.5,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6fbf4',
  },
  ringPercent: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.brandDark,
  },
  ringLabel: {
    fontSize: 8.5,
    color: COLORS.muted,
    fontWeight: '600',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statCopy: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.muted,
  },
  statValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.heading,
    marginTop: 1,
  },
  statDetail: {
    fontSize: 9.5,
    color: COLORS.muted,
    marginTop: 1,
  },
  statChevron: {
    marginTop: 4,
  },

  // Generate Banner
  generateBanner: {
    backgroundColor: COLORS.bannerBg,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.bannerBorder,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bannerLeft: {
    flex: 1,
  },
  planScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d8ecd1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  planScoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#285d2b',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brandDark,
    lineHeight: 20,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    color: '#4b5563',
    marginTop: 3,
    lineHeight: 15,
  },
  bannerGraphicWrapper: {
    width: 55,
    height: 55,
    marginHorizontal: 8,
  },
  bannerSalad: {
    width: '100%',
    height: '100%',
  },
  bannerArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.brandButton,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.heading,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.brand,
  },

  // Meals Grid
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  mealCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  mealImageContainer: {
    width: '100%',
    height: 85,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealTimeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTypeName: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.muted,
  },
  mealDishName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.heading,
    lineHeight: 16,
    marginTop: 1,
  },
  mealKcalText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    marginTop: 2,
  },
  checkCirclePending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#FFFFFF',
  },
  checkCircleCompleted: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State Card
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.heading,
    marginTop: 8,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brandDark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 14,
  },
  emptyStateButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Grocery Card
  groceryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  groceryIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groceryCopy: {
    flex: 1,
  },
  groceryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.heading,
  },
  grocerySubtitle: {
    fontSize: 11.5,
    color: COLORS.muted,
    marginTop: 2,
  },

  // Bottom Floating Bar
  bottomNavContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '90%',
    maxWidth: 420,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },

  // Profile Drawer Modal Styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  drawerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  drawerHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.heading,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7faf5',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
    gap: 12,
    width: '100%',
    overflow: 'hidden',
  },
  profileAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.brand,
    flexShrink: 0,
  },
  profileUserInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  profileUserName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.heading,
  },
  profileUserEmail: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  profileStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22c55e',
  },
  profileStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brandDark,
  },
  profileStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'space-between',
    marginBottom: 14,
    width: '100%',
    gap: 6,
    overflow: 'hidden',
  },
  profileStatItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  profileStatVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.heading,
    textAlign: 'center',
    maxWidth: '100%',
  },
  profileStatLabel: {
    fontSize: 9.5,
    color: COLORS.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  profileActionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    width: '100%',
    overflow: 'hidden',
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
    width: '100%',
  },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.heading,
    minWidth: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerBg,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    width: '100%',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
  },

  // Meal Detail Modal
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
    marginBottom: 12,
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
