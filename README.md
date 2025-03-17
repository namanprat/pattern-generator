# Chladni Plate Music Visualizer

A web-based audio visualizer that creates symmetric patterns inspired by Chladni plates, which respond to music in real-time.

## Features

- Upload and play any audio file
- Real-time visualization with 16:9 canvas
- Particle-based visualization with Chladni-inspired symmetric patterns
- Multiple visualization modes:
  - Classic Chladni: Traditional Chladni plate patterns
  - Wave Interference: Patterns based on wave interference phenomena
  - Radial: Circular patterns that emanate from the center
  - Spectrum Adaptive: Patterns that adapt to different frequency bands
  - Auto Mode: Automatically selects the best pattern based on music characteristics
- Frequency Band Selection:
  - Focus on bass, mids, or treble frequencies
  - Dynamic mode that follows the dominant frequency band in the music
- Adjustable parameters:
  - Frequency Scale: Controls how strongly frequencies affect the pattern
  - Particle Count: Adjusts the number of particles in the visualization
  - Symmetry Lines: Changes the complexity of the pattern
  - Sensitivity: Controls how strongly particles respond to the audio
  - Color Shift: Adjusts the color palette of the visualization

## About Chladni Patterns

[Ernst Chladni](https://en.wikipedia.org/wiki/Ernst_Chladni) was a physicist and musician who discovered that when a plate covered with sand is vibrated at specific frequencies, the sand forms distinctive patterns. These patterns, now known as Chladni figures, reveal the nodal lines where the plate does not vibrate.

This visualizer creates digital interpretations of Chladni patterns by:
1. Analyzing frequency data from the audio input
2. Using mathematical functions to create symmetric patterns similar to Chladni figures
3. Animating particles that respond to these patterns, creating a dynamic visualization that changes with the music

## Why Different Songs Create Different Patterns

The visualizer now analyzes the frequency spectrum of your music and adapts the visualization in several ways:

1. **Frequency Analysis**: The app breaks down the music into bass, mid, and treble frequency bands
2. **Pattern Selection**: In Auto mode, the system selects different pattern types based on the dominant frequency characteristics
3. **Color Coding**: Particles are color-coded by frequency band (reds for bass, greens/blues for mids, purples for treble)
4. **Dynamic Adaptation**: The patterns continuously adapt to changes in the music

This approach ensures that each song creates a unique visual representation based on its specific audio characteristics.

## How to Use

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
2. Click the file input to upload an audio file
3. Press the "Play" button to start playback and visualization
4. Try different Pattern Modes and Frequency Emphasis settings to find interesting visualizations
5. Adjust the sliders to modify the visualization parameters
6. Click the "Help" button for more information

## Technical Details

- Uses the Web Audio API for audio processing with advanced frequency analysis
- HTML5 Canvas for visualization
- Pure vanilla JavaScript with no external dependencies
- Responsive design that adapts to different screen sizes

## Browser Support

This application works best in modern browsers with support for the Web Audio API and Canvas API. 