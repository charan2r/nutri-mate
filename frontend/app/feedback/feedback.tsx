import React, { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '@/lib/api-client';
import { showToast } from '@/lib/toast-store';

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
  activeChoiceBg: '#f0f7ec',
  activeChoiceBorder: '#76b83d',
  starActive: '#76b83d',
  starInactive: '#d1d5db',
};

const reasonsList = [
  { id: 'spicy', label: 'Too spicy', emoji: '🌶️' },
  { id: 'expensive', label: 'Too expensive', emoji: '💸' },
  { id: 'hard_prep', label: 'Hard to prepare', emoji: '⏱️' },
  { id: 'unavailable', label: 'Unavailable ingredients', emoji: '🥬' },
  { id: 'small_portion', label: 'Portion too small', emoji: '🥣' },
];

export function KemaMateFeedback({
  meal,
  onBack,
}: {
  meal?: {
    id?: string;
    mealItemId?: string;
    name?: string;
    type?: string;
    calories?: number;
  } | null;
  onBack?: () => void;
} = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    mealItemId?: string;
    name?: string;
    mealName?: string;
    type?: string;
    mealType?: string;
    calories?: string;
    mealCalories?: string;
  }>();

  const mealItemId =
    meal?.mealItemId ||
    meal?.id ||
    params.mealItemId ||
    params.id ||
    null;

  const mealName =
    meal?.name ||
    params.mealName ||
    params.name ||
    'Healthy Meal';

  const mealType =
    meal?.type ||
    params.mealType ||
    params.type ||
    'Meal';

  const mealCalories =
    meal?.calories ||
    (params.mealCalories
      ? Number(params.mealCalories)
      : params.calories
      ? Number(params.calories)
      : 520);

  // Feedback Form States
  const [liked, setLiked] = useState<boolean | null>(true);
  const [rating, setRating] = useState<number>(4);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleReason = (id: string) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return 'Excellent';
      case 4:
        return 'Great';
      case 3:
        return 'Good';
      case 2:
        return 'Fair';
      case 1:
        return 'Needs improvement';
      default:
        return '';
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/feedback', {
        mealItemId: mealItemId && !mealItemId.startsWith('meal-') ? mealItemId : undefined,
        mealName,
        mealType,
        liked,
        rating,
        reasons: selectedReasons,
        comment,
      });

      showToast('Feedback submitted! Your preferences will guide future plans.', 'success');

      if (onBack) {
        onBack();
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit feedback. Please try again.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
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
        {/* Top App Bar with Back & Brand */}
        <View style={styles.topBar}>
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
          <View style={{ width: 34 }} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Feedback{' '}
            <MaterialCommunityIcons name="sprout" size={22} color={COLORS.brand} />
          </Text>
          <Text style={styles.heroSubtitle}>
            Help us improve your meal experience.
          </Text>
        </View>

        {/* Meal Summary Card */}
        <View style={styles.mealSummaryCard}>
          <View style={styles.mealImageWrapper}>
            <Image
              source={
                mealName.includes('Berry')
                  ? require('@/assets/images/food1.png')
                  : mealName.includes('Salmon')
                  ? require('@/assets/images/food3.png')
                  : require('@/assets/images/food2.png')
              }
              style={styles.mealImage}
              resizeMode="cover"
            />
            <View style={styles.mealTimeBadge}>
              {mealType === 'Dinner' ? (
                <Ionicons name="moon" size={12} color="#8b5cf6" />
              ) : mealType === 'Breakfast' ? (
                <Feather name="sun" size={13} color={COLORS.brand} />
              ) : (
                <Ionicons name="sunny-outline" size={13} color="#f59e0b" />
              )}
            </View>
          </View>

          <View style={styles.mealInfo}>
            <Text style={styles.mealTypeTag}>{mealType}</Text>
            <Text style={styles.mealTitle}>{mealName}</Text>
            <Text style={styles.mealMeta}>{mealCalories} kcal • High Protein</Text>
          </View>
        </View>

        {/* Question 1: Enjoy meal? */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionQuestion}>Did you enjoy this meal?</Text>
          </View>

          <View style={styles.choiceRow}>
            {/* Yes */}
            <Pressable
              style={[
                styles.choiceBtn,
                liked === true && styles.choiceBtnActive,
              ]}
              onPress={() => setLiked(true)}
            >
              <Text style={styles.choiceEmoji}>👍</Text>
              <Text
                style={[
                  styles.choiceText,
                  liked === true && styles.choiceTextActive,
                ]}
              >
                Yes, I enjoyed it
              </Text>
            </Pressable>

            {/* No */}
            <Pressable
              style={[
                styles.choiceBtn,
                liked === false && styles.choiceBtnActive,
              ]}
              onPress={() => setLiked(false)}
            >
              <Text style={styles.choiceEmoji}>👎</Text>
              <Text
                style={[
                  styles.choiceText,
                  liked === false && styles.choiceTextActive,
                ]}
              >
                No, not really
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Question 2: Star Rating */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionQuestionPlain}>
            How would you rate this meal?
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= rating;
              return (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  hitSlop={6}
                  style={styles.starTouch}
                >
                  <Ionicons
                    name={isFilled ? 'star' : 'star-outline'}
                    size={36}
                    color={isFilled ? COLORS.starActive : COLORS.starInactive}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
        </View>

        {/* Question 3: Reasons */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionQuestionPlain}>
            Why did you rate it this way?{' '}
            <Text style={styles.optionalText}>(Select all that apply)</Text>
          </Text>

          <View style={styles.reasonsGrid}>
            {reasonsList.map((r) => {
              const isSelected = selectedReasons.includes(r.id);
              return (
                <Pressable
                  key={r.id}
                  style={[
                    styles.reasonPill,
                    isSelected && styles.reasonPillActive,
                  ]}
                  onPress={() => toggleReason(r.id)}
                >
                  <Text style={styles.reasonEmoji}>{r.emoji}</Text>
                  <Text
                    style={[
                      styles.reasonText,
                      isSelected && styles.reasonTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Question 4: Additional comments */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionQuestionPlain}>
            Additional comments{' '}
            <Text style={styles.optionalText}>(optional)</Text>
          </Text>

          <View style={styles.commentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your thoughts about this meal..."
              placeholderTextColor="#9aa5b1"
              multiline
              numberOfLines={3}
              maxLength={250}
              value={comment}
              onChangeText={setComment}
            />
            <Text style={styles.charCounter}>{comment.length}/250</Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && { opacity: 0.9 },
            isSubmitting && { opacity: 0.75 },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </Pressable>

        {/* Thank You Footer */}
        <View style={styles.thankYouRow}>
          <Ionicons name="heart" size={14} color={COLORS.brand} />
          <Text style={styles.thankYouText}>
            Thank you! Your feedback helps Kema Mate AI grow.
          </Text>
        </View>
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
    marginBottom: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.iconBgGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.4,
  },
  brandNameAccent: {
    color: COLORS.brand,
    fontWeight: '900',
  },

  // Hero Section
  heroSection: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.heading,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },

  // Meal Summary Card
  mealSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 10,
    gap: 12,
    marginBottom: 16,
    shadowColor: '#1a3319',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  mealImageWrapper: {
    width: 90,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealTimeBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealTypeTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.heading,
    marginVertical: 2,
  },
  mealMeta: {
    fontSize: 11.5,
    color: COLORS.muted,
  },

  // Section Blocks
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  sectionQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.heading,
  },
  sectionQuestionPlain: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.heading,
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
  },

  // Question 1 Choices
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  choiceBtnActive: {
    backgroundColor: COLORS.activeChoiceBg,
    borderColor: COLORS.activeChoiceBorder,
  },
  choiceEmoji: {
    fontSize: 15,
  },
  choiceText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
  },
  choiceTextActive: {
    color: COLORS.brandDark,
    fontWeight: '700',
  },

  // Star Rating
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  starTouch: {
    padding: 2,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.brand,
    marginTop: 4,
  },

  // Reasons Grid
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  reasonPillActive: {
    backgroundColor: COLORS.iconBgGreen,
    borderColor: COLORS.brand,
  },
  reasonEmoji: {
    fontSize: 13,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.heading,
  },
  reasonTextActive: {
    color: COLORS.brandDark,
    fontWeight: '700',
  },

  // Comment Box
  commentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 10,
    minHeight: 84,
  },
  commentInput: {
    fontSize: 13,
    color: COLORS.heading,
    textAlignVertical: 'top',
    flex: 1,
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 10.5,
    color: COLORS.muted,
    marginTop: 4,
  },

  // Submit Button
  submitButton: {
    backgroundColor: COLORS.brandButton,
    borderRadius: 18,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
    shadowColor: COLORS.brandButton,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Thank You Row
  thankYouRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 2,
  },
  thankYouText: {
    fontSize: 11.5,
    color: COLORS.muted,
    fontWeight: '500',
  },
});

export default KemaMateFeedback;
