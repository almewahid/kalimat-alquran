/**
 * 🔊 Sound Effects System
 * تأثيرات صوتية اختيارية
 */

const sounds = {
  correctAnswer: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  wrongAnswer: "https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3",
  levelUp: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  achievement: "https://assets.mixkit.co/active_storage/sfx/1474/1474-preview.mp3",
  heartGain: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  heartLoss: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  buttonClick: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"
};

let soundEnabled = true;

export const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
  localStorage.setItem('soundEffectsEnabled', enabled.toString());
};

export const isSoundEnabled = () => {
  const saved = localStorage.getItem('soundEffectsEnabled');
  return saved === null ? true : saved === 'true';
};

export const playSound = (soundName) => {
  if (!soundEnabled || !sounds[soundName]) return;
  
  try {
    const audio = new Audio(sounds[soundName]);
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Sound play failed:", e));
  } catch (error) {
    console.log("Sound error:", error);
  }
};

// Initialize sound setting
soundEnabled = isSoundEnabled();