import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
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
import { isPlanActiveToday, parseYMD } from '@/lib/date-utils';
import { KemaMatePlan } from '../plan/plan';

const COLORS = {
  brand: '#438e3b',
  brandDark: '#285d2b',
  brandButton: '#2e6b35',
  brandActive: '#2e6b35',
  screenBg: '#f7faf5',
  cardBg: '#ffffff',
  cardBorder: '#e2ece0',
  heading: '#18202a',
  muted: '#7c8ba0',
  label: '#7c8490',
  iconBgGreen: '#edf6e5',
  iconColorGreen: '#438e3b',
  iconBgBlue: '#e0f2fe',
  iconColorBlue: '#0284c7',
  chevron: '#9aa5b1',
};

export type HistoryPlanItem = {
  id: string;
  dateRange: string;
  qualityScore: number;
  qualityLabel: string;
  calories: string;
  estimatedCost: string;
  mealsCompleted: string;
  status: 'Completed' | 'Active' | 'Saved' | 'Archived';
  statusColor: string;
  statusBg: string;
  iconBg: string;
  rawPlan?: any;
};

export function KemaMateHistory({
  onBack,
  onNavigateHome,
  onNavigateGrocery,
  onNavigateProfile,
}: {
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigateGrocery?: () => void;
  onNavigateProfile?: () => void;
} = {}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<HistoryPlanItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All Plans' | 'Completed' | 'Active' | 'Saved'>('All Plans');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch real meal plans from backend API
  async function loadPlanHistory(showLoader = true) {
    if (showLoader) setIsLoading(true);
    try {
      const res = await apiClient.get('/meal-plans');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: HistoryPlanItem[] = res.data.map((p: any, idx: number) => {
          const score = p.qualityScore ? Math.round(Number(p.qualityScore)) : 88;
          let qualityLabel = 'Good';
          if (score >= 90) qualityLabel = 'Excellent';
          else if (score >= 82) qualityLabel = 'Very Good';
          else if (score >= 70) qualityLabel = 'Good';
          else qualityLabel = 'Balanced';

          let startStr = '';
          let endStr = '';

          const sParsed = parseYMD(p.startDate);
          const eParsed = parseYMD(p.endDate);

          if (sParsed) {
            const sDate = new Date(sParsed.year, sParsed.month, sParsed.date);
            startStr = sDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
          } else if (p.createdAt) {
            const sDate = new Date(p.createdAt);
            startStr = sDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
          } else {
            startStr = 'Meal Plan';
          }

          if (eParsed) {
            const eDate = new Date(eParsed.year, eParsed.month, eParsed.date);
            endStr = eDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
          } else if (sParsed) {
            const eDate = new Date(sParsed.year, sParsed.month, sParsed.date + 6);
            endStr = eDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
          } else if (p.createdAt) {
            const eDate = new Date(new Date(p.createdAt).getTime() + 6 * 24 * 60 * 60 * 1000);
            endStr = eDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
          } else {
            endStr = new Date().getFullYear().toString();
          }

          // Check if plan is active today
          const activeToday = isPlanActiveToday(p.startDate, 7);
          let status: 'Completed' | 'Active' | 'Saved' | 'Archived' = 'Completed';

          if (p.status === 'active' || activeToday) {
            status = 'Active';
          } else if (p.status === 'archived') {
            status = 'Archived';
          } else {
            status = 'Completed';
          }

          const totalMeals = Number(p.itemCount || 0);
          const completedMeals = status === 'Completed' ? totalMeals : Math.max(0, Math.round(totalMeals * 0.85));

          return {
            id: p.id || `plan-${idx}`,
            dateRange: `${startStr} – ${endStr}`,
            qualityScore: score,
            qualityLabel: qualityLabel,
            calories: `${Math.round(Number(p.totalCalories || 0)).toLocaleString()} kcal`,
            estimatedCost: `₹${Math.round(Number(p.estimatedCostLkr || 0))}`,
            mealsCompleted: `${completedMeals} of ${totalMeals}`,
            status: status,
            statusColor: status === 'Active' ? '#0284c7' : status === 'Completed' ? '#2e7d32' : '#6b7280',
            statusBg: status === 'Active' ? '#e0f2fe' : status === 'Completed' ? '#eef8eb' : '#f3f4f6',
            iconBg: status === 'Active' ? '#e0f2fe' : COLORS.iconBgGreen,
            rawPlan: p,
          };
        });
        setPlans(mapped);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.log('Error loading meal plan history:', err);
      setPlans([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPlanHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPlanHistory(false);
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

  // Filter and search
  const filteredPlans = plans.filter((p) => {
    // Tab filter
    if (activeFilter === 'Completed' && p.status !== 'Completed') return false;
    if (activeFilter === 'Active' && p.status !== 'Active') return false;
    if (activeFilter === 'Saved' && p.status !== 'Saved') return false;

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchRange = p.dateRange.toLowerCase().includes(q);
      const matchScore = p.qualityScore.toString().includes(q);
      const matchStatus = p.status.toLowerCase().includes(q);
      const matchCals = p.calories.toLowerCase().includes(q);
      if (!matchRange && !matchScore && !matchStatus && !matchCals) {
        return false;
      }
    }

    return true;
  });

  if (selectedPlanId) {
    return (
      <KemaMatePlan
        planId={selectedPlanId}
        onBack={() => {
          setSelectedPlanId(null);
          loadPlanHistory(false);
        }}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.brand}
            colors={[COLORS.brand]}
          />
        }
      >
        {/* Top Header App Bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={COLORS.heading} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.brandTitleRow}>
              <MaterialCommunityIcons name="sprout" size={18} color={COLORS.brand} />
              <Text style={styles.headerTitle}>Plan History</Text>
            </View>
            <Text style={styles.headerSubtitle}>View and manage your past meal plans</Text>
          </View>

          <View style={styles.topActions}>
            <Pressable
              style={styles.bellButton}
              onPress={() => Alert.alert('Notifications', 'You have no new plan alerts.')}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.heading} />
              <View style={styles.notificationDot} />
            </Pressable>

            <Pressable
              style={styles.avatarWrapper}
              onPress={() => onNavigateProfile ? onNavigateProfile() : Alert.alert('Profile', `Signed in as ${user?.email || 'Charan'}`)}
            >
              <Image
                source={require('@/assets/images/boy.png')}
                style={styles.avatarImage}
              />
            </Pressable>
          </View>
        </View>

        {/* Search Bar with Tune / Filter Icon */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search plans by date, quality, or calories..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={COLORS.muted} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.tuneButton}
            onPress={() => {
              const filters: ('All Plans' | 'Completed' | 'Active' | 'Saved')[] = ['All Plans', 'Completed', 'Active', 'Saved'];
              const nextIdx = (filters.indexOf(activeFilter) + 1) % filters.length;
              setActiveFilter(filters[nextIdx]);
            }}
          >
            <Ionicons name="options-outline" size={20} color={COLORS.brand} />
          </Pressable>
        </View>

        {/* Filter Pills Horizontal List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterPillsScroll}
          contentContainerStyle={styles.filterPillsContent}
        >
          {(['All Plans', 'Completed', 'Active', 'Saved'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* History Cards List */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading your meal plan history...</Text>
          </View>
        ) : filteredPlans.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={36} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No meal plans found</Text>
            <Text style={styles.emptySubtitle}>Try changing your search or generate a new meal plan.</Text>
          </View>
        ) : (
          filteredPlans.map((plan) => (
            <View style={styles.historyCard} key={plan.id}>
              {/* Top Row: Calendar Icon, Date Range & Status Badge */}
              <View style={styles.cardHeaderRow}>
                <View style={[styles.calendarIconSquare, { backgroundColor: plan.iconBg }]}>
                  <Feather name="calendar" size={19} color={plan.statusColor} />
                </View>

                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardDateTitle}>{plan.dateRange}</Text>
                  <View style={styles.scoreSubRow}>
                    <MaterialCommunityIcons name="sprout" size={13} color={COLORS.brand} />
                    <Text style={styles.qualityScoreLabel}>Quality Score</Text>
                  </View>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreValue}>{plan.qualityScore}%</Text>
                    <Text style={styles.scoreQualityText}> {plan.qualityLabel}</Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: plan.statusBg }]}>
                  {plan.status === 'Completed' ? (
                    <Ionicons name="checkmark-circle" size={13} color="#2e7d32" />
                  ) : plan.status === 'Active' ? (
                    <Ionicons name="play-circle" size={13} color="#0284c7" />
                  ) : (
                    <MaterialCommunityIcons name="archive-outline" size={13} color="#6b7280" />
                  )}
                  <Text style={[styles.statusBadgeText, { color: plan.statusColor }]}>
                    {plan.status}
                  </Text>
                </View>
              </View>

              {/* 3 Stats Strip */}
              <View style={styles.statsStrip}>
                {/* Calories */}
                <View style={styles.statCol}>
                  <View style={styles.statIconCircle}>
                    <MaterialCommunityIcons name="fire" size={14} color={COLORS.brand} />
                  </View>
                  <View style={styles.statColText}>
                    <Text style={styles.statColLabel}>Calories</Text>
                    <Text style={styles.statColValue}>{plan.calories}</Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                {/* Est Cost */}
                <View style={styles.statCol}>
                  <View style={styles.statIconCircle}>
                    <MaterialCommunityIcons name="wallet-outline" size={14} color={COLORS.brand} />
                  </View>
                  <View style={styles.statColText}>
                    <Text style={styles.statColLabel}>Est. Cost</Text>
                    <Text style={styles.statColValue}>{plan.estimatedCost}</Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                {/* Meals */}
                <View style={styles.statCol}>
                  <View style={[styles.statIconCircle, { backgroundColor: COLORS.iconBgBlue }]}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={13} color={COLORS.iconColorBlue} />
                  </View>
                  <View style={styles.statColText}>
                    <Text style={styles.statColLabel}>Meals</Text>
                    <Text style={styles.statColValue}>{plan.mealsCompleted}</Text>
                  </View>
                </View>
              </View>

              {/* View Plan Action Button */}
              <Pressable
                style={({ pressed }) => [styles.viewPlanBtn, pressed && { opacity: 0.88 }]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                <Text style={styles.viewPlanBtnText}>View Plan</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Home */}
        <Pressable
          style={styles.navItem}
          onPress={() => onNavigateHome ? onNavigateHome() : handleBack()}
        >
          <Ionicons name="home-outline" size={20} color={COLORS.label} />
          <Text style={styles.navText}>Home</Text>
        </Pressable>

        {/* Plans (Active) */}
        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="calendar" size={20} color={COLORS.brand} />
          <Text style={[styles.navText, styles.navTextActive]}>Plans</Text>
        </Pressable>

        {/* Grocery */}
        <Pressable
          style={styles.navItem}
          onPress={() => onNavigateGrocery ? onNavigateGrocery() : handleBack()}
        >
          <MaterialCommunityIcons name="shopping-outline" size={20} color={COLORS.label} />
          <Text style={styles.navText}>Grocery</Text>
        </Pressable>

        {/* Profile */}
        <Pressable
          style={styles.navItem}
          onPress={() => onNavigateProfile ? onNavigateProfile() : handleBack()}
        >
          <Ionicons name="person-outline" size={20} color={COLORS.label} />
          <Text style={styles.navText}>Profile</Text>
        </Pressable>
      </View>
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
    marginBottom: 14,
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

  // Search & Filter
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.heading,
    paddingVertical: 0,
  },
  tuneButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Pills
  filterPillsScroll: {
    marginBottom: 14,
  },
  filterPillsContent: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterPillActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.muted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  // Loading & Empty
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '500',
  },
  emptyCard: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.heading,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  },

  // History Card
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  calendarIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardDateTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.2,
  },
  scoreSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  qualityScoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 1,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2e7d32',
  },
  scoreQualityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Stats Strip
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fcf8',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  statCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statColText: {
    flex: 1,
  },
  statColLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.muted,
  },
  statColValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.heading,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e6ede4',
    marginHorizontal: 4,
  },

  // View Plan Button
  viewPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandButton,
    borderRadius: 14,
    height: 40,
    gap: 6,
  },
  viewPlanBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  arrowCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navItemActive: {},
  navText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 3,
  },
  navTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
});

export default KemaMateHistory;
