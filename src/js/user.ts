// Import will be handled by webpack for text files
import prePromptText from '../resources/preprompt.text.txt';

interface ChatSettings {
    apiKey?: string;
    llmUrl?: string;
}

interface IntentionItem {
    words: string;
    favorite: boolean;
}

export class UserStorageInterface {

    static setDefaultSettingsIfNotExists(chatSettings: ChatSettings, intention: string): void {
        browser.storage.sync.get(['apiKey', 'prePrompt', 'llmUrl'])
            .then(data => {
                browser.storage.sync.set({
                    apiKey: data.apiKey ? data.apiKey : chatSettings.apiKey,
                    prePrompt: data.prePrompt ? data.prePrompt : prePromptText,
                    llmUrl: data.llmUrl ? data.llmUrl : chatSettings.llmUrl
                });
            });
        browser.storage.local.get("intention")
            .then(data => {
                if (!data.intention) {
                    this.updateIntention(intention);
                }
            });
    }

    static async getIntention(): Promise<string | null> {
        const { intention } = await browser.storage.local.get("intention");
        return (intention as string) || null;
    }

    static async getApiKey(): Promise<string | null> {
        const { apiKey } = await browser.storage.sync.get("apiKey");
        return (apiKey as string) || null;
    }

    static async getSystemPrompt(): Promise<string | null> {
        const { prePrompt } = await browser.storage.sync.get("prePrompt");
        return (prePrompt as string) || null;
    }

    static async getLLMUrl(): Promise<string | null> {
        const { llmUrl } = await browser.storage.sync.get("llmUrl");
        return (llmUrl as string) || null;
    }

    static async createSystemPrompt(intention: string, fromFile: boolean = false): Promise<string | null> {
        const prePrompt = fromFile ? prePromptText : await this.getSystemPrompt();
        return prePrompt ? this.#formatSystemPrompt(prePrompt, intention) : null;
    }

    static #formatSystemPrompt(prompt: string, intention: string): string {
        if (/\[intention\]/gi.test(prompt)) {
            return prompt.replace(/\[intention\]/gi, intention);
        } else {
            return prompt;
        }
    }

    static async getIntentionHistory(): Promise<IntentionItem[]> {
        const { intentionHistory } = await browser.storage.local.get("intentionHistory");
        return (intentionHistory as IntentionItem[]) || [];
    }

    static async getIntentionFavorites(): Promise<Map<string, boolean>> {
        const { intentionFavorites } = await browser.storage.local.get("intentionFavorites");
        return (intentionFavorites as Map<string, boolean>) || new Map();
    }

    static async updateIntention(intention: string): Promise<void> {
        const storedIntention = await this.getIntention();
        
        if (storedIntention !== intention) {
            await browser.storage.local.set({ intention });
            
            const intentionHistory = await this.getIntentionHistory();
            await this.addToIntentionHistoryList(intentionHistory, intention);
        }
    }

    static async addToIntentionHistoryList(intentionList: IntentionItem[], intention: string): Promise<void> {
        const intentionObj: IntentionItem = {
            words: intention,
            favorite: false
        };
        console.log(intentionList);
        const updatedList = intentionList ? [...intentionList, intentionObj] : [intentionObj];

        await browser.storage.local.set({ intentionHistory: updatedList });
    }

    static async toggleIntentionFromFavoritesMap(intention: string): Promise<void> {
        const favoritesMap = await this.getIntentionFavorites();

        if (favoritesMap.has(intention)) {
            favoritesMap.delete(intention);
        } else {
            favoritesMap.set(intention, true);
        }

        await browser.storage.local.set({ intentionFavorites: favoritesMap });
    }

    static async toggleShowFavoriteInHistoryList(intention: string): Promise<void> {
        const intentionHistory = await this.getIntentionHistory();
        const updatedHistory = intentionHistory.map((item: IntentionItem) => {
            if (item.words === intention) {
                return { ...item, favorite: !item.favorite };
            }
            return item;
        });
        await browser.storage.local.set({ intentionHistory: updatedHistory });
    }
}