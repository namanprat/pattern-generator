let dominantFreqBand = 'all'; // Initialize with default value

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const audioInput = document.getElementById('audio-input');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    
    // Get parameter controls
    const frequencyScale = document.getElementById('frequency-scale');
    const particleCount = document.getElementById('particle-count');
    const symmetryLines = document.getElementById('symmetry');
    const sensitivity = document.getElementById('sensitivity');
    const color1 = document.getElementById('color1');
    const color2 = document.getElementById('color2');
    
    // Audio context and elements
    let audioContext;
    let audioSource;
    let audioBuffer;
    let analyser;
    let dataArray;
    let isPlaying = false;
    
    // For better frequency analysis
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let songSignature = {};
    
    // Canvas dimensions (16:9 ratio)
    let canvasWidth, canvasHeight;
    
    // Visualization elements
    let particles = [];
    
    // Initialize canvas and resize it to maintain 16:9 aspect ratio
    function resizeCanvas() {
        canvasWidth = canvas.clientWidth;
        canvasHeight = canvas.clientHeight;
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }
    
    // Initialize the audio context with better analyzer settings
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            // Increase FFT size for better frequency resolution
            analyser.fftSize = 8192;
            analyser.smoothingTimeConstant = 0.8;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }
    }
    
    // Analyze frequency spectrum and determine song characteristics
    function analyzeSongSignature() {
        if (!dataArray) return;
        
        // Get frequency data
        analyser.getByteFrequencyData(dataArray);
        
        // Define frequency bands (roughly)
        const bassRange = Math.floor(dataArray.length * 0.1); // ~0-200Hz
        const midRange = Math.floor(dataArray.length * 0.3);  // ~200-2000Hz
        const trebleRange = dataArray.length;                 // ~2000Hz+
        
        // Calculate energy in each band
        bassSum = 0;
        midSum = 0;
        trebleSum = 0;
        
        for (let i = 0; i < bassRange; i++) {
            bassSum += dataArray[i];
        }
        
        for (let i = bassRange; i < midRange; i++) {
            midSum += dataArray[i];
        }
        
        for (let i = midRange; i < trebleRange; i++) {
            trebleSum += dataArray[i];
        }
        
        // Normalize
        bassSum /= bassRange;
        midSum /= (midRange - bassRange);
        trebleSum /= (trebleRange - midRange);
        
        // Determine dominant frequency band
        if (bassSum > midSum && bassSum > trebleSum) {
            dominantFreqBand = 'bass';
        } else if (midSum > bassSum && midSum > trebleSum) {
            dominantFreqBand = 'mid';
        } else {
            dominantFreqBand = 'treble';
        }
        
        // Dynamic pattern selection based on song characteristics
        if (document.getElementById('pattern-mode').value === 'auto') {
            if (dominantFreqBand === 'bass') {
                songSignature.suggestedPattern = 'radial';
            } else if (dominantFreqBand === 'mid') {
                songSignature.suggestedPattern = 'classic';
            } else {
                songSignature.suggestedPattern = 'wave';
            }
        }
        
        // Update frequency emphasis if set to dynamic
        if (document.getElementById('freq-emphasis').value === 'dynamic') {
            // Visual feedback that it's changing (optional)
            document.getElementById('freq-emphasis').style.borderColor = 
                dominantFreqBand === 'bass' ? '#ff5555' : 
                dominantFreqBand === 'mid' ? '#55ff55' : '#5555ff';
        }
        
        // Update info panel
        updateInfoPanel({
            bass: bassSum,
            mid: midSum,
            treble: trebleSum,
            full: (bassSum + midSum + trebleSum) / 3
        });
    }
    
    // Handle audio file input
    audioInput.addEventListener('change', async (e) => {
        if (!e.target.files.length) return;
        
        initAudio();
        
        try {
            const file = e.target.files[0];
            const arrayBuffer = await file.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Reset song signature for new file
            songSignature = {
                fileName: file.name,
                suggestedPattern: 'classic'
            };
            
            // Enable play button
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            
            // Create particles based on settings
            createParticles();
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('Could not load audio file. Please try another file.');
        }
    });
    
    // Play the loaded audio
    playBtn.addEventListener('click', () => {
        if (!audioBuffer) return;
        
        if (isPlaying) {
            if (audioSource) {
                audioSource.stop();
            }
        }
        
        // Create a new source
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Start playback
        audioSource.start(0);
        isPlaying = true;
        
        // Update buttons
        playBtn.disabled = true;
        pauseBtn.disabled = false;
        
        // Start visualization
        if (!animationId) {
            animate();
        }
    });
    
    // Pause playback
    pauseBtn.addEventListener('click', () => {
        if (isPlaying && audioSource) {
            audioSource.stop();
            isPlaying = false;
            
            // Update buttons
            playBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    });
    
    // Create particles for visualization
    function createParticles() {
        particles = [];
        const count = parseInt(particleCount.value);
        
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                size: Math.random() * 2 + 1,
                color: 0, // Will be set during animation
                vx: 0,
                vy: 0,
                // Add properties for more complex behaviors
                phase: Math.random() * Math.PI * 2,
                group: Math.floor(Math.random() * 3) // For grouping particles by frequency bands
            });
        }
    }
    
    // Generate multi-mode Chladni-like patterns
    function patternFunction(x, y, freqData) {
        // Normalize coordinates to [-1, 1]
        const normX = (x / canvasWidth) * 2 - 1;
        const normY = (y / canvasHeight) * 2 - 1;
        
        // Get parameters
        const n = parseInt(symmetryLines.value);
        const freqScale = parseInt(frequencyScale.value) / 10;
        const currentMode = document.getElementById('pattern-mode').value === 'auto' 
                            ? songSignature.suggestedPattern
                            : document.getElementById('pattern-mode').value;
        
        // Get frequency emphasis
        const emphasis = document.getElementById('freq-emphasis').value === 'dynamic'
                          ? dominantFreqBand
                          : document.getElementById('freq-emphasis').value;
        
        // Calculate frequency ratios for more dynamic patterns
        const bassRatio = freqData.bass / 255;
        const midRatio = freqData.mid / 255;
        const trebleRatio = freqData.treble / 255;
        
        // Calculate overall energy for scaling
        const totalEnergy = (bassRatio + midRatio + trebleRatio) / 3;
        
        // Dynamic frequency scaling based on audio content
        const dynamicScale = freqScale * (1 + totalEnergy);
        
        // Calculate pattern variations based on frequency content
        const bassInfluence = Math.sin(Math.PI * 2 * bassRatio);
        const midInfluence = Math.sin(Math.PI * 2 * midRatio);
        const trebleInfluence = Math.sin(Math.PI * 2 * trebleRatio);
        
        // Generate pattern based on selected mode
        let result;
        
        switch (currentMode) {
            case 'classic':
                // Enhanced classic Chladni pattern
                const xFreq = n * (1 + bassInfluence * 0.5);
                const yFreq = n * (1 + trebleInfluence * 0.5);
                result = Math.sin(xFreq * Math.PI * normX * dynamicScale) * 
                         Math.sin(yFreq * Math.PI * normY * dynamicScale);
                // Add frequency-dependent variation
                result += (bassInfluence * 0.3) * Math.sin(2 * Math.PI * Math.sqrt(normX * normX + normY * normY));
                break;
                
            case 'wave':
                // Enhanced wave interference pattern
                const waveX = Math.sin(n * Math.PI * normX * dynamicScale * (1 + bassRatio));
                const waveY = Math.sin(n * Math.PI * normY * dynamicScale * (1 + trebleRatio));
                result = (waveX + waveY) * (1 + midInfluence);
                // Add circular waves based on bass
                result += bassInfluence * Math.sin(4 * Math.PI * Math.sqrt(normX * normX + normY * normY));
                // Normalize to [-1, 1]
                result = Math.sin(result * Math.PI);
                break;
                
            case 'radial':
                // Enhanced radial/circular pattern
                const dist = Math.sqrt(normX * normX + normY * normY);
                const angle = Math.atan2(normY, normX);
                // Multiple frequency-dependent waves
                const radialWave = Math.sin(n * angle * (1 + midInfluence)) * 
                                  Math.cos(2 * Math.PI * dist * dynamicScale * (1 + bassInfluence));
                const spiralWave = Math.sin(n * (angle + dist * 5) * (1 + trebleInfluence));
                result = radialWave * 0.7 + spiralWave * 0.3;
                break;
                
            case 'spectrum':
                // Enhanced spectrum-adaptive pattern
                const radialComp = Math.sin(2 * Math.PI * Math.sqrt(normX * normX + normY * normY) * 
                                      dynamicScale * (1 + bassRatio * 2));
                const xComp = Math.sin(n * Math.PI * normX * dynamicScale * (1 + midRatio * 2));
                const yComp = Math.sin(n * Math.PI * normY * dynamicScale * (1 + trebleRatio * 2));
                
                // Dynamic mixing based on frequency content
                const bassWeight = 0.4 + bassRatio * 0.3;
                const midWeight = 0.3 + midRatio * 0.3;
                const trebleWeight = 0.3 + trebleRatio * 0.3;
                
                // Normalize weights
                const totalWeight = bassWeight + midWeight + trebleWeight;
                result = (radialComp * bassWeight + xComp * midWeight + yComp * trebleWeight) / totalWeight;
                
                // Add frequency-dependent turbulence
                result += (bassInfluence * Math.sin(4 * Math.PI * dist) +
                          midInfluence * Math.sin(6 * Math.PI * normX) +
                          trebleInfluence * Math.sin(6 * Math.PI * normY)) * 0.2;
                break;
                
            default:
                // Enhanced default pattern
                result = Math.sin(n * Math.PI * normX * dynamicScale) * 
                         Math.sin(n * Math.PI * normY * dynamicScale);
                break;
        }
        
        return result;
    }
    
    // Animation loop for the visualization
    let animationId;
    let frameCount = 0;
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        frameCount++;
        
        // Clear the canvas with dynamic fade based on energy
        if (isPlaying && dataArray) {
            const energy = Math.max(bassSum, midSum, trebleSum) / 255;
            const alpha = 0.15 + (0.1 * (1 - energy)); // More energy = faster fade
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        }
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        if (isPlaying) {
            // Get frequency data
            analyser.getByteFrequencyData(dataArray);
            
            // Analyze song characteristics every few frames
            if (frameCount % 30 === 0) {
                analyzeSongSignature();
            }
            
            // Get current parameter values
            const sens = parseInt(sensitivity.value) / 50;
            
            // Prepare frequency data for pattern function
            const frequencyData = {
                bass: 0,
                mid: 0,
                treble: 0,
                full: 0
            };
            
            // Calculate average values for each frequency band
            const bassEnd = Math.floor(dataArray.length * 0.1);
            const midEnd = Math.floor(dataArray.length * 0.3);
            
            let bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;
            
            for (let i = 0; i < bassEnd; i++) {
                bassSum += dataArray[i];
            }
            for (let i = bassEnd; i < midEnd; i++) {
                midSum += dataArray[i];
            }
            for (let i = midEnd; i < dataArray.length; i++) {
                trebleSum += dataArray[i];
            }
            
            // Normalize
            frequencyData.bass = bassSum / bassEnd;
            frequencyData.mid = midSum / (midEnd - bassEnd);
            frequencyData.treble = trebleSum / (dataArray.length - midEnd);
            frequencyData.full = (frequencyData.bass + frequencyData.mid + frequencyData.treble) / 3;
            
            // Update info panel
            updateInfoPanel(frequencyData);
            
            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Get frequency value based on particle group
                let frequencyValue;
                if (p.group === 0) {
                    frequencyValue = frequencyData.bass;
                } else if (p.group === 1) {
                    frequencyValue = frequencyData.mid;
                } else {
                    frequencyValue = frequencyData.treble;
                }
                
                // Calculate pattern value at particle position
                const patternValue = patternFunction(p.x, p.y, frequencyData);
                
                // Enhanced particle movement
                const baseSpeed = sens * (0.5 + frequencyValue / 255);
                p.vx = patternValue * baseSpeed;
                p.vy = patternValue * baseSpeed;
                
                // Add frequency-dependent turbulence
                if (document.getElementById('pattern-mode').value === 'wave' || 
                    document.getElementById('pattern-mode').value === 'spectrum') {
                    const turbulence = (frequencyValue / 255) * sens * 0.4;
                    p.vx += Math.sin(frameCount * 0.01 + p.phase) * turbulence;
                    p.vy += Math.cos(frameCount * 0.01 + p.phase) * turbulence;
                }
                
                // Add slight attraction to center for better pattern formation
                const dx = canvasWidth / 2 - p.x;
                const dy = canvasHeight / 2 - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const centerPull = 0.001 * sens;
                p.vx += dx / dist * centerPull;
                p.vy += dy / dist * centerPull;
                
                // Update position with momentum
                p.vx *= 0.98; // Add slight friction
                p.vy *= 0.98;
                p.x += p.vx;
                p.y += p.vy;
                
                // Wrap around edges
                if (p.x < 0) p.x = canvasWidth;
                if (p.x > canvasWidth) p.x = 0;
                if (p.y < 0) p.y = canvasHeight;
                if (p.y > canvasHeight) p.y = 0;
                
                // Color calculation using the two selected colors
                const colorFactor = (Math.sin(patternValue * Math.PI) + 1) / 2; // normalize to 0-1
                p.color = interpolateColors(color1.value, color2.value, colorFactor);
                
                // Draw particle
                const dynamicSize = p.size * (1 + (frequencyValue / 255) * 0.5);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, dynamicSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Handle parameter changes
    particleCount.addEventListener('change', createParticles);
    
    // Make pattern mode and frequency emphasis recreate particles too
    document.getElementById('pattern-mode').addEventListener('change', createParticles);
    document.getElementById('freq-emphasis').addEventListener('change', createParticles);
    
    // Initial setup
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Add touchstart listeners for mobile users
    canvas.addEventListener('touchstart', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    });
    
    // Add value displays to range inputs
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const display = input.nextElementSibling;
        if (display && display.classList.contains('value-display')) {
            display.textContent = input.value;
            input.addEventListener('input', () => {
                display.textContent = input.value;
            });
        }
    });
    
    // Setup help tooltip
    const helpBtn = document.getElementById('help-btn');
    const helpTooltip = document.getElementById('help-tooltip');
    
    if (helpBtn && helpTooltip) {
        helpBtn.addEventListener('click', () => {
            helpTooltip.style.display = helpTooltip.style.display === 'none' ? 'block' : 'none';
        });
        
        // Close tooltip when clicking outside
        document.addEventListener('click', (e) => {
            if (!helpTooltip.contains(e.target) && e.target !== helpBtn) {
                helpTooltip.style.display = 'none';
            }
        });
    }
});

function updateInfoPanel(frequencyData) {
    // Update frequency bars
    const bassBar = document.querySelector('.freq-bar.bass .bar-fill');
    const midBar = document.querySelector('.freq-bar.mid .bar-fill');
    const trebleBar = document.querySelector('.freq-bar.treble .bar-fill');
    
    if (bassBar && midBar && trebleBar) {
        bassBar.style.height = `${(frequencyData.bass / 255) * 100}%`;
        midBar.style.height = `${(frequencyData.mid / 255) * 100}%`;
        trebleBar.style.height = `${(frequencyData.treble / 255) * 100}%`;
    }
    
    // Update current mode
    const currentMode = document.querySelector('.current-mode .value');
    if (currentMode) {
        const mode = document.getElementById('pattern-mode').value;
        currentMode.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }
    
    // Update dominant frequency
    const dominantFreq = document.querySelector('.dominant-freq .value');
    if (dominantFreq) {
        dominantFreq.textContent = dominantFreqBand.charAt(0).toUpperCase() + dominantFreqBand.slice(1);
    }
}

// Function to interpolate between two colors
function interpolateColors(color1, color2, factor) {
    // Convert hex to RGB
    const c1 = {
        r: parseInt(color1.slice(1,3), 16),
        g: parseInt(color1.slice(3,5), 16),
        b: parseInt(color1.slice(5,7), 16)
    };
    const c2 = {
        r: parseInt(color2.slice(1,3), 16),
        g: parseInt(color2.slice(3,5), 16),
        b: parseInt(color2.slice(5,7), 16)
    };
    
    // Interpolate
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
} 