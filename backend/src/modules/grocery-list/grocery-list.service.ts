/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GroceryList } from './entities/grocery-list.entity';

export interface GroceryItem {
  ingredientName: string;
  quantity: number;
  unit: string;
  category: string;
  estimatedCostLkr: number | null;
  purchased: boolean;
}

export interface MealWithIngredients {
  name: string;
  servings: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  estimatedCostLkr?: number;
}

const CATEGORY_MAPPINGS: Record<string, string[]> = {
  'Grains & Bakery': [
    'rice',
    'red rice',
    'white rice',
    'basmati',
    'samba',
    'nadu',
    'bread',
    'roti',
    'chapati',
    'string hopper',
    'string hoppers',
    'hopper',
    'hoppers',
    'pittu',
    'flour',
    'wheat flour',
    'rice flour',
    'kurakkan',
    'noodles',
    'pasta',
    'oats',
  ],
  'Fresh Vegetables & Produce': [
    'dhal',
    'lentil',
    'lentils',
    'onion',
    'onions',
    'red onion',
    'garlic',
    'ginger',
    'tomato',
    'tomatoes',
    'potato',
    'potatoes',
    'carrot',
    'carrots',
    'beans',
    'green beans',
    'cabbage',
    'leeks',
    'brinjal',
    'eggplant',
    'aubergine',
    'gotukola',
    'mukunuwenna',
    'kankun',
    'spinach',
    'greens',
    'cucumber',
    'pumpkin',
    'beetroot',
    'okra',
    'ladies finger',
    'drumstick',
    'ash plantain',
    'green chili',
    'green chilli',
    'chilli',
    'capsicum',
  ],
  'Proteins & Seafood': [
    'chicken',
    'egg',
    'eggs',
    'fish',
    'tuna',
    'salmon',
    'sprats',
    'prawn',
    'prawns',
    'shrimp',
    'crab',
    'squid',
    'cuttlefish',
    'beef',
    'pork',
    'mutton',
    'lamb',
    'soya',
    'soya meat',
    'tofu',
  ],
  'Dairy & Alternatives': [
    'milk',
    'coconut milk',
    'coconut',
    'scraped coconut',
    'curd',
    'yogurt',
    'yoghurt',
    'butter',
    'cheese',
    'paneer',
    'ghee',
  ],
  'Spices & Condiments': [
    'curry powder',
    'raw curry powder',
    'roasted curry powder',
    'chili powder',
    'chilli powder',
    'turmeric',
    'turmeric powder',
    'mustard',
    'mustard seeds',
    'fenugreek',
    'cumin',
    'cumin seeds',
    'cinnamon',
    'cardamom',
    'clove',
    'cloves',
    'curry leaves',
    'karapincha',
    'rampe',
    'pandan',
    'goraka',
    'tamarind',
    'lime',
    'salt',
    'black pepper',
    'pepper',
  ],
  'Pantry & Oils': [
    'oil',
    'coconut oil',
    'vegetable oil',
    'sugar',
    'tea',
    'coffee',
    'vinegar',
  ],
  Fruits: [
    'banana',
    'papaya',
    'mango',
    'pineapple',
    'apple',
    'orange',
    'avocado',
    'watermelon',
    'guava',
  ],
};

@Injectable()
export class GroceryListService {
  constructor(
    @InjectRepository(GroceryList)
    private readonly groceryListRepository: Repository<GroceryList>,
  ) {}

  async generateForPlan(
    mealPlanId: string,
    meals: MealWithIngredients[],
    manager?: EntityManager,
  ): Promise<GroceryList> {
    const repo = manager
      ? manager.getRepository(GroceryList)
      : this.groceryListRepository;

    const items = this.aggregateIngredients(meals);
    const costsKnown = meals.every(
      (meal) =>
        typeof meal.estimatedCostLkr === 'number' &&
        Number.isFinite(meal.estimatedCostLkr) &&
        meal.estimatedCostLkr >= 0,
    );
    const estimatedTotalCostLkr = costsKnown
      ? Math.round(
          meals.reduce(
            (sum, meal) => sum + meal.estimatedCostLkr * (meal.servings || 1),
            0,
          ),
        )
      : null;

    const previous = await repo.findOne({ where: { mealPlanId } });
    if (previous) {
      for (const item of items) {
        const old = (previous.items as GroceryItem[]).find(
          (i) =>
            i.ingredientName === item.ingredientName &&
            i.unit === item.unit &&
            Number(i.quantity) === item.quantity,
        );
        item.purchased = old?.purchased ?? false;
      }
    }
    const groceryList = repo.create({
      ...(previous ? { id: previous.id } : {}),
      mealPlanId,
      items,
      estimatedTotalCostLkr,
    });

    return repo.save(groceryList);
  }

  aggregateIngredients(meals: MealWithIngredients[]): GroceryItem[] {
    const map = new Map<
      string,
      { quantity: number; unit: string; name: string }
    >();

    for (const meal of meals) {
      const servings = meal.servings || 1;
      for (const ing of meal.ingredients || []) {
        const rawName = (ing.name || '').trim();
        if (!rawName) continue;

        const normalizedName = this.normalizeName(rawName);
        const rawUnit = (ing.unit || 'units').toLowerCase().trim();
        const baseQty = (ing.quantity || 1) * servings;

        const key = `${normalizedName.toLowerCase()}_${rawUnit}`;
        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.quantity += baseQty;
        } else {
          map.set(key, {
            quantity: baseQty,
            unit: rawUnit,
            name: normalizedName,
          });
        }
      }
    }

    const result: GroceryItem[] = [];
    for (const entry of map.values()) {
      const category = this.categorizeIngredient(entry.name);
      result.push({
        ingredientName: entry.name,
        quantity: Math.round(entry.quantity * 100) / 100,
        unit: entry.unit,
        category,
        estimatedCostLkr: null,
        purchased: false,
      });
    }

    // Sort alphabetically by category then name
    result.sort((a, b) =>
      a.category === b.category
        ? a.ingredientName.localeCompare(b.ingredientName)
        : a.category.localeCompare(b.category),
    );

    return result;
  }

  private normalizeName(name: string): string {
    const cleaned = name.replace(/\s+/g, ' ').trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  private categorizeIngredient(name: string): string {
    const lower = name.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_MAPPINGS)) {
      if (keywords.some((kw) => lower.includes(kw) || kw.includes(lower))) {
        return category;
      }
    }
    return 'Miscellaneous & Other';
  }

  async findByPlanId(mealPlanId: string): Promise<GroceryList> {
    const list = await this.groceryListRepository.findOne({
      where: { mealPlanId },
    });
    if (!list) {
      throw new NotFoundException(
        `Grocery list for plan ${mealPlanId} not found`,
      );
    }
    return list;
  }
}
