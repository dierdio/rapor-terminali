// === CRT & NOISE OVERLAYS ===
document.addEventListener('DOMContentLoaded', () => {
    const crtOverlay = document.createElement('div');
    crtOverlay.id = 'crt-overlay';
    document.body.appendChild(crtOverlay);

    
});

// === DYNAMIC GLOW CURSOR ===
const glow = document.createElement('div');
glow.className = 'dynamic-glow';
document.body.appendChild(glow);

let isMouseMoving = false;
let mouseTimeout;

document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    glow.style.opacity = '1';
    
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
        glow.style.opacity = '0';
    }, 1500);
});

// === AUDIO EFFECTS (Web Audio API) ===
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let bgmOsc;
let isAudioInitialized = false;

function initAudio() {
    if (isAudioInitialized) return;
    audioCtx = new AudioContext();
    
    // Background Hum (Low frequency)
    bgmOsc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    bgmOsc.type = 'sine';
    bgmOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // Low hum
    
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime); // Very quiet
    
    bgmOsc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // bgmOsc.start();
    isAudioInitialized = true;
}

// Play a short synth 'blip' for typing
function playTypingSound() {
    if (!audioCtx || window.T62_SFX === false) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200 + Math.random() * 100, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

// Play a 'blip' for hover/focus
function playHoverSound() {
    if (!audioCtx || window.T62_SFX === false) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Initialize audio on first user interaction
document.body.addEventListener('click', initAudio, { once: true });
document.body.addEventListener('keydown', initAudio, { once: true });

// Attach sounds to inputs and buttons dynamically
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        playTypingSound();
    }
});

// Use event delegation for hover sounds to apply to dynamically created elements
document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.classList.contains('sb-item') || e.target.closest('button')) {
        playHoverSound();
    }
});

document.addEventListener('focus', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        playHoverSound();
    }
}, true);

// === TYPING ANIMATION (DAKTİLO) ===
// A function to animate text content character by character
window.typeText = function(element, text, speed = 15, callback) {
    element.textContent = '';
    element.classList.add('typing-cursor');
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            playTypingSound(); // Play sound per char
            i++;
            setTimeout(type, speed);
        } else {
            element.classList.remove('typing-cursor');
            if (callback) callback();
        }
    }
    type();
};

window.triggerRedAlert = function(active) {
    if (active) {
        document.body.classList.add('red-alert-mode');
    } else {
        document.body.classList.remove('red-alert-mode');
};

// === 3D TILT EFFECT ===
document.addEventListener('mousemove', (e) => {
    const tiltElement = e.target.closest('.rc, .fi, .rf, .login-box');
    
    // Reset elements not being hovered
    document.querySelectorAll('.rc, .fi, .rf, .login-box').forEach(el => {
        if (el !== tiltElement) {
            el.style.transform = '';
        }
    });

    if (tiltElement) {
        const rect = tiltElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; 
        const rotateY = ((x - centerX) / centerX) * 10;

        tiltElement.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }
});

document.addEventListener('mouseleave', () => {
    document.querySelectorAll('.rc, .fi, .rf, .login-box').forEach(el => {
        el.style.transform = '';
    });
});
