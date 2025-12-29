
export enum GIRating {
  LOW = '低GI',
  MEDIUM = '中GI',
  HIGH = '高GI'
}

export interface FoodAnalysis {
  name: string;
  giValue: number;
  giRating: GIRating;
  sugarPer100g: number;
  carbsPer100g: number;
  advice: string;
  portionSize: string;
}

export interface MealRecord {
  id: string;
  timestamp: number;
  image: string;
  foods: FoodAnalysis[];
  totalSugar: number;
  totalCarbs: number;
  rating: '优' | '良' | '需注意';
}

export interface DailyStats {
  date: string;
  totalSugar: number;
  limit: number;
  meals: MealRecord[];
}
