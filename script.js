class Metronome {
    constructor() {
        this.bpm = 120;
        this.isPlaying = false;
        this.interval = null;
        this.currentBeat = 0;
        this.timeSignature = 4;
        this.soundType = 'click';
        this.audioContext = null;
        this.nextNoteTime = 0.0;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25.0;
        this.schedulerInterval = null;
        
        this.initializeAudio();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized successfully');
        } catch (e) {
            console.error('Web Audio API is not supported in this browser');
        }
    }

    setupEventListeners() {
        // BPM input
        const bpmInput = document.getElementById('bpmInput');
        bpmInput.addEventListener('input', (e) => {
            this.setBpm(parseInt(e.target.value) || 120);
        });



        // Playback controls
        document.getElementById('playBtn').addEventListener('click', () => {
            this.togglePlay();
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stop();
        });

        // Settings
        document.getElementById('timeSignature').addEventListener('change', (e) => {
            this.timeSignature = parseInt(e.target.value);
        });

        document.getElementById('soundType').addEventListener('change', (e) => {
            this.soundType = e.target.value;
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlay();
            } else if (e.code === 'Escape') {
                this.stop();
            } else if (e.code === 'KeyT') {
                e.preventDefault();
                this.testSound();
            }
        });
    }

    setBpm(bpm) {
        this.bpm = Math.max(40, Math.min(200, bpm));
        this.updateDisplay();
        
        if (this.isPlaying) {
            this.stop();
            this.start();
        }
    }

    updateDisplay() {
        // BPM display removed for minimal UI
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        if (!this.audioContext) {
            this.initializeAudio();
        }

        // Resume audio context if suspended (required for user interaction)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('Audio context resumed');
                this.startMetronome();
            });
        } else {
            this.startMetronome();
        }
    }

    startMetronome() {
        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        
        const playBtn = document.getElementById('playBtn');
        playBtn.classList.add('playing');
        playBtn.innerHTML = '<span class="pause-icon">⏸</span>Pause';

        // Start the scheduler
        this.schedulerInterval = setInterval(() => {
            this.scheduler();
        }, this.lookahead);

        console.log('Metronome started at', this.bpm, 'BPM');
    }

    stop() {
        this.isPlaying = false;
        this.currentBeat = 0;
        
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }

        const playBtn = document.getElementById('playBtn');
        playBtn.classList.remove('playing');
        playBtn.innerHTML = '<span class="play-icon">▶</span>Start';

        // Reset visual indicators
        document.getElementById('beatIndicator').classList.remove('active', 'pulse');
        document.querySelectorAll('.beat-dot').forEach(dot => {
            dot.classList.remove('active');
        });
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
        }
    }

    scheduleNote(time) {
        this.playSound(time);
        this.updateVisualIndicator();
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
        this.currentBeat = (this.currentBeat + 1) % this.timeSignature;
    }

    playSound(time) {
        if (!this.audioContext || this.audioContext.state !== 'running') {
            console.log('Audio context not ready, skipping sound');
            return;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Configure sound based on type
            switch (this.soundType) {
                case 'click':
                    oscillator.frequency.setValueAtTime(800, time);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.5, time);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                    break;
                case 'beep':
                    oscillator.frequency.setValueAtTime(1000, time);
                    oscillator.type = 'square';
                    gainNode.gain.setValueAtTime(0.3, time);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
                    break;
                case 'tick':
                    oscillator.frequency.setValueAtTime(600, time);
                    oscillator.type = 'triangle';
                    gainNode.gain.setValueAtTime(0.6, time);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
                    break;
            }

            oscillator.start(time);
            oscillator.stop(time + 0.1);
            
            console.log('Sound played at time:', time, 'BPM:', this.bpm);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    updateVisualIndicator() {
        const beatIndicator = document.getElementById('beatIndicator');
        const beatDots = document.querySelectorAll('.beat-dot');

        // Pulse animation
        beatIndicator.classList.add('pulse');
        setTimeout(() => {
            beatIndicator.classList.remove('pulse');
        }, 100);

        // Update beat dots
        beatDots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === this.currentBeat) {
                dot.classList.add('active');
            }
        });

        // Highlight first beat differently
        if (this.currentBeat === 0) {
            beatIndicator.classList.add('active');
        } else {
            beatIndicator.classList.remove('active');
        }

        console.log('Visual indicator updated - Beat:', this.currentBeat + 1, 'of', this.timeSignature);
    }

    testSound() {
        if (!this.audioContext) {
            this.initializeAudio();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.playTestSound();
            });
        } else {
            this.playTestSound();
        }
    }

    playTestSound() {
        const time = this.audioContext.currentTime;
        this.playSound(time);
        console.log('Test sound played');
    }
}

// Initialize the metronome when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Metronome();
});

// Add some helpful instructions
console.log(`
🎵 Metronome Controls:
- Space: Play/Pause
- Escape: Stop
- T: Test sound
`); 