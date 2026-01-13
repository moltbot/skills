/**
 * Command Handlers for Plan2Meal Skill
 */
declare class Plan2MealCommands {
    private convex;
    private tokenValidator;
    private config;
    constructor(convex: typeof this.convex, tokenValidator: typeof this.tokenValidator, config: Record<string, unknown>);
    /**
     * Add recipe from URL
     */
    addRecipe(_sessionToken: string, url: string): Promise<{
        text: string;
    }>;
    /**
     * List user's recipes
     */
    listRecipes(_sessionToken: string): Promise<{
        text: string;
    }>;
    /**
     * Search recipes
     */
    searchRecipes(_sessionToken: string, term: string): Promise<{
        text: string;
    }>;
    /**
     * Show recipe details
     */
    showRecipe(_sessionToken: string, id: string): Promise<{
        text: string;
    }>;
    /**
     * Delete recipe
     */
    deleteRecipe(_sessionToken: string, id: string): Promise<{
        text: string;
    }>;
    /**
     * List grocery lists
     */
    lists(_sessionToken: string): Promise<{
        text: string;
    }>;
    /**
     * Show grocery list details
     */
    showList(_sessionToken: string, id: string): Promise<{
        text: string;
    }>;
    /**
     * Create grocery list
     */
    createList(_sessionToken: string, name: string): Promise<{
        text: string;
    }>;
    /**
     * Add recipe to grocery list
     */
    addRecipeToList(_sessionToken: string, listId: string, recipeId: string): Promise<{
        text: string;
    }>;
    /**
     * Show help
     */
    help(): {
        text: string;
    };
    private formatRecipePreview;
    private formatRecipeFull;
    private formatGroceryList;
    private formatTime;
}
export = Plan2MealCommands;
//# sourceMappingURL=commands.d.ts.map