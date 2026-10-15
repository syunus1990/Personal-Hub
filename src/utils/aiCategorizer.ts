import { CategoryItem } from '../types';

export interface AICategorizationResult {
  category: string;
  subCategory?: string;
  confidence: number;
  explanation?: string;
}

interface PatternRule {
  category: string;
  subCategory?: string;
  keywords: string[];
  priority: number;
}

const DEFAULT_PATTERNS: PatternRule[] = [
  // Car sub-categories
  {
    category: 'Car',
    subCategory: 'Fuel',
    keywords: ['fuel', 'petrol', 'gasoline', 'diesel', 'gas station', 'aramco', 'adnoc', '91', '95', 'tank'],
    priority: 10,
  },
  {
    category: 'Car',
    subCategory: 'Maintenance',
    keywords: [
      'maintenance',
      'gear box',
      'oil change',
      'engine oil',
      'fuel injector',
      'battery',
      'battery installation',
      'tyre',
      'tire',
      'mechanic',
      'repair',
      'brake',
      'brakes',
      'radiator',
      'spark plug',
      'inspection',
      'alignment',
      'suspension',
      'filter',
      'workshop',
    ],
    priority: 10,
  },
  {
    category: 'Car',
    subCategory: 'Cleaning',
    keywords: [
      'car cleaning',
      'car wash',
      'cleaning monthly',
      'cleaning',
      'wash',
      'vacuum',
      'detailing',
      'car polish',
      'interior cleaning',
    ],
    priority: 9,
  },
  {
    category: 'Car',
    keywords: [
      'car',
      'seat cover',
      'flooring',
      'steering',
      'car insurance',
      'parking',
      'istimara',
      'fahas',
      'speed camera',
      'muroor',
      'booster cable',
      'torque wrench',
      'electric car jack',
    ],
    priority: 7,
  },

  // Food & Dining
  {
    category: 'Food',
    keywords: [
      'al baik',
      'barns',
      'coffee',
      'tea',
      'breakfast',
      'dinner',
      'lunch',
      'restaurant',
      'cafe',
      'kitchen',
      '1947',
      'umar home',
      'grove',
      'juice',
      'papaya',
      'khubz',
      'bread',
      'rice',
      'bhukhari',
      'water refill',
      'water bottle',
      'shawarma',
      'broast',
      'burger',
      'pizza',
      'hypermarket',
      'groceries',
      'supermarket',
      'lulu',
      'tamimi',
      'danube',
      'panda',
      'vegetables',
      'fruits',
      'milk',
      'meat',
    ],
    priority: 8,
  },

  // Fuel (Standalone or Car)
  {
    category: 'Fuel',
    keywords: ['petrol', 'fuel', 'diesel', 'gas'],
    priority: 8,
  },

  // Shopping
  {
    category: 'Shopping',
    keywords: [
      'shopping',
      'purse',
      'socks',
      'ring',
      'silver',
      'abaya',
      'khamza',
      'market',
      'clothes',
      'shoes',
      't-shirt',
      'shirt',
      'pants',
      'ali express',
      'amazon',
      'noon',
      'shein',
      'jarir',
      'extra',
      'electronics',
      'perfume',
      'oud',
      'watch',
    ],
    priority: 8,
  },

  // Bills & Utilities
  {
    category: 'Bills',
    keywords: [
      'mobily',
      'stc',
      'zain',
      'recharge',
      'mobile bill',
      'wifi',
      'fiber',
      'internet',
      'electricity',
      'water bill',
      'utilities',
      'subscription',
      'netflix',
      'spotify',
      'cloud',
      'chatgpt',
    ],
    priority: 8,
  },

  // Family
  {
    category: 'Family',
    keywords: [
      'family',
      'home',
      'mummy',
      'mother',
      'father',
      'brother',
      'sister',
      'sadaqa',
      'parents',
      'kids',
      'wife',
      'school fees',
      'relatives',
      'gift family',
    ],
    priority: 8,
  },

  // Personal
  {
    category: 'Personal',
    keywords: [
      'personal',
      'hand gloves',
      'gloves',
      'investment',
      'medicine',
      'duphalac',
      'pharmacy',
      'nahdi',
      'doctor',
      'clinic',
      'hospital',
      'haircut',
      'salon',
      'gym',
      'fitness',
      'rent',
      'pocket money',
      'saving',
      'course',
      'books',
      'isalesawab',
      'water',
    ],
    priority: 7,
  },
];

/**
 * Predicts category and subcategory from an expense description
 */
export function predictCategoryFromDescription(
  description: string,
  categories: CategoryItem[] = []
): AICategorizationResult | null {
  if (!description || description.trim().length < 2) {
    return null;
  }

  const clean = description.toLowerCase().trim();

  // 1. Direct sub-category match across existing dynamic categories
  for (const cat of categories) {
    for (const sub of cat.subCategories) {
      const subLower = sub.name.toLowerCase();
      if (clean.includes(subLower) || subLower.includes(clean)) {
        return {
          category: cat.name,
          subCategory: sub.name,
          confidence: 0.95,
          explanation: `Direct sub-category match for "${sub.name}"`,
        };
      }
    }
  }

  // 2. Direct category name match
  for (const cat of categories) {
    const catLower = cat.name.toLowerCase();
    if (clean.includes(catLower) || catLower.includes(clean)) {
      // Check if any subcategory matches as well
      const matchedSub = cat.subCategories.find((s) => clean.includes(s.name.toLowerCase()));
      return {
        category: cat.name,
        subCategory: matchedSub?.name,
        confidence: 0.9,
        explanation: `Matched category "${cat.name}"`,
      };
    }
  }

  // 3. Pattern rules match
  let bestMatch: PatternRule | null = null;
  let highestScore = 0;

  for (const rule of DEFAULT_PATTERNS) {
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        // Score based on keyword length and rule priority
        const score = kw.length * 2 + rule.priority * 3;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = rule;
        }
      }
    }
  }

  if (bestMatch) {
    // Verify target category exists or map to available category
    const availableCategory = categories.find(
      (c) => c.name.toLowerCase() === bestMatch?.category.toLowerCase()
    );

    const finalCategoryName = availableCategory ? availableCategory.name : bestMatch.category;
    let finalSubCategory = bestMatch.subCategory;

    // Check if subCategory exists under this category in available categories
    if (availableCategory && finalSubCategory) {
      const existingSub = availableCategory.subCategories.find(
        (s) => s.name.toLowerCase() === finalSubCategory?.toLowerCase()
      );
      if (existingSub) {
        finalSubCategory = existingSub.name;
      }
    }

    return {
      category: finalCategoryName,
      subCategory: finalSubCategory,
      confidence: Math.min(0.98, 0.7 + highestScore / 100),
      explanation: `Smart AI prediction from description "${description}"`,
    };
  }

  return null;
}
