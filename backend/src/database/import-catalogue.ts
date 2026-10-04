import 'dotenv/config';
import { readFileSync } from 'node:fs';
import dataSource from './data-source';
import { Meal as DatabaseMeal } from '../modules/meal/entities/meal.entity';
import { parseMeal } from '../modules/ai/meal-contract';

// Administrative CLI only. Review nutrition references and observed local prices before importing.
async function main() {
  const path = process.argv[2];
  if (!path)
    throw new Error('Usage: npm run catalogue:import -- path/to/meals.json');
  const records = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(records) || !records.length)
    throw new Error('Provide a nonempty array of meals');
  const rows = records.map((record: any) => {
    const meal = parseMeal(record);
    const verified = record.nutritionVerificationStatus === 'verified';
    if (
      verified &&
      (!record.nutritionSource?.trim() ||
        !record.nutritionSourceReference?.trim() ||
        record.reviewedByCurator !== true)
    )
      throw new Error(
        `${meal.name}: verified records need source, reference, and explicit curator review`,
      );
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(record.priceObservedOn || '') ||
      !Number.isFinite(Date.parse(record.priceObservedOn))
    )
      throw new Error(`${meal.name}: provide priceObservedOn (YYYY-MM-DD)`);
    return {
      name: meal.name,
      mealType: meal.mealType,
      description: meal.description,
      recipe: meal.instructions.join('\n'),
      ingredients: meal.ingredients,
      allergens: meal.allergens,
      dietTags: meal.dietTags,
      cuisineType: record.cuisineType || 'Sri Lankan',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      prepTimeMinutes: meal.prepTimeMinutes,
      estimatedCostLkr: meal.estimatedCostLkr,
      sourceType: 'curated',
      nutritionVerificationStatus: verified ? 'verified' : 'unverified',
      nutritionSource: record.nutritionSource || null,
      nutritionSourceReference: record.nutritionSourceReference
        ? `${record.nutritionSourceReference}; price observed ${record.priceObservedOn}`
        : null,
      verifiedAt: verified ? new Date() : null,
      isActive: true,
    };
  });
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(DatabaseMeal);
      for (const row of rows) {
        const existing = await repo.findOne({
          where: { name: row.name, mealType: row.mealType },
        });
        await repo.save(repo.create({ ...existing, ...row }));
      }
    });
    process.stdout.write(
      `Imported ${rows.length} catalogue meals. Only source-backed, reviewed records are eligible for verified planning.\n`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch(() => {
  process.stderr.write(
    'Catalogue import failed. Check the JSON, source references, curator review, dates, and database configuration.\n',
  );
  process.exitCode = 1;
});
