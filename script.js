class Metronome {
    constructor() {
        this.bpm = 120;
        this.isPlaying = false;
        this.interval = null;
        this.currentBeat = 0;
        this.currentEighth = 0;
        this.timeSignature = 4;
        this.soundType = 'click';
        this.subdivisionEnabled = true;
        this.emphasisEnabled = true;
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
        // BPM input (only on main page)
        const bpmInput = document.getElementById('bpmInput');
        if (bpmInput) {
            bpmInput.addEventListener('input', (e) => {
                this.setBpm(parseInt(e.target.value) || 120);
            });
        }

        // Playback controls
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.togglePlay();
            });
        }

        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stop();
            });
        }

        // Settings
        const timeSignature = document.getElementById('timeSignature');
        if (timeSignature) {
            timeSignature.addEventListener('change', (e) => {
                this.timeSignature = parseInt(e.target.value);
            });
        }

        const soundType = document.getElementById('soundType');
        if (soundType) {
            soundType.addEventListener('change', (e) => {
                this.soundType = e.target.value;
            });
        }

        // Subdivision toggle
        const toggleSubdivision = document.getElementById('toggleSubdivision');
        if (toggleSubdivision) {
            toggleSubdivision.addEventListener('click', () => {
                this.toggleSubdivision();
            });
        }

        // Emphasis toggle
        const toggleEmphasis = document.getElementById('toggleEmphasis');
        if (toggleEmphasis) {
            toggleEmphasis.addEventListener('click', () => {
                this.toggleEmphasis();
            });
        }

        // Keyboard shortcuts (only on main page)
        if (document.getElementById('bpmInput')) { // Only add keyboard shortcuts on main page
            document.addEventListener('keydown', (e) => {
                // Don't trigger shortcuts if user is typing in an input field
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                    return;
                }
                
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

    toggleSubdivision() {
        this.subdivisionEnabled = !this.subdivisionEnabled;
        
        // Update button appearance
        const button = document.getElementById('toggleSubdivision');
        if (button) {
            if (this.subdivisionEnabled) {
                button.classList.remove('quarter-mode');
            } else {
                button.classList.add('quarter-mode');
            }
        }
        
        // Update visual display
        this.updateVisualIndicator();
        
        console.log('Subdivision toggled:', this.subdivisionEnabled ? '8th notes' : 'Quarter notes');
    }

    toggleEmphasis() {
        this.emphasisEnabled = !this.emphasisEnabled;
        
        // Update button appearance
        const button = document.getElementById('toggleEmphasis');
        if (button) {
            if (this.emphasisEnabled) {
                button.classList.remove('equal-mode');
            } else {
                button.classList.add('equal-mode');
            }
        }
        
        // Update visual display
        this.updateVisualIndicator();
        
        console.log('Emphasis toggled:', this.emphasisEnabled ? 'First beat emphasized' : 'Equal beats');
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
        this.currentEighth = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.add('playing');
            playBtn.innerHTML = '<span class="pause-icon">⏸</span>Pause';
        }

        // Start the scheduler
        this.schedulerInterval = setInterval(() => {
            this.scheduler();
        }, this.lookahead);

        console.log('Metronome started at', this.bpm, 'BPM');
    }

    stop() {
        this.isPlaying = false;
        this.currentBeat = 0;
        this.currentEighth = 0;
        
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }

        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.classList.remove('playing');
            playBtn.innerHTML = '<span class="play-icon">▶</span>Start';
        }

        // Reset visual indicators
        const beatIndicator = document.getElementById('beatIndicator');
        if (beatIndicator) {
            beatIndicator.classList.remove('active', 'pulse');
        }
        
        document.querySelectorAll('.beat-dot').forEach(dot => {
            dot.classList.remove('active');
        });
        document.querySelectorAll('.eighth-dot').forEach(dot => {
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
        
        if (this.subdivisionEnabled) {
            // 8th note mode
            this.nextNoteTime += secondsPerBeat / 2;
            this.currentEighth = (this.currentEighth + 1) % (this.timeSignature * 2);
            
            // Update beat counter every 2 eighth notes
            if (this.currentEighth % 2 === 0) {
                this.currentBeat = (this.currentBeat + 1) % this.timeSignature;
            }
        } else {
            // Quarter note mode
            this.nextNoteTime += secondsPerBeat;
            this.currentBeat = (this.currentBeat + 1) % this.timeSignature;
            this.currentEighth = this.currentBeat * 2; // Keep eighth counter in sync for display
        }
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

            // Determine if this is a main beat (even eighth notes) or off-beat (odd eighth notes)
            const isMainBeat = this.currentEighth % 2 === 0;
            
            // In quarter note mode, only play on main beats
            if (!this.subdivisionEnabled && !isMainBeat) {
                return;
            }
            
            // Determine if this is the first beat of the measure
            const isFirstBeat = this.currentBeat === 0;
            
            // Configure sound based on type, beat type, and emphasis
            switch (this.soundType) {
                case 'click':
                    if (isMainBeat) {
                        if (isFirstBeat && this.emphasisEnabled) {
                            oscillator.frequency.setValueAtTime(900, time);
                            gainNode.gain.setValueAtTime(0.7, time);
                        } else {
                            oscillator.frequency.setValueAtTime(800, time);
                            gainNode.gain.setValueAtTime(0.5, time);
                        }
                    } else {
                        oscillator.frequency.setValueAtTime(600, time);
                        gainNode.gain.setValueAtTime(0.3, time);
                    }
                    oscillator.type = 'sine';
                    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                    break;
                case 'beep':
                    if (isMainBeat) {
                        if (isFirstBeat && this.emphasisEnabled) {
                            oscillator.frequency.setValueAtTime(1200, time);
                            gainNode.gain.setValueAtTime(0.4, time);
                        } else {
                            oscillator.frequency.setValueAtTime(1000, time);
                            gainNode.gain.setValueAtTime(0.3, time);
                        }
                    } else {
                        oscillator.frequency.setValueAtTime(800, time);
                        gainNode.gain.setValueAtTime(0.2, time);
                    }
                    oscillator.type = 'square';
                    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
                    break;
                case 'tick':
                    if (isMainBeat) {
                        if (isFirstBeat && this.emphasisEnabled) {
                            oscillator.frequency.setValueAtTime(700, time);
                            gainNode.gain.setValueAtTime(0.8, time);
                        } else {
                            oscillator.frequency.setValueAtTime(600, time);
                            gainNode.gain.setValueAtTime(0.6, time);
                        }
                    } else {
                        oscillator.frequency.setValueAtTime(500, time);
                        gainNode.gain.setValueAtTime(0.4, time);
                    }
                    oscillator.type = 'triangle';
                    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
                    break;
            }

            oscillator.start(time);
            oscillator.stop(time + 0.1);
            
            console.log('Sound played at time:', time, 'BPM:', this.bpm, 'Eighth:', this.currentEighth, 'Main beat:', isMainBeat, 'First beat:', isFirstBeat, 'Emphasis:', this.emphasisEnabled);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    updateVisualIndicator() {
        const beatIndicator = document.getElementById('beatIndicator');
        const beatDots = document.querySelectorAll('.beat-dot');
        const eighthDots = document.querySelectorAll('.eighth-dot');

        // Pulse animation
        if (beatIndicator) {
            beatIndicator.classList.add('pulse');
            setTimeout(() => {
                beatIndicator.classList.remove('pulse');
            }, 100);
        }

        // Update beat dots
        beatDots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === this.currentBeat) {
                dot.classList.add('active');
            }
        });

        // Update eighth note dots
        eighthDots.forEach((dot, index) => {
            dot.classList.remove('active', 'on-beat');
            if (index === this.currentEighth) {
                dot.classList.add('active');
            }
            // Mark main beats (even eighth notes) with a different style
            if (index % 2 === 0) {
                dot.classList.add('on-beat');
            }
        });
        
        // Hide/show eighth notes based on subdivision setting
        const eighthNotesContainer = document.querySelector('.eighth-notes');
        if (eighthNotesContainer) {
            eighthNotesContainer.style.display = this.subdivisionEnabled ? 'flex' : 'none';
        }

        // Highlight first beat differently (only when emphasis is enabled)
        if (beatIndicator) {
            if (this.currentBeat === 0 && this.emphasisEnabled) {
                beatIndicator.classList.add('active');
            } else {
                beatIndicator.classList.remove('active');
            }
        }

        console.log('Visual indicator updated - Beat:', this.currentBeat + 1, 'of', this.timeSignature, 'Eighth:', this.currentEighth + 1);
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

// Dance Move Generator Class
class DanceMoveGenerator {
    constructor() {
        this.moves = [];
        this.transitions = {};
        this.currentSequence = [];
        this.currentSequenceIndex = 0;
        this.sequenceInterval = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add move
        document.getElementById('addMove').addEventListener('click', () => {
            this.addMove();
        });

        // Add transition
        document.getElementById('addTransition').addEventListener('click', () => {
            this.addTransition();
        });

        // Generate sequence
        document.getElementById('generateSequence').addEventListener('click', () => {
            this.generateSequence();
        });

        // Practice sequence
        document.getElementById('practiceSequenceBtn').addEventListener('click', () => {
            this.startPractice();
        });

        // Zen mode
        document.getElementById('zenModeBtn').addEventListener('click', () => {
            this.startZenMode();
        });

        // Save configuration
        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfiguration();
        });

        // Load configuration
        document.getElementById('loadConfig').addEventListener('click', () => {
            this.loadConfiguration();
        });

        // Enter key for move input
        document.getElementById('moveName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addMove();
            }
        });
    }

    addMove() {
        const moveName = document.getElementById('moveName').value.trim();
        if (moveName && !this.moves.includes(moveName)) {
            this.moves.push(moveName);
            this.updateMovesList();
            this.updateSelects();
            document.getElementById('moveName').value = '';
            this.saveConfigToStorage();
        }
    }

    removeMove(moveName) {
        this.moves = this.moves.filter(move => move !== moveName);
        
        // Remove transitions involving this move
        delete this.transitions[moveName];
        Object.keys(this.transitions).forEach(fromMove => {
            this.transitions[fromMove] = this.transitions[fromMove].filter(toMove => toMove !== moveName);
        });
        
        this.updateMovesList();
        this.updateSelects();
        this.updateTransitionsList();
        this.saveConfigToStorage();
    }

    updateMovesList() {
        const movesList = document.getElementById('movesList');
        movesList.innerHTML = '';
        
        this.moves.forEach(move => {
            const moveTag = document.createElement('div');
            moveTag.className = 'move-tag';
            moveTag.innerHTML = `
                ${move}
                <button class="remove" onclick="danceGenerator.removeMove('${move}')">×</button>
            `;
            movesList.appendChild(moveTag);
        });
        
        this.updateSequenceButtons();
    }

    updateSelects() {
        const selects = ['fromMove', 'toMove', 'startMove'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            
            select.innerHTML = `<option value="">${selectId === 'startMove' ? 'Starting move...' : selectId === 'fromMove' ? 'From move...' : 'To move...'}</option>`;
            
            this.moves.forEach(move => {
                const option = document.createElement('option');
                option.value = move;
                option.textContent = move;
                if (move === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        });
    }

    addTransition() {
        const fromMove = document.getElementById('fromMove').value;
        const toMove = document.getElementById('toMove').value;
        
        if (fromMove && toMove) {
            if (!this.transitions[fromMove]) {
                this.transitions[fromMove] = [];
            }
            
            if (!this.transitions[fromMove].includes(toMove)) {
                this.transitions[fromMove].push(toMove);
                this.updateTransitionsList();
                this.saveConfigToStorage();
            }
        }
    }

    removeTransition(fromMove, toMove) {
        if (this.transitions[fromMove]) {
            this.transitions[fromMove] = this.transitions[fromMove].filter(move => move !== toMove);
            if (this.transitions[fromMove].length === 0) {
                delete this.transitions[fromMove];
            }
            this.updateTransitionsList();
            this.saveConfigToStorage();
        }
    }

    updateTransitionsList() {
        const transitionsList = document.getElementById('transitionsList');
        transitionsList.innerHTML = '';
        
        Object.keys(this.transitions).forEach(fromMove => {
            this.transitions[fromMove].forEach(toMove => {
                const transitionItem = document.createElement('div');
                transitionItem.className = 'transition-item';
                transitionItem.innerHTML = `
                    <span>${fromMove} → ${toMove}</span>
                    <button class="remove" onclick="danceGenerator.removeTransition('${fromMove}', '${toMove}')">Remove</button>
                `;
                transitionsList.appendChild(transitionItem);
            });
        });
        
        this.updateSequenceButtons();
    }

    generateSequence() {
        const startMove = document.getElementById('startMove').value;
        const length = parseInt(document.getElementById('sequenceLength').value);
        
        if (!startMove || !this.moves.includes(startMove) || length < 1) {
            return;
        }
        
        this.currentSequence = [startMove];
        this.currentSequenceIndex = 0;
        
        for (let i = 1; i < length; i++) {
            const lastMove = this.currentSequence[i - 1];
            const possibleMoves = this.transitions[lastMove] || [];
            
            if (possibleMoves.length === 0) {
                // If no transitions defined, allow any move (including self)
                const randomMove = this.moves[Math.floor(Math.random() * this.moves.length)];
                this.currentSequence.push(randomMove);
            } else {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                this.currentSequence.push(randomMove);
            }
        }
        
        this.displaySequence();
        this.startSequenceAnimation();
        
        // Show sequence buttons
        const sequenceButtons = document.querySelector('.sequence-buttons');
        if (sequenceButtons) {
            sequenceButtons.style.display = 'flex';
        }
    }

    displaySequence() {
        const sequenceDisplay = document.getElementById('sequenceDisplay');
        sequenceDisplay.innerHTML = '';
        
        this.currentSequence.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'sequence-move';
            moveElement.textContent = move;
            moveElement.dataset.index = index;
            sequenceDisplay.appendChild(moveElement);
        });
    }

    startSequenceAnimation() {
        if (this.sequenceInterval) {
            clearInterval(this.sequenceInterval);
        }
        
        this.currentSequenceIndex = 0;
        this.updateCurrentMove();
        
        // Change move every 2 seconds (adjust timing as needed)
        this.sequenceInterval = setInterval(() => {
            this.currentSequenceIndex = (this.currentSequenceIndex + 1) % this.currentSequence.length;
            this.updateCurrentMove();
        }, 2000);
    }

    updateCurrentMove() {
        const moveElements = document.querySelectorAll('.sequence-move');
        moveElements.forEach((element, index) => {
            element.classList.remove('current');
            if (index === this.currentSequenceIndex) {
                element.classList.add('current');
            }
        });
    }

    stopSequenceAnimation() {
        if (this.sequenceInterval) {
            clearInterval(this.sequenceInterval);
            this.sequenceInterval = null;
        }
    }

    saveConfiguration() {
        const config = {
            moves: this.moves,
            transitions: this.transitions,
            version: '1.0'
        };
        
        const configString = JSON.stringify(config, null, 2);
        const textarea = document.getElementById('configString');
        textarea.value = configString;
        
        // Save to localStorage for zen mode
        localStorage.setItem('danceConfig', configString);
        
        // Select the text for easy copying
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        // Copy to clipboard
        try {
            navigator.clipboard.writeText(configString).then(() => {
                this.showNotification('Configuration copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotification('Configuration saved to text area. Copy manually.', 'info');
            });
        } catch (err) {
            this.showNotification('Configuration saved to text area. Copy manually.', 'info');
        }
    }

    loadConfiguration() {
        const configString = document.getElementById('configString').value.trim();
        
        if (!configString) {
            this.showNotification('Please paste a configuration string first.', 'error');
            return;
        }
        
        try {
            const config = JSON.parse(configString);
            
            // Validate the configuration
            if (!config.moves || !Array.isArray(config.moves)) {
                throw new Error('Invalid configuration: moves array is missing or invalid');
            }
            
            if (!config.transitions || typeof config.transitions !== 'object') {
                throw new Error('Invalid configuration: transitions object is missing or invalid');
            }
            
            // Clear current data
            this.moves = [];
            this.transitions = {};
            this.currentSequence = [];
            this.currentSequenceIndex = 0;
            this.stopSequenceAnimation();
            
            // Load the configuration
            this.moves = [...config.moves];
            this.transitions = { ...config.transitions };
            
            // Update the UI
            this.updateMovesList();
            this.updateSelects();
            this.updateTransitionsList();
            this.displaySequence();
            
            this.showNotification(`Loaded ${this.moves.length} moves and ${Object.keys(this.transitions).length} transition rules.`, 'success');
            
        } catch (error) {
            this.showNotification(`Error loading configuration: ${error.message}`, 'error');
        }
    }

    saveConfigToStorage() {
        const config = {
            moves: this.moves,
            transitions: this.transitions,
            version: '1.0'
        };
        localStorage.setItem('danceConfig', JSON.stringify(config));
    }

    updateSequenceButtons() {
        const sequenceButtons = document.querySelector('.sequence-buttons');
        if (sequenceButtons) {
            // Show buttons if there are moves and transitions
            const hasMoves = this.moves.length > 0;
            const hasTransitions = Object.keys(this.transitions).length > 0;
            
            if (hasMoves && hasTransitions) {
                sequenceButtons.style.display = 'flex';
                // Save config to localStorage for zen mode
                this.saveConfigToStorage();
            } else {
                sequenceButtons.style.display = 'none';
            }
        }
    }

    startPractice() {
        if (this.currentSequence.length === 0) {
            this.showNotification('Please generate a sequence first.', 'error');
            return;
        }
        
        // Save sequence to localStorage
        localStorage.setItem('practiceSequence', JSON.stringify(this.currentSequence));
        
        // Navigate to practice page
        window.location.href = 'practice.html';
    }

    startZenMode() {
        if (this.moves.length === 0) {
            this.showNotification('Please add some moves first.', 'error');
            return;
        }
        
        if (Object.keys(this.transitions).length === 0) {
            this.showNotification('Please add some transitions first.', 'error');
            return;
        }
        
        // Generate a random sequence for zen mode
        const randomStartMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        const sequenceLength = parseInt(document.getElementById('sequenceLength').value) || 8;
        
        this.currentSequence = [randomStartMove];
        
        for (let i = 1; i < sequenceLength; i++) {
            const lastMove = this.currentSequence[i - 1];
            
            // Get possible transitions for the last move
            const possibleTransitions = this.transitions[lastMove] || [];
            
            if (possibleTransitions.length > 0) {
                // Choose a random transition
                const nextMove = possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)];
                this.currentSequence.push(nextMove);
            } else {
                // If no transitions defined, choose any move
                const randomMove = this.moves[Math.floor(Math.random() * this.moves.length)];
                this.currentSequence.push(randomMove);
            }
        }
        
        // Save sequence and zen mode flag to localStorage
        localStorage.setItem('practiceSequence', JSON.stringify(this.currentSequence));
        localStorage.setItem('zenMode', 'true');
        
        // Navigate to practice page
        window.location.href = 'practice.html';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'info':
            default:
                notification.style.backgroundColor = '#667eea';
                break;
        }
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the metronome and dance generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Metronome();
    window.danceGenerator = new DanceMoveGenerator();
});

// Add some helpful instructions
console.log(`
🎵 Metronome Controls:
- Space: Play/Pause
- Escape: Stop
- T: Test sound

💃 Dance Move Generator:
- Add moves and define transitions
- Generate random sequences
- Watch the current move highlight
`); 