let audioCtx: AudioContext | null = null;

export function playClickSound() {
  const soundEnabled = localStorage.getItem('tiplet_sound_enabled') !== 'false';
  if (!soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // 1. Crisp high-frequency transient (the switch click)
    const oscClick = audioCtx.createOscillator();
    const gainClick = audioCtx.createGain();
    
    oscClick.type = 'sine';
    oscClick.frequency.setValueAtTime(3200, now);
    oscClick.frequency.exponentialRampToValueAtTime(1200, now + 0.012);
    
    gainClick.gain.setValueAtTime(0.06, now);
    gainClick.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
    
    oscClick.connect(gainClick);
    gainClick.connect(audioCtx.destination);
    
    // 2. Deep mechanical switch housing body resonance
    const oscBody = audioCtx.createOscillator();
    const gainBody = audioCtx.createGain();
    
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(140, now);
    oscBody.frequency.exponentialRampToValueAtTime(80, now + 0.035);
    
    gainBody.gain.setValueAtTime(0.12, now);
    gainBody.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    
    oscBody.connect(gainBody);
    gainBody.connect(audioCtx.destination);
    
    // Start and stop
    oscClick.start(now);
    oscClick.stop(now + 0.015);
    
    oscBody.start(now);
    oscBody.stop(now + 0.04);
  } catch (err) {
    console.warn("Audio Context playback not allowed yet:", err);
  }
}
