# 🎵 Metronome - House Training

A modern, responsive web-based metronome built with HTML, CSS, and JavaScript. Perfect for house training and music practice!

## Features

- **Precise Timing**: Uses Web Audio API for accurate timing
- **Visual Feedback**: Beat indicators and visual metronome display
- **Multiple Sound Types**: Click, beep, and tick sounds
- **Time Signatures**: Support for 2/4, 3/4, 4/4, and 6/8
- **BPM Range**: 40-200 BPM with fine control
- **Keyboard Shortcuts**: Quick access to controls
- **Responsive Design**: Works on desktop and mobile devices

## Controls

### Mouse/Touch
- **BPM Input**: Type your desired BPM (40-200)
- **Preset Buttons**: Quick access to common tempos (60, 90, 120, 140, 160 BPM)
- **+/- Buttons**: Fine-tune BPM by 1
- **Play/Pause**: Start or pause the metronome
- **Stop**: Stop and reset the metronome
- **Settings**: Choose time signature and sound type

### Keyboard Shortcuts
- **Space**: Play/Pause
- **Escape**: Stop
- **Arrow Up**: Increase BPM by 1
- **Arrow Down**: Decrease BPM by 1

## Getting Started

1. Open `index.html` in a modern web browser
2. Set your desired BPM using the input field or preset buttons
3. Choose your time signature and sound type
4. Click "Start" or press Space to begin
5. The visual indicators will show the current beat

## Technical Details

- **Audio Engine**: Web Audio API with precise scheduling
- **Timing**: Uses `setInterval` with lookahead scheduling for accuracy
- **Sounds**: Generated using oscillators (sine, square, triangle waves)
- **Responsive**: CSS Grid and Flexbox for mobile-friendly design
- **Performance**: Optimized for smooth playback and visual feedback

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

This project uses vanilla JavaScript with no external dependencies. The code is organized into a single `Metronome` class that handles all functionality.

### File Structure
```
house-training/
├── index.html      # Main HTML structure
├── styles.css      # Modern CSS styling
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## License

MIT License - feel free to use and modify as needed!

---

Built with ❤️ for house training and music practice.
