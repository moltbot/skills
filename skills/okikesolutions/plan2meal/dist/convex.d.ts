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
    localization?: {
        language: string;
    };
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
    localization?: {
        language: string;
    };
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
declare class Plan2MealApiClient {
    private apiUrl;
    private sessionToken;
    constructor(apiUrl: string, sessionToken: string);
    /**
     * Make HTTP request to Plan2Meal backend API
     */
    private request;
    /**
     * Fetch recipe metadata from URL via backend
     */
    fetchRecipeMetadata(url: string): Promise<ExtractionResult>;
    /**
     * Create a new recipe
     */
    createRecipe(recipe: Partial<Recipe>): Promise<Recipe>;
    /**
     * Get all user recipes
     */
    getMyRecipes(): Promise<Recipe[]>;
    /**
     * Search recipes
     */
    searchRecipes(term: string): Promise<Recipe[]>;
    /**
     * Get recipe by ID
     */
    getRecipeById(id: string): Promise<Recipe | null>;
    /**
     * Delete recipe
     */
    deleteRecipe(id: string): Promise<void>;
    /**
     * Get all grocery lists
     */
    getMyLists(): Promise<GroceryList[]>;
    /**
     * Get grocery list by ID
     */
    getListById(id: string): Promise<GroceryList | null>;
    /**
     * Create grocery list
     */
    createGroceryList(name: string): Promise<GroceryList>;
    /**
     * Add recipe to grocery list
     */
    addRecipeToList(listId: string, recipeId: string): Promise<void>;
}
export = Plan2MealApiClient;
//# sourceMappingURL=convex.d.ts.map