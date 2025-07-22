class PracticeMode {
    constructor() {
        this.sequence = [];
        this.currentMoveIndex = 0;
        this.currentCount = 1;
        this.isInIntro = true;
        this.introCount = 1; // Start at 1, not 8
        this.metronome = null;
        this.practiceInterval = null;
        
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
        container.innerHTML = '';
        
        this.sequence.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'practice-move';
            moveElement.textContent = `${index + 1}. ${move}`;
            moveElement.dataset.index = index;
            container.appendChild(moveElement);
        });
    }

    updatePracticeDisplay() {
        const countDisplay = document.getElementById('countDisplay');
        const currentMoveDisplay = document.getElementById('currentMove');
        const moveElements = document.querySelectorAll('.practice-move');
        
        // Update on every quarter note (main beat)
        if (this.metronome.currentEighth % 2 === 0) { // Even eighth notes = main beats
            if (this.isInIntro) {
                // Intro phase - show countdown
                countDisplay.textContent = this.introCount;
                currentMoveDisplay.textContent = 'Get Ready...';
                
                // Fade all moves
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
                
                // Progress to next move
                this.currentMoveIndex++;
                this.currentCount++;
                
                // Check if sequence is complete and transition immediately to intro
                if (this.currentMoveIndex >= this.sequence.length) {
                    this.isInIntro = true;
                    this.introCount = 1;
                }
            }
        }
    }
}

// Initialize practice mode when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PracticeMode();
}); 