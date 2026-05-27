export class LocaleManager {
    constructor() {
        this.locales = {};
        this.currentLocale = 'pt-BR';
    }

    async init(dataManager) {
        const data = await dataManager.loadJSON('locales', 'src/game/data/locales.json');
        if (data) {
            this.locales = data;
        }

        // Try to load from localStorage
        const saved = localStorage.getItem('towers_language');
        if (saved && this.locales[saved]) {
            this.currentLocale = saved;
        }
    }

    setLocale(locale) {
        if (this.locales[locale]) {
            this.currentLocale = locale;
            localStorage.setItem('towers_language', locale);
            return true;
        }
        return false;
    }

    t(key) {
        if (!this.locales[this.currentLocale]) return key;
        return this.locales[this.currentLocale][key] || key;
    }
}
