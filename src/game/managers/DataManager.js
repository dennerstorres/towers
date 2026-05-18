export class DataManager {
    constructor() {
        this.data = new Map();
    }

    async loadJSON(key, path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const json = await response.json();
            this.data.set(key, json);
            return json;
        } catch (error) {
            console.error(`Could not load JSON from ${path}:`, error);
            return null;
        }
    }

    get(key) {
        return this.data.get(key);
    }
}
