// Sound for the presentation: effects made in the browser with the Web Audio API.
// Browsers only allow sound after the visitor clicks or presses a key: until then every call is silent.
const MUTED_KEY = 'lm-explained-sound-muted'
const MASTER_VOLUME = 0.6
const HUM_VOLUME = 0.025

let context: AudioContext | undefined
let master: GainNode | undefined
let noise: AudioBuffer | undefined
let humGain: GainNode | undefined
// Remembered so the hum starts right away if audio unlocks while you are already in the room.
let isHumWanted = false

function setUp() {
  if (context) return
  const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return
  context = new AudioContextClass()
  master = context.createGain()
  master.connect(context.destination)
  // One second of white noise, reused by every click, whoosh and static burst.
  noise = context.createBuffer(1, context.sampleRate, context.sampleRate)
  const samples = noise.getChannelData(0)
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1
  // CRT hum: mains hum and its overtone, very quiet, always running; the room turns it up and down.
  humGain = context.createGain()
  humGain.gain.value = isHumWanted ? HUM_VOLUME : 0
  humGain.connect(master)
  for (const [frequency, level] of [[50, 1], [100, 0.5]] as const) {
    const oscillator = context.createOscillator()
    oscillator.frequency.value = frequency
    const gain = context.createGain()
    gain.gain.value = level
    oscillator.connect(gain).connect(humGain)
    oscillator.start()
  }
}

// A burst of filtered noise with a quick attack and an exponential tail.
function noiseBurst(options: { seconds: number, volume: number, filter: BiquadFilterType, from: number, to?: number, q?: number, delay?: number }) {
  if (!context || !master || !noise) return
  const start = context.currentTime + (options.delay ?? 0)
  const source = context.createBufferSource()
  source.buffer = noise
  source.loop = true
  const filter = context.createBiquadFilter()
  filter.type = options.filter
  filter.Q.value = options.q ?? 1
  filter.frequency.setValueAtTime(options.from, start)
  if (options.to) filter.frequency.exponentialRampToValueAtTime(options.to, start + options.seconds)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(options.volume, start + Math.min(0.01, options.seconds / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + options.seconds)
  source.connect(filter).connect(gain).connect(master)
  source.start(start, Math.random() * 0.5)
  source.stop(start + options.seconds + 0.05)
}

function tone(options: { seconds: number, volume: number, type: OscillatorType, from: number, to?: number, delay?: number }) {
  if (!context || !master) return
  const start = context.currentTime + (options.delay ?? 0)
  const oscillator = context.createOscillator()
  oscillator.type = options.type
  oscillator.frequency.setValueAtTime(options.from, start)
  if (options.to) oscillator.frequency.exponentialRampToValueAtTime(options.to, start + options.seconds)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(options.volume, start + Math.min(0.02, options.seconds / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + options.seconds)
  oscillator.connect(gain).connect(master)
  oscillator.start(start)
  oscillator.stop(start + options.seconds + 0.05)
}

export function useStageSound() {
  const isMuted = useState('stage-sound-muted', () => false)

  function applyMute() {
    if (master && context) master.gain.setTargetAtTime(isMuted.value ? 0 : MASTER_VOLUME, context.currentTime, 0.05)
  }

  // Call once from the stage: restores the mute choice and unlocks audio on the first click or key press.
  function install() {
    try {
      isMuted.value = localStorage.getItem(MUTED_KEY) === 'true'
    }
    catch {
      // Storage blocked (private window): the choice just isn't remembered.
    }
    const unlock = () => {
      setUp()
      context?.resume().catch(() => {})
      applyMute()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      humGain?.gain.setTargetAtTime(0, context?.currentTime ?? 0, 0.1)
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    try {
      localStorage.setItem(MUTED_KEY, String(isMuted.value))
    }
    catch {
      // Storage blocked (private window): the choice just isn't remembered.
    }
    applyMute()
  }

  return {
    isMuted,
    install,
    toggleMute,
    // One key of a mechanical keyboard: a bright click and a soft thud, a little different every time.
    keyClick: () => {
      noiseBurst({ seconds: 0.035, volume: 0.18, filter: 'bandpass', from: 2500 + Math.random() * 1800, q: 2 })
      tone({ seconds: 0.04, volume: 0.06, type: 'sine', from: 140 + Math.random() * 40, to: 80 })
    },
    // Next / previous: a small dry tick.
    tick: () => tone({ seconds: 0.02, volume: 0.05, type: 'square', from: 1800 }),
    // Moving between steps in the same world.
    swish: () => noiseBurst({ seconds: 0.45, volume: 0.05, filter: 'bandpass', from: 500, to: 1800, q: 0.8 }),
    // Into the screen: noise and a tone rising, faster and faster. Out of it: the same, falling.
    whoosh: (direction: 'in' | 'out', seconds: number) => {
      const [low, high] = direction === 'in' ? [250, 5000] : [5000, 250]
      noiseBurst({ seconds, volume: 0.22, filter: 'bandpass', from: low, to: high, q: 1.2 })
      tone({ seconds, volume: 0.06, type: 'sawtooth', from: direction === 'in' ? 70 : 600, to: direction === 'in' ? 600 : 70 })
    },
    // The second monitor waking up for the rabbit.
    crackle: () => noiseBurst({ seconds: 0.3, volume: 0.06, filter: 'highpass', from: 3000 }),
    // Floppy, the helper. All small and quiet: he is a side character.
    // Picked up: a little rising bloop.
    floppyPickup: () => tone({ seconds: 0.12, volume: 0.05, type: 'sine', from: 320, to: 720 }),
    // Let go: air rushing past, louder the harder he is thrown (strength 0..1).
    floppyThrow: (strength: number) => {
      if (strength > 0.15) noiseBurst({ seconds: 0.25, volume: 0.05 * strength, filter: 'bandpass', from: 900, to: 400, q: 0.9 })
    },
    // Hitting a wall or the floor: a plastic thud, scaled by the impact (strength 0..1).
    floppyThud: (strength: number) => {
      const volume = 0.03 + 0.09 * strength
      tone({ seconds: 0.09, volume, type: 'sine', from: 170 + Math.random() * 30, to: 60 })
      noiseBurst({ seconds: 0.03, volume: volume * 0.8, filter: 'lowpass', from: 1800 })
    },
    // One footstep: barely there.
    floppyStep: () => noiseBurst({ seconds: 0.025, volume: 0.025, filter: 'bandpass', from: 1200 + Math.random() * 500, q: 3 }),
    // A hop when poked: a short boing.
    floppyHop: () => tone({ seconds: 0.14, volume: 0.035, type: 'triangle', from: 260, to: 520 }),
    // Speaking up: the seek chatter of a floppy drive, two or three quick clicks.
    floppyChatter: () => {
      const clicks = 2 + Math.floor(Math.random() * 2)
      for (let index = 0; index < clicks; index++) {
        noiseBurst({ seconds: 0.02, volume: 0.06, filter: 'bandpass', from: 2200 + Math.random() * 900, q: 4, delay: index * 0.055 })
      }
    },
    // Taking the mouse: a cheeky rising arpeggio.
    floppyHijack: () => {
      for (const [index, frequency] of [523, 659, 784, 1047].entries()) {
        tone({ seconds: 0.09, volume: 0.03, type: 'square', from: frequency, delay: index * 0.07 })
      }
    },
    // The fake crash: a falling buzz and a burst of static.
    floppyCrash: () => {
      tone({ seconds: 0.5, volume: 0.04, type: 'sawtooth', from: 440, to: 55 })
      noiseBurst({ seconds: 0.3, volume: 0.05, filter: 'lowpass', from: 3000, to: 200 })
    },
    // The simulated computer. A mouse click: duller and rounder than a key.
    uiClick: () => {
      noiseBurst({ seconds: 0.02, volume: 0.09, filter: 'bandpass', from: 1400, q: 3 })
      tone({ seconds: 0.035, volume: 0.04, type: 'sine', from: 900, to: 500 })
    },
    // A window or page opening.
    windowOpen: () => {
      tone({ seconds: 0.12, volume: 0.035, type: 'triangle', from: 480, to: 900 })
      noiseBurst({ seconds: 0.15, volume: 0.025, filter: 'bandpass', from: 700, to: 2200, q: 0.8 })
    },
    // Downloading: data chatter, a tiny modem-like blip each call.
    dataBlip: () => tone({ seconds: 0.025, volume: 0.018, type: 'square', from: 900 + Math.random() * 1300 }),
    // Installing: a short disk grind.
    diskGrind: () => noiseBurst({ seconds: 0.05, volume: 0.05, filter: 'lowpass', from: 500 + Math.random() * 400, q: 2 }),
    // Loading the model into memory: a whir that climbs as it fills (progress 0..1).
    loadWhir: (progress: number) => tone({ seconds: 0.09, volume: 0.022, type: 'sawtooth', from: 90 + progress * 280 }),
    // A streamed token in the chat: a soft key tap.
    token: () => noiseBurst({ seconds: 0.02, volume: 0.07, filter: 'bandpass', from: 2800 + Math.random() * 1200, q: 2 }),
    // An action finished: two rising notes.
    chime: () => {
      tone({ seconds: 0.18, volume: 0.05, type: 'sine', from: 784 })
      tone({ seconds: 0.3, volume: 0.05, type: 'sine', from: 1175, delay: 0.09 })
    },
    // The CRT hum is only heard in the room.
    setHum: (isOn: boolean) => {
      isHumWanted = isOn
      if (humGain && context) humGain.gain.setTargetAtTime(isOn ? HUM_VOLUME : 0, context.currentTime, 0.3)
    },
  }
}
