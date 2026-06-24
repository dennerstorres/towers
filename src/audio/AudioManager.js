export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.isMuted = false;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.masterGain.connect(this.ctx.destination);
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);

        this.masterGain.gain.value = 0.8;
    }

    updateVolumes(settings) {
        this.init();
        this.masterGain.gain.setTargetAtTime(settings.masterVolume, this.ctx.currentTime, 0.05);
        this.musicGain.gain.setTargetAtTime(settings.musicVolume, this.ctx.currentTime, 0.05);
        this.sfxGain.gain.setTargetAtTime(settings.sfxVolume, this.ctx.currentTime, 0.05);
    }

    resume() {
        this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createOscillator(type, freq, duration, volume = 1) {
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShoot(type) {
        switch (type) {
            case 'archer':
                // Som de flecha: curto e agudo
                this.createOscillator('triangle', 800, 0.1, 0.5);
                break;
            case 'cannon':
                // Som de canhão: grave e barulhento
                this.createOscillator('square', 100, 0.3, 0.8);
                break;
            case 'wizard':
                // Som mágico: frequência deslizando
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.frequency.setValueAtTime(400, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
                break;
        }
    }

    playEnemyDeath() {
        // Som de morte: ruído ou frequência caindo
        this.createOscillator('sawtooth', 150, 0.2, 0.4);
    }

    playError() {
        // Som curto e grave de "ação inválida"
        this.createOscillator('square', 140, 0.08, 0.25);
    }

    playWaveStart() {
        // Som de início de onda: trombeta simples
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [220, 277, 329].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.3, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    playGameOver() {
        // Som de derrota: escala descendente melancólica
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [200, 150, 100].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(freq, now + i * 0.3);
            gain.gain.setValueAtTime(0.5, now + i * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.5);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.3);
            osc.stop(now + i * 0.3 + 0.5);
        });
    }

    playVictory() {
        // Som de vitória: fanfarra triunfante
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [330, 330, 330, 440].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(freq, now + i * 0.2);
            gain.gain.setValueAtTime(0.5, now + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.4);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.4);
        });
    }
}
