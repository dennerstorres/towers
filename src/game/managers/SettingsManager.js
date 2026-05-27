export class SettingsManager {
    constructor() {
        this.state = {
            language: 'pt-BR',
            masterVolume: 0.8,
            musicVolume: 0.5,
            sfxVolume: 0.7,
            keybinds: {
                'pause': 'Space',
                'speed': 'KeyT'
            }
        };
        this.load();
    }

    load() {
        const saved = localStorage.getItem('towers_settings');
        if (saved) {
            try {
                this.state = { ...this.state, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Erro ao carregar configurações:', e);
            }
        }
    }

    save() {
        localStorage.setItem('towers_settings', JSON.stringify(this.state));
    }

    setVolume(type, value) {
        this.state[`${type}Volume`] = Math.max(0, Math.min(1, value));
        this.save();
    }

    setKeybind(action, code) {
        this.state.keybinds[action] = code;
        this.save();
    }
}
