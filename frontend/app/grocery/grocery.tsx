import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  chevron: '#9aa5b1',
  checkboxBorder: '#c3d1c0',
};

export type GroceryCategory =
  | 'Carbohydrates'
  | 'Proteins'
  | 'Vegetables'
  | 'Fruits'
  | 'Other';

export type GroceryItem = {
  id: string;
  name: string;
  amount: string;
  unit: string;
  price: number;
  category: GroceryCategory;
  image?: any;
  emoji?: string;
  purchased: boolean;
};

export function KemaMateGrocery({
  mealPlanId,
  onBack,
}: {
  mealPlanId?: string;
  onBack?: () => void;
} = {}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tobuy' | 'purchased'>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const categories: GroceryCategory[] = [
    'Carbohydrates',
    'Proteins',
    'Vegetables',
    'Fruits',
    'Other',
  ];

  // Helper to intelligently classify ingredients into the 5 categories
  function classifyCategory(rawCat: string, name: string): GroceryCategory {
    const c = (rawCat || '').toLowerCase();
    const n = (name || '').toLowerCase();

    // 1. Carbohydrates (rice, bread, flour, roti, oats, noodles, pittu, hoppers, potatoes, grains, paan)
    if (
      c.includes('grain') ||
      c.includes('bakery') ||
      c.includes('carb') ||
      n.includes('rice') ||
      n.includes('oat') ||
      n.includes('flour') ||
      n.includes('bread') ||
      n.includes('paan') ||
      n.includes('roti') ||
      n.includes('pittu') ||
      n.includes('hopper') ||
      n.includes('potato') ||
      n.includes('noodle') ||
      n.includes('quinoa') ||
      n.includes('pasta') ||
      n.includes('string hopper') ||
      n.includes('atta')
    ) {
      return 'Carbohydrates';
    }

    // 2. Proteins (chicken, meat, fish, tuna, egg, tofu, lentils, dhal, chickpeas, beef, pork, seafood, dairy, milk, curd, cheese)
    if (
      c.includes('protein') ||
      c.includes('meat') ||
      c.includes('seafood') ||
      c.includes('fish') ||
      c.includes('poultry') ||
      c.includes('dairy') ||
      n.includes('chicken') ||
      n.includes('fish') ||
      n.includes('tuna') ||
      n.includes('egg') ||
      n.includes('tofu') ||
      n.includes('beef') ||
      n.includes('pork') ||
      n.includes('dhal') ||
      n.includes('lentil') ||
      n.includes('chickpea') ||
      n.includes('kadala') ||
      n.includes('gram') ||
      n.includes('milk') ||
      n.includes('curd') ||
      n.includes('cheese') ||
      n.includes('paneer') ||
      n.includes('yogurt')
    ) {
      return 'Proteins';
    }

    // 3. Fruits (banana, papaya, mango, apple, avocado, orange, lime, lemon, watermelon, pineapple)
    if (
      c.includes('fruit') ||
      n.includes('banana') ||
      n.includes('papaya') ||
      n.includes('mango') ||
      n.includes('apple') ||
      n.includes('avocado') ||
      n.includes('orange') ||
      n.includes('lime') ||
      n.includes('lemon') ||
      n.includes('watermelon') ||
      n.includes('pineapple')
    ) {
      return 'Fruits';
    }

    // 4. Vegetables (cabbage, carrot, leek, spinach, broccoli, tomato, capsicum, gotukola, cucumber, onion, garlic, ginger, beans, coconut)
    if (
      c.includes('vegetable') ||
      c.includes('produce') ||
      c.includes('green') ||
      n.includes('cabbage') ||
      n.includes('carrot') ||
      n.includes('leek') ||
      n.includes('spinach') ||
      n.includes('broccoli') ||
      n.includes('tomato') ||
      n.includes('capsicum') ||
      n.includes('gotukola') ||
      n.includes('cucumber') ||
      n.includes('onion') ||
      n.includes('garlic') ||
      n.includes('ginger') ||
      n.includes('beans') ||
      n.includes('pepper') ||
      n.includes('chilli') ||
      n.includes('chili') ||
      n.includes('curry leaf') ||
      n.includes('coconut') ||
      n.includes('sambol') ||
      n.includes('brinjal') ||
      n.includes('pumpkin') ||
      n.includes('beetroot')
    ) {
      return 'Vegetables';
    }

    return 'Other';
  }

  const getEmojiForCategory = (cat: GroceryCategory, name: string) => {
    const n = name.toLowerCase();
    if (n.includes('rice')) return '🍚';
    if (n.includes('egg')) return '🥚';
    if (n.includes('chicken')) return '🍗';
    if (n.includes('fish') || n.includes('tuna')) return '🐟';
    if (n.includes('banana')) return '🍌';
    if (n.includes('bread') || n.includes('paan')) return '🍞';

    switch (cat) {
      case 'Carbohydrates':
        return '🍚';
      case 'Proteins':
        return '🥩';
      case 'Fruits':
        return '🍎';
      case 'Vegetables':
        return '🥬';
      default:
        return '🧂';
    }
  };

  // Load grocery list from backend
  useEffect(() => {
    async function loadGroceryList() {
      setIsLoading(true);
      try {
        let planIdToUse = mealPlanId;
        if (!planIdToUse) {
          const plansRes = await apiClient.get('/meal-plans');
          if (Array.isArray(plansRes.data) && plansRes.data.length > 0) {
            planIdToUse = plansRes.data[0].id;
          }
        }

        if (planIdToUse) {
          const res = await apiClient.get(`/grocery-list/plan/${planIdToUse}`);
          if (res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
            const mapped: GroceryItem[] = res.data.items.map((it: any, index: number) => {
              const itemName = it.ingredientName || it.name || 'Ingredient';
              const category = classifyCategory(it.category, itemName);

              return {
                id: String(index + 1),
                name: itemName,
                amount: String(it.quantity || 1),
                unit: it.unit || 'g',
                price: Math.round(Number(it.estimatedCostLkr || 30)),
                category: category,
                emoji: getEmojiForCategory(category, itemName),
                purchased: Boolean(it.purchased),
              };
            });
            setItems(mapped);
          } else {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } catch (err) {
        console.log('Error loading grocery list from backend:', err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadGroceryList();
  }, [mealPlanId]);

  const togglePurchased = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, purchased: !item.purchased } : item))
    );
  };

  const markAllPurchased = () => {
    setItems((prev) => prev.map((item) => ({ ...item, purchased: true })));
    Alert.alert('Grocery List', 'All items marked as purchased! 🎉');
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const totalItemsCount = items.length;
  const purchasedCount = items.filter((i) => i.purchased).length;
  const toBuyCount = totalItemsCount - purchasedCount;
  const totalCost = items.reduce((sum, item) => sum + item.price, 0);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeFilter === 'tobuy') return !item.purchased;
      if (activeFilter === 'purchased') return item.purchased;
      return true;
    });
  }, [items, searchQuery, activeFilter]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const getCategoryIcon = (cat: GroceryCategory) => {
    switch (cat) {
      case 'Carbohydrates':
        return <MaterialCommunityIcons name="rice" size={17} color={COLORS.brand} />;
      case 'Proteins':
        return <MaterialCommunityIcons name="food-drumstick" size={17} color={COLORS.brand} />;
      case 'Vegetables':
        return <MaterialCommunityIcons name="food-apple-outline" size={17} color={COLORS.brand} />;
      case 'Fruits':
        return <MaterialCommunityIcons name="fruit-cherries" size={17} color={COLORS.brand} />;
      default:
        return <MaterialCommunityIcons name="shaker-outline" size={17} color={COLORS.brand} />;
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
        {/* Top App Bar with Back, Logo & Avatar */}
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={COLORS.heading} />
          </Pressable>

          <View style={styles.brandMark}>
            <MaterialCommunityIcons name="leaf" size={22} color={COLORS.brand} />
          </View>

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

        {/* Heading & Subtitle */}
        <View style={styles.headingSection}>
          <Text style={styles.headingTitle}>Grocery List</Text>
          <Text style={styles.headingSubtitle}>
            Everything you need for healthy meals
          </Text>
        </View>

        {/* Total Estimated Cost Card */}
        <View style={styles.costCard}>
          <View style={styles.bagIconWrapper}>
            <MaterialCommunityIcons name="shopping" size={24} color={COLORS.brand} />
          </View>

          <View style={styles.costInfo}>
            <Text style={styles.costLabel}>Total Estimated Cost</Text>
            <View style={styles.costPriceRow}>
              <Text style={styles.costPrice}>LKR {totalCost}</Text>
              <Text style={styles.costBudget}> estimated</Text>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, (totalCost / 700) * 100)}%` }]} />
            </View>
          </View>

          {/* Cart Items Pill */}
          <View style={styles.cartItemsBadge}>
            <Ionicons name="cart-outline" size={17} color="#2e7d32" />
            <Text style={styles.cartItemsCount}>{totalItemsCount}</Text>
            <Text style={styles.cartItemsLabel}>items</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#9aa5b1" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#9aa5b1"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <MaterialCommunityIcons name="barcode-scan" size={20} color="#9aa5b1" />
        </View>

        {/* Filter Pills Row */}
        <View style={styles.filterRow}>
          {/* All Items */}
          <Pressable
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
              All Items
            </Text>
            <View style={[styles.filterCountBubble, activeFilter === 'all' && styles.filterCountBubbleActive]}>
              <Text style={[styles.filterCountText, activeFilter === 'all' && styles.filterCountTextActive]}>
                {totalItemsCount}
              </Text>
            </View>
          </Pressable>

          {/* To Buy */}
          <Pressable
            style={[styles.filterPill, activeFilter === 'tobuy' && styles.filterPillActive]}
            onPress={() => setActiveFilter('tobuy')}
          >
            <Text style={[styles.filterText, activeFilter === 'tobuy' && styles.filterTextActive]}>
              To Buy
            </Text>
            <View style={[styles.filterCountBubble, activeFilter === 'tobuy' && styles.filterCountBubbleActive]}>
              <Text style={[styles.filterCountText, activeFilter === 'tobuy' && styles.filterCountTextActive]}>
                {toBuyCount}
              </Text>
            </View>
          </Pressable>

          {/* Purchased */}
          <Pressable
            style={[styles.filterPill, activeFilter === 'purchased' && styles.filterPillActive]}
            onPress={() => setActiveFilter('purchased')}
          >
            <Text style={[styles.filterText, activeFilter === 'purchased' && styles.filterTextActive]}>
              Purchased
            </Text>
            <View style={[styles.filterCountBubble, activeFilter === 'purchased' && styles.filterCountBubbleActive]}>
              <Text style={[styles.filterCountText, activeFilter === 'purchased' && styles.filterCountTextActive]}>
                {purchasedCount}
              </Text>
            </View>
          </Pressable>

          {/* Filters Button */}
          <Pressable
            style={styles.filtersBtn}
            onPress={() => Alert.alert('Filters', 'Items grouped by nutritional category.')}
          >
            <MaterialCommunityIcons name="tune-variant" size={15} color={COLORS.heading} />
            <Text style={styles.filtersBtnText}>Filters</Text>
          </Pressable>
        </View>

        {/* Loading Indicator or Items Content */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading grocery list...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="shopping-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No grocery items found</Text>
            <Text style={styles.emptySubtitle}>Generate a meal plan to view your categorized grocery list.</Text>
          </View>
        ) : (
          /* Grouped Category Sections */
          categories.map((cat) => {
            const categoryItems = filteredItems.filter((i) => i.category === cat);
            if (categoryItems.length === 0) return null;

            const isCollapsed = collapsedCategories[cat];
            const catTotalCost = categoryItems.reduce((s, i) => s + i.price, 0);

            return (
              <View style={styles.categoryCard} key={cat}>
                {/* Category Header */}
                <Pressable
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(cat)}
                >
                  <View style={styles.categoryIconCircle}>
                    {getCategoryIcon(cat)}
                  </View>
                  <Text style={styles.categoryTitle}>{cat}</Text>
                  <Text style={styles.categoryMeta}>
                    {categoryItems.length} items • LKR {catTotalCost}
                  </Text>
                  <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color={COLORS.chevron}
                    style={{ marginLeft: 6 }}
                  />
                </Pressable>

                {/* Items List */}
                {!isCollapsed && (
                  <View style={styles.categoryItemsList}>
                    {categoryItems.map((item, index) => (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.itemRow,
                          index < categoryItems.length - 1 && styles.itemRowBorder,
                        ]}
                        onPress={() => togglePurchased(item.id)}
                      >
                        {/* Checkbox */}
                        <View style={[styles.checkbox, item.purchased && styles.checkboxChecked]}>
                          {item.purchased && (
                            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                          )}
                        </View>

                        {/* Image / Emoji */}
                        <View style={styles.itemImageWrapper}>
                          {item.image ? (
                            <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
                          ) : (
                            <Text style={styles.itemEmoji}>{item.emoji || '🥬'}</Text>
                          )}
                        </View>

                        {/* Name & Amount */}
                        <View style={styles.itemInfo}>
                          <Text
                            style={[
                              styles.itemName,
                              item.purchased && styles.itemNamePurchased,
                            ]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.itemAmount}>
                            {item.amount} {item.unit}
                          </Text>
                        </View>

                        {/* Price */}
                        <Text
                          style={[
                            styles.itemPrice,
                            item.purchased && styles.itemPricePurchased,
                          ]}
                        >
                          LKR {item.price}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Bottom Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrapper}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={17} color="#2e7d32" />
          </View>
          <View style={styles.tipTextWrapper}>
            <Text style={styles.tipTitle}>Smart Shopping Tip</Text>
            <Text style={styles.tipDesc}>
              Buying fresh produce at your local weekly market (Pola) can save up to 30% on groceries.
            </Text>
          </View>
        </View>

        {/* Action Button: Mark All as Purchased */}
        {items.length > 0 && !isLoading && (
          <Pressable
            style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.88 }]}
            onPress={markAllPurchased}
          >
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            <Text style={styles.markAllBtnText}>Mark All as Purchased</Text>
          </Pressable>
        )}
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
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Headings
  headingSection: {
    marginBottom: 14,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.4,
  },
  headingSubtitle: {
    fontSize: 12.5,
    color: COLORS.muted,
    marginTop: 2,
  },

  // Cost Card
  costCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bagIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  costInfo: {
    flex: 1,
  },
  costLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.muted,
  },
  costPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 1,
  },
  costPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2e7d32',
    letterSpacing: -0.3,
  },
  costBudget: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.muted,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#e6ede4',
    borderRadius: 2,
    marginTop: 6,
    width: '90%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#438e3b',
    borderRadius: 2,
  },
  cartItemsBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f8ed',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cartItemsCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2e7d32',
    marginTop: 1,
  },
  cartItemsLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.muted,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.heading,
    paddingVertical: 0,
  },

  // Filter Pills
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: '#2e6b35',
    borderColor: '#2e6b35',
  },
  filterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.muted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterCountBubble: {
    backgroundColor: '#f0f5ee',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterCountBubbleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2e6b35',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  filtersBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.heading,
  },

  // Loading & Empty states
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

  // Category Cards
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.heading,
    flex: 1,
  },
  categoryMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  categoryItemsList: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5ef',
    paddingTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f7faf5',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.checkboxBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#438e3b',
    borderColor: '#438e3b',
  },
  itemImageWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemEmoji: {
    fontSize: 18,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.heading,
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
    color: '#9aa5b1',
  },
  itemAmount: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2e7d32',
  },
  itemPricePurchased: {
    color: '#9aa5b1',
  },

  // Tip Card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf6e5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbe8d6',
    marginTop: 4,
    marginBottom: 12,
    gap: 10,
  },
  tipIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextWrapper: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#285d2b',
  },
  tipDesc: {
    fontSize: 11,
    color: '#4b6348',
    marginTop: 1,
    lineHeight: 14.5,
  },

  // Mark All Button
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandButton,
    borderRadius: 16,
    height: 46,
    gap: 8,
    shadowColor: COLORS.brandButton,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  markAllBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default KemaMateGrocery;
