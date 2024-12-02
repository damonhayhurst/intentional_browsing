import prePromptText from '../resources/preprompt.text.txt';
export class UserStorageInterface {

    static setDefaultSettingsIfNotExists(chatSettings, intention) {
        browser.storage.sync.get(['apiKey', 'prePrompt'])
            .then(data => {
                browser.storage.sync.set({
                    apiKey: data.apiKey ? data.apiKey : chatSettings.apiKey,
                    prePrompt: data.prePrompt ? data.prePrompt : prePromptText
                })
            })
        browser.storage.local.get("intention")
            .then(data => {
                if (!data.intention) {
                    this.updateIntention(intention);
                }
            })
    }


    static async getIntention() {
        const { intention } = await browser.storage.local.get("intention");
        return intention || null;
    }

    static async getApiKey() {
        const { apiKey } = await browser.storage.sync.get("apiKey");
        return apiKey || null;
    }

    static async getSystemPrompt() {
        const { prePrompt } = await browser.storage.sync.get("prePrompt");
        return prePrompt || null;
    }

    static async createSystemPrompt(intention, fromFile = false) {
        const prePrompt = fromFile ? prePromptText : this.getSystemPrompt()
        return prePrompt ? this.#formatSystemPrompt(prePrompt, intention) : null;
    }

    static #formatSystemPrompt(prompt, intention) {
        return prompt.replace(/\[intention\]/gi, intention);
    }

    static async getIntentionHistory() {
        const { intentionHistory } = await browser.storage.local.get("intentionHistory");
        return intentionHistory || [];
    }

    static async getIntentionFavorites() {
        const { intentionFavorites } = await browser.storage.local.get("intentionFavorites");
        return intentionFavorites || new Map();
    }

    static async updateIntention(intention) {
        const storedIntention= await this.getIntention();
        
        if (storedIntention !== intention) {
            await browser.storage.local.set({ intention });
            
            const intentionHistory = await this.getIntentionHistory()
            await this.addToIntentionHistoryList(intentionHistory, intention);
        }
    }

    static async addToIntentionHistoryList(intentionList, intention) {
        const intentionObj = {
            words: intention,
            favorite: false
        };
        console.log(intentionList)
        const updatedList = intentionList ? [...intentionList, intentionObj] : [intentionObj];

        await browser.storage.local.set({ intentionHistory: updatedList });
    }

    static async toggleIntentionFromFavoritesMap(intention) {
        const favoritesMap = await this.getIntentionFavorites();

        if (favoritesMap.has(intention)) {
            favoritesMap.delete(intention);
        } else {
            favoritesMap.set(intention, true);
        }

        await browser.storage.local.set({ intentionFavorites: favoritesMap });
    }

    static async toggleShowFavoriteInHistoryList(intention) {
        const intentionHistory = await this.getIntentionHistory();
        const updatedHistory = intentionHistory.map((item) => {
            if (item.words === intention) {
                return { ...item, favorite: !item.favorite };
            }
            return item;
        });
        await browser.storage.local.set({ intentionHistory: updatedHistory });
    }
}