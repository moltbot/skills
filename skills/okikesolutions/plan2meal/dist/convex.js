"use strict";
/**
 * Plan2Meal Backend API Client
 * Calls your Plan2Meal backend, which handles Convex connection internally
 */
class Plan2MealApiClient {
    constructor(apiUrl, sessionToken) {
        this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
        this.sessionToken = sessionToken;
    }
    /**
     * Make HTTP request to Plan2Meal backend API
     */
    async request(path, options) {
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
        return (await response.json());
    }
    /**
     * Fetch recipe metadata from URL via backend
     */
    async fetchRecipeMetadata(url) {
        try {
            return await this.request('/api/recipes/scrape', {
                method: 'POST',
                body: JSON.stringify({ url }),
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    }
    /**
     * Create a new recipe
     */
    async createRecipe(recipe) {
        const response = await this.request('/api/recipes', {
            method: 'POST',
            body: JSON.stringify(recipe),
        });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data;
    }
    /**
     * Get all user recipes
     */
    async getMyRecipes() {
        const response = await this.request('/api/recipes');
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data || [];
    }
    /**
     * Search recipes
     */
    async searchRecipes(term) {
        const params = new URLSearchParams({ q: term });
        const response = await this.request(`/api/recipes/search?${params.toString()}`);
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data || [];
    }
    /**
     * Get recipe by ID
     */
    async getRecipeById(id) {
        try {
            const response = await this.request(`/api/recipes/${id}`);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || null;
        }
        catch {
            return null;
        }
    }
    /**
     * Delete recipe
     */
    async deleteRecipe(id) {
        await this.request(`/api/recipes/${id}`, {
            method: 'DELETE',
        });
    }
    /**
     * Get all grocery lists
     */
    async getMyLists() {
        const response = await this.request('/api/grocery-lists');
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data || [];
    }
    /**
     * Get grocery list by ID
     */
    async getListById(id) {
        try {
            const response = await this.request(`/api/grocery-lists/${id}`);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.data || null;
        }
        catch {
            return null;
        }
    }
    /**
     * Create grocery list
     */
    async createGroceryList(name) {
        const response = await this.request('/api/grocery-lists', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
        if (response.error) {
            throw new Error(response.error);
        }
        return response.data;
    }
    /**
     * Add recipe to grocery list
     */
    async addRecipeToList(listId, recipeId) {
        await this.request(`/api/grocery-lists/${listId}/recipes`, {
            method: 'POST',
            body: JSON.stringify({ recipeId }),
        });
    }
}
module.exports = Plan2MealApiClient;
//# sourceMappingURL=convex.js.map