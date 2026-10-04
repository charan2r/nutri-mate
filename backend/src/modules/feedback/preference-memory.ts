import type { Feedback } from './entities/feedback.entity';
import type { UserFeedbackContext } from '../meal-plan/meal-plan.service';

// Latest explicit opinion wins for each dish; positive and negative memories cannot conflict.
export function preferenceMemory(feedbacks: Feedback[]): UserFeedbackContext {
  const latest = new Map<string, Feedback>();
  for (const feedback of [...feedbacks].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime(),
  )) {
    const key = feedback.mealName?.trim().toLowerCase();
    if (key && !latest.has(key)) latest.set(key, feedback);
  }
  const likedMeals: string[] = [],
    dislikedMeals: string[] = [],
    feedbackNotes: string[] = [];
  const adjustments: Record<string, string> = {
    spicy: 'Use milder seasoning',
    too_spicy: 'Use milder seasoning',
    expensive: 'Prefer economical ingredients',
    too_expensive: 'Prefer economical ingredients',
    hard_prep: 'Prefer simpler preparation',
    hard_to_prepare: 'Prefer simpler preparation',
    unavailable: 'Use readily available local ingredients',
    unavailable_ingredients: 'Use readily available local ingredients',
    small_portion: 'Review portion size while keeping daily targets',
    portion_too_small: 'Review portion size while keeping daily targets',
  };
  for (const feedback of latest.values()) {
    if (
      feedback.liked === false ||
      (feedback.liked == null &&
        feedback.rating != null &&
        feedback.rating <= 2)
    )
      dislikedMeals.push(feedback.mealName);
    else if (
      feedback.liked === true ||
      (feedback.liked == null &&
        feedback.rating != null &&
        feedback.rating >= 4)
    )
      likedMeals.push(feedback.mealName);
    for (const tag of feedback.reasonTags || [])
      if (adjustments[tag])
        feedbackNotes.push(`${adjustments[tag]} (${feedback.mealName})`);
    if (feedback.comment?.trim())
      feedbackNotes.push(
        `Feedback about ${feedback.mealName}: ${feedback.comment.trim()}`,
      );
  }
  return {
    likedMeals,
    dislikedMeals,
    feedbackNotes: [...new Set(feedbackNotes)],
  };
}
