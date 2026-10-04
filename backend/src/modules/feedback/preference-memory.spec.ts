import { preferenceMemory } from './preference-memory';

describe('Preference memory', () => {
  it('lets a later positive opinion replace an old dislike', () => {
    const rows: any = [
      {
        mealName: 'Dhal curry',
        liked: false,
        updatedAt: '2026-10-01',
        reasonTags: ['spicy'],
      },
      {
        mealName: 'Dhal curry',
        liked: true,
        updatedAt: '2026-10-04',
        reasonTags: [],
      },
    ];
    expect(preferenceMemory(rows)).toEqual({
      likedMeals: ['Dhal curry'],
      dislikedMeals: [],
      feedbackNotes: [],
    });
  });
  it('supports current and legacy reason tags', () => {
    const rows: any = [
      {
        mealName: 'Fish curry',
        rating: 2,
        reasonTags: ['too_expensive'],
        createdAt: '2026-10-04',
      },
    ];
    expect(preferenceMemory(rows).feedbackNotes[0]).toContain('economical');
    expect(preferenceMemory(rows).dislikedMeals).toEqual(['Fish curry']);
  });
});
