/**
 * Plan2Meal Backend API Client
 * Calls your Plan2Meal backend, which handles Convex connection internally
 */

interface RecipeMetadata {
  name: string;
  ingredients: string[];
  steps: string[];
  calories?: number;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  difficulty?: string;
  cuisine?: string;
  tags?: string[];
  nutritionInfo?: Record<string, unknown>;
  localization?: { language: string };
}

interface ExtractionResult {
  success: boolean;
  metadata?: RecipeMetadata;
  scrapeMethod?: string;
  scrapedAt?: string;
  error?: string;
}

interface Recipe {
  _id: string;
  name: string;
  url?: string;
  ingredients: string[];
  steps: string[];
  calories?: number;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  difficulty?: string;
  cuisine?: string;
  tags?: string[];
  nutritionInfo?: Record<string, unknown>;
  localization?: { language: string };
  createdAt?: string;
}

interface GroceryList {
  _id: string;
  name: string;
  description?: string;
  items: GroceryItem[];
}

interface GroceryItem {
  ingredient: string;
  quantity?: string;
  unit?: string;
  isCompleted: boolean;
  recipeId?: string;
  recipeName?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class Plan2MealApiClient {
  private apiUrl: string;
  private sessionToken: string;

  constructor(apiUrl: string, sessionToken: string) {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.sessionToken = sessionToken;
  }

  /**
   * Make HTTP request to Plan2Meal backend API
   */
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.sessionToken}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Fetch recipe metadata from URL via backend
   */
  async fetchRecipeMetadata(url: string): Promise<ExtractionResult> {
    try {
      return await this.request<ExtractionResult>('/api/recipes/scrape', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Create a new recipe
   */
  async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const response = await this.request<ApiResponse<Recipe>>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as Recipe;
  }

  /**
   * Get all user recipes
   */
  async getMyRecipes(): Promise<Recipe[]> {
    const response = await this.request<ApiResponse<Recipe[]>>('/api/recipes');
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  /**
   * Search recipes
   */
  async searchRecipes(term: string): Promise<Recipe[]> {
    const params = new URLSearchParams({ q: term });
    const response = await this.request<ApiResponse<Recipe[]>>(
      `/api/recipes/search?${params.toString()}`
    );
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  /**
   * Get recipe by ID
   */
  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const response = await this.request<ApiResponse<Recipe>>(`/api/recipes/${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Delete recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    await this.request(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all grocery lists
   */
  async getMyLists(): Promise<GroceryList[]> {
    const response = await this.request<ApiResponse<GroceryList[]>>('/api/grocery-lists');
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  /**
   * Get grocery list by ID
   */
  async getListById(id: string): Promise<GroceryList | null> {
    try {
      const response = await this.request<ApiResponse<GroceryList>>(`/api/grocery-lists/${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Create grocery list
   */
  async createGroceryList(name: string): Promise<GroceryList> {
    const response = await this.request<ApiResponse<GroceryList>>('/api/grocery-lists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as GroceryList;
  }

  /**
   * Add recipe to grocery list
   */
  async addRecipeToList(listId: string, recipeId: string): Promise<void> {
    await this.request(`/api/grocery-lists/${listId}/recipes`, {
      method: 'POST',
      body: JSON.stringify({ recipeId }),
    });
  }
}

export = Plan2MealApiClient;
