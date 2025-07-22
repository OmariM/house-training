class PracticeMode {
    constructor() {
        this.sequence = [];
        this.currentMoveIndex = 0;
        this.currentCount = 1;
        this.isInIntro = true;
        this.introCount = 1; // Start at 1, not 8
        this.metronome = null;
        this.practiceInterval = null;
        this.isZenMode = false;
        
        this.loadSequenceFromStorage();
        this.setupEventListeners();
        this.initializeMetronome();
        this.displaySequence();
    }

    loadSequenceFromStorage() {
        const savedSequence = localStorage.getItem('practiceSequence');
        if (savedSequence) {
            this.sequence = JSON.parse(savedSequence);
        }
        
        // Check if zen mode is enabled
        const zenMode = localStorage.getItem('zenMode');
        this.isZenMode = zenMode === 'true';
        console.log('Zen mode enabled:', this.isZenMode);
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    initializeMetronome() {
        // Create a new metronome instance for practice mode
        this.metronome = new Metronome();
        
        // Flag to prevent practice display updates during button clicks
        this.skipPracticeUpdate = false;
        
        // Override the metronome's visual indicator to include practice logic
        const originalUpdateVisualIndicator = this.metronome.updateVisualIndicator.bind(this.metronome);
        this.metronome.updateVisualIndicator = () => {
            originalUpdateVisualIndicator();
            if (!this.skipPracticeUpdate) {
                this.updatePracticeDisplay();
            }
        };
        
        // Override the toggle methods to prevent count advancement
        const originalToggleSubdivision = this.metronome.toggleSubdivision.bind(this.metronome);
        this.metronome.toggleSubdivision = () => {
            this.skipPracticeUpdate = true;
            originalToggleSubdivision();
            this.skipPracticeUpdate = false;
        };
        
        const originalToggleEmphasis = this.metronome.toggleEmphasis.bind(this.metronome);
        this.metronome.toggleEmphasis = () => {
            this.skipPracticeUpdate = true;
            originalToggleEmphasis();
            this.skipPracticeUpdate = false;
        };
    }

    displaySequence() {
        const container = document.getElementById('sequenceDisplayPractice');
        if (!container) {
            console.error('Sequence display container not found');
            return;
        }
        
        container.innerHTML = '';
        
        if (this.sequence.length === 0) {
            console.log('No sequence to display');
            return;
        }
        
        this.sequence.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'practice-move';
            moveElement.textContent = `${index + 1}. ${move}`;
            moveElement.dataset.index = index;
            container.appendChild(moveElement);
        });
        
        console.log('Sequence displayed:', this.sequence);
    }

    generateNewSequence() {
        console.log('generateNewSequence() called');
        
        // Load moves and transitions from localStorage
        const savedConfig = localStorage.getItem('danceConfig');
        console.log('Saved config from localStorage:', savedConfig);
        
        if (!savedConfig) {
            console.log('No saved config found in localStorage');
            return;
        }
        
        try {
            const config = JSON.parse(savedConfig);
            const moves = config.moves || [];
            const transitions = config.transitions || {};
            
            console.log('Parsed config - moves:', moves, 'transitions:', transitions);
            
            if (moves.length === 0) {
                console.log('No moves found in config');
                return;
            }
            
            // Generate a random sequence
            const randomStartMove = moves[Math.floor(Math.random() * moves.length)];
            const sequenceLength = this.sequence.length; // Keep same length
            
            console.log('Generating new sequence with length:', sequenceLength);
            console.log('Available moves:', moves);
            console.log('Available transitions:', transitions);
            
            this.sequence = [randomStartMove];
            
            for (let i = 1; i < sequenceLength; i++) {
                const lastMove = this.sequence[i - 1];
                
                // Get possible transitions for the last move
                const possibleTransitions = transitions[lastMove] || [];
                
                if (possibleTransitions.length > 0) {
                    // Choose a random transition
                    const nextMove = possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)];
                    this.sequence.push(nextMove);
                } else {
                    // If no transitions defined, choose any move
                    const randomMove = moves[Math.floor(Math.random() * moves.length)];
                    this.sequence.push(randomMove);
                }
            }
            
            // Reset sequence state
            this.currentMoveIndex = 0;
            this.currentCount = 1;
            
            // Update display
            this.displaySequence();
            
            // Force a visual update to ensure the new sequence is visible
            setTimeout(() => {
                this.displaySequence();
            }, 100);
            
            console.log('New sequence generated:', this.sequence);
            
        } catch (error) {
            console.error('Error generating new sequence:', error);
        }
    }

    updatePracticeDisplay() {
        const countDisplay = document.getElementById('countDisplay');
        const currentMoveDisplay = document.getElementById('currentMove');
        const moveElements = document.querySelectorAll('.practice-move');
        
        // Update on every quarter note (main beat)
        if (this.metronome.currentEighth % 2 === 0) { // Even eighth notes = main beats
            console.log('Quarter note beat. Current eighth:', this.metronome.currentEighth, 'Current beat:', this.metronome.currentBeat);
            if (this.isInIntro) {
                // Intro phase - show countdown
                countDisplay.textContent = this.introCount;
                currentMoveDisplay.textContent = 'Get Ready...';
                
                // Generate new sequence for zen mode on the first beat of intro
                if (this.introCount === 1 && this.isZenMode) {
                    console.log('Zen mode active, generating new sequence on first beat of intro...');
                    this.generateNewSequence();
                }
                
                // Show moves but fade them
                moveElements.forEach(element => {
                    element.classList.remove('active', 'completed');
                    element.style.opacity = '0.3';
                });
                
                this.introCount++;
                if (this.introCount > 8) {
                    this.isInIntro = false;
                    this.currentMoveIndex = 0;
                    this.currentCount = 1;
                }
            } else {
                // Practice phase - show current move
                countDisplay.textContent = this.currentCount;
                
                // Update move elements
                moveElements.forEach((element, index) => {
                    element.classList.remove('active', 'completed');
                    element.style.opacity = '1';
                    
                    if (index < this.currentMoveIndex) {
                        element.classList.add('completed');
                    } else if (index === this.currentMoveIndex) {
                        element.classList.add('active');
                        currentMoveDisplay.textContent = this.sequence[index];
                    }
                });
                
                // Check if sequence is complete before progressing
                if (this.currentMoveIndex >= this.sequence.length - 1) {
                    // Progress to the final move
                    this.currentMoveIndex++;
                    this.currentCount++;
                    console.log('Final move. Index:', this.currentMoveIndex, 'Count:', this.currentCount, 'Sequence length:', this.sequence.length);
                    
                    // Check if we've completed the final move
                    if (this.currentMoveIndex >= this.sequence.length) {
                        console.log('Sequence complete! Current index:', this.currentMoveIndex, 'Sequence length:', this.sequence.length);
                        this.isInIntro = true;
                        this.introCount = 1;
                    }
                } else {
                    // Progress to next move only if sequence isn't complete
                    this.currentMoveIndex++;
                    this.currentCount++;
                    console.log('Move progressed. Index:', this.currentMoveIndex, 'Count:', this.currentCount, 'Sequence length:', this.sequence.length);
                }
            }
        }
    }
}

// Initialize practice mode when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PracticeMode();
}); 