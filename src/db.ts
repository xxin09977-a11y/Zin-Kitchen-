import Dexie, { type Table } from 'dexie';

export enum IngredientUnit {
  G = 'g',
  KG = 'kg',
  ML = 'ml',
  L = 'L',
  TSP = 'tsp',
  TBSP = 'tbsp',
  CUP = 'cup',
  PIECE = 'piece',
  PINCH = 'pinch',
  BUNCH = 'bunch'
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: IngredientUnit;
}

export interface Recipe {
  id?: number;
  title: string;
  cookingSteps: string[];
  ingredients: Ingredient[];
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export class RecipeDatabase extends Dexie {
  recipes!: Table<Recipe>;

  constructor() {
    super('RecipeDatabase');
    this.version(3).stores({
      recipes: '++id, title, *cookingSteps, *ingredients.name' // Searchable indices
    });
  }
}

export const db = new RecipeDatabase();

// SQLite-like experience helpers
export async function getRecipes() {
  return await db.recipes.toArray();
}
