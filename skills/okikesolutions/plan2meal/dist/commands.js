"use strict";
/**
 * Command Handlers for Plan2Meal Skill
 */
const utils_1 = require("./utils");
class Plan2MealCommands {
    constructor(convex, tokenValidator, config) {
        this.convex = convex;
        this.tokenValidator = tokenValidator;
        this.config = config;
    }
    /**
     * Add recipe from URL
     */
    async addRecipe(_sessionToken, url) {
        const extractionResult = await this.convex.fetchRecipeMetadata(url);
        if (!extractionResult.success) {
            return {
                text: `❌ Failed to extract recipe from URL: ${extractionResult.error || 'Unknown error'}`,
            };
        }
        const metadata = extractionResult.metadata || {};
        const recipe = await this.convex.createRecipe({
            name: metadata.name || 'Untitled Recipe',
            url,
            ingredients: metadata.ingredients || [],
            steps: metadata.steps || [],
            calories: metadata.calories || undefined,
            servings: metadata.servings || 2,
            prepTime: metadata.prepTime || undefined,
            cookTime: metadata.cookTime || undefined,
            difficulty: metadata.difficulty || 'medium',
            cuisine: metadata.cuisine || '',
            tags: metadata.tags || [],
        });
        const timestamp = extractionResult.scrapedAt
            ? new Date(extractionResult.scrapedAt).toLocaleTimeString()
            : 'unknown';
        return {
            text: `✅ Recipe added successfully!\n\n📖 **${(0, utils_1.markdownEscape)(recipe.name)}**\n` +
                `🔗 Source: ${new URL(url).hostname}\n` +
                `🔧 Method: \`${extractionResult.scrapeMethod || 'unknown'}\`\n` +
                `⏰ Scraped at: ${timestamp}\n\n` +
                this.formatRecipePreview(metadata),
        };
    }
    /**
     * List user's recipes
     */
    async listRecipes(_sessionToken) {
        const recipes = await this.convex.getMyRecipes();
        if (!recipes || recipes.length === 0) {
            return { text: '📭 You have no recipes yet. Add one with `plan2meal add <url>`' };
        }
        const sorted = [...recipes].reverse().slice(0, 10);
        let text = `📚 **Your Recipes** (${recipes.length} total)\n\n`;
        for (const recipe of sorted) {
            const time = this.formatTime(recipe.prepTime, recipe.cookTime);
            text += `• \`${recipe._id}\` - ${(0, utils_1.markdownEscape)(recipe.name)}\n`;
            if (time)
                text += `  └─ ${time}\n`;
        }
        return { text };
    }
    /**
     * Search recipes
     */
    async searchRecipes(_sessionToken, term) {
        const recipes = await this.convex.searchRecipes(term);
        if (!recipes || recipes.length === 0) {
            return { text: `🔍 No recipes found for "${(0, utils_1.markdownEscape)(term)}"` };
        }
        let text = `🔍 **Search Results** for "${(0, utils_1.markdownEscape)(term)}" (${recipes.length} found)\n\n`;
        for (const recipe of recipes.slice(0, 10)) {
            const time = this.formatTime(recipe.prepTime, recipe.cookTime);
            text += `• \`${recipe._id}\` - ${(0, utils_1.markdownEscape)(recipe.name)}\n`;
            if (time)
                text += `  └─ ${time}\n`;
        }
        return { text };
    }
    /**
     * Show recipe details
     */
    async showRecipe(_sessionToken, id) {
        const recipe = await this.convex.getRecipeById(id);
        if (!recipe) {
            return { text: `❌ Recipe not found: \`${id}\`` };
        }
        return { text: this.formatRecipeFull(recipe) };
    }
    /**
     * Delete recipe
     */
    async deleteRecipe(_sessionToken, id) {
        await this.convex.deleteRecipe(id);
        return { text: `🗑️ Recipe deleted: \`${id}\`` };
    }
    /**
     * List grocery lists
     */
    async lists(_sessionToken) {
        const lists = await this.convex.getMyLists();
        if (!lists || lists.length === 0) {
            return {
                text: '📭 You have no grocery lists. Create one with `plan2meal list-create <name>`',
            };
        }
        let text = `🛒 **Your Grocery Lists**\n\n`;
        for (const list of lists) {
            const itemCount = list.items?.length || 0;
            const doneCount = list.items?.filter((i) => i.isCompleted).length || 0;
            text += `• \`${list._id}\` - ${(0, utils_1.markdownEscape)(list.name)}\n`;
            text += `  └─ ${itemCount} items${doneCount ? ` (${doneCount} done)` : ''}\n`;
        }
        return { text };
    }
    /**
     * Show grocery list details
     */
    async showList(_sessionToken, id) {
        const list = await this.convex.getListById(id);
        if (!list) {
            return { text: `❌ Grocery list not found: \`${id}\`` };
        }
        return { text: this.formatGroceryList(list) };
    }
    /**
     * Create grocery list
     */
    async createList(_sessionToken, name) {
        const list = await this.convex.createGroceryList(name);
        return {
            text: `✅ Grocery list created!\n\n📋 **${(0, utils_1.markdownEscape)(name)}**\nID: \`${list._id}\``,
        };
    }
    /**
     * Add recipe to grocery list
     */
    async addRecipeToList(_sessionToken, listId, recipeId) {
        await this.convex.addRecipeToList(listId, recipeId);
        return { text: `✅ Recipe added to grocery list \`${listId}\`` };
    }
    /**
     * Show help
     */
    help() {
        return {
            text: `📖 **Plan2Meal Commands**\n\n` +
                `**Recipes**\n` +
                `• \`plan2meal add <url>\` - Add recipe from URL\n` +
                `• \`plan2meal list\` - List your recipes\n` +
                `• \`plan2meal search <term>\` - Search recipes\n` +
                `• \`plan2meal show <id>\` - View recipe details\n` +
                `• \`plan2meal delete <id>\` - Delete recipe\n\n` +
                `**Grocery Lists**\n` +
                `• \`plan2meal lists\` - List all grocery lists\n` +
                `• \`plan2meal list-show <id>\` - View list with items\n` +
                `• \`plan2meal list-create <name>\` - Create new list\n` +
                `• \`plan2meal list-add <listId> <recipeId>\` - Add recipe to list\n\n` +
                `**Help**\n` +
                `• \`plan2meal help\` - Show this help`,
        };
    }
    // ========== Formatting Helpers ==========
    formatRecipePreview(metadata) {
        let text = '';
        const ingredients = metadata.ingredients;
        const steps = metadata.steps;
        if (ingredients?.length) {
            text += `🥘 **Ingredients** (${typeof metadata.servings === 'number' ? metadata.servings : '?'} servings)\n`;
            ingredients.slice(0, 5).forEach((ing) => {
                text += `• ${(0, utils_1.markdownEscape)(ing)}\n`;
            });
            if (ingredients.length > 5) {
                text += `  └─ ...and ${ingredients.length - 5} more\n`;
            }
        }
        if (steps?.length) {
            text += `\n🔪 **Steps**\n`;
            steps.slice(0, 3).forEach((step, i) => {
                const truncated = step.length > 100 ? `${step.slice(0, 100)}...` : step;
                text += `${i + 1}. ${(0, utils_1.markdownEscape)(truncated)}\n`;
            });
        }
        return text || 'No details available';
    }
    formatRecipeFull(recipe) {
        let text = `📖 **${(0, utils_1.markdownEscape)(recipe.name)}**\n\n`;
        if (recipe.url) {
            text += `🔗 [Source](${recipe.url})\n`;
        }
        const time = this.formatTime(recipe.prepTime, recipe.cookTime);
        if (time)
            text += `${time}\n`;
        if (recipe.calories) {
            text += `🔥 ${recipe.calories} cal | `;
        }
        text += `👥 ${recipe.servings || '?'} servings | `;
        text += `📊 ${recipe.difficulty || 'medium'}\n`;
        if (recipe.ingredients?.length) {
            text += `\n🥘 **Ingredients**\n`;
            recipe.ingredients.forEach((ing) => {
                text += `• ${(0, utils_1.markdownEscape)(String(ing))}\n`;
            });
        }
        if (recipe.steps?.length) {
            text += `\n🔪 **Steps**\n`;
            recipe.steps.forEach((step, i) => {
                text += `${i + 1}. ${(0, utils_1.markdownEscape)(String(step))}\n`;
            });
        }
        if (recipe.tags?.length) {
            text += `\n🏷️ **Tags**: ${recipe.tags.map((t) => (0, utils_1.markdownEscape)(t)).join(', ')}`;
        }
        return text;
    }
    formatGroceryList(list) {
        let text = `🛒 **${(0, utils_1.markdownEscape)(list.name)}**\n`;
        if (list.description) {
            text += `_${(0, utils_1.markdownEscape)(list.description)}_\n`;
        }
        if (!list.items || list.items.length === 0) {
            text += '\n📭 No items in this list';
            return text;
        }
        const byRecipe = {};
        const customItems = [];
        for (const item of list.items) {
            if (item.recipeId) {
                if (!byRecipe[item.recipeId]) {
                    byRecipe[item.recipeId] = { recipe: item.recipeName || 'Unknown', items: [] };
                }
                byRecipe[item.recipeId].items.push(item);
            }
            else {
                customItems.push(item);
            }
        }
        for (const data of Object.values(byRecipe)) {
            text += `\n📌 **${(0, utils_1.markdownEscape)(data.recipe)}**\n`;
            for (const item of data.items) {
                const checkbox = item.isCompleted ? '✅' : '⬜';
                const qty = item.quantity ? ` ${item.quantity} ${item.unit || ''}` : '';
                text += `${checkbox} ${(0, utils_1.markdownEscape)(item.ingredient)}${qty}\n`;
            }
        }
        if (customItems.length) {
            text += `\n📝 **Custom Items**\n`;
            for (const item of customItems) {
                const checkbox = item.isCompleted ? '✅' : '⬜';
                const qty = item.quantity ? ` ${item.quantity} ${item.unit || ''}` : '';
                text += `${checkbox} ${(0, utils_1.markdownEscape)(item.ingredient)}${qty}\n`;
            }
        }
        const total = list.items.length;
        const done = list.items.filter((i) => i.isCompleted).length;
        text += `\n---\n📊 ${done}/${total} items checked`;
        return text;
    }
    formatTime(prepTime, cookTime) {
        const parts = [];
        if (prepTime)
            parts.push(`${prepTime} min prep`);
        if (cookTime)
            parts.push(`${cookTime} min cook`);
        return parts.length ? parts.join(' + ') : null;
    }
}
module.exports = Plan2MealCommands;
//# sourceMappingURL=commands.js.map