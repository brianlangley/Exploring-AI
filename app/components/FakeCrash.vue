<script setup lang="ts">
// Floppy's joke: a fake system crash that matches the visitor's OS. Shows for a few seconds, goes black
// like a reboot, then says it is done. Escape or a click ends it early (after a short grace period).
const props = defineProps<{ os: CrashOs }>()
const emit = defineEmits<{ done: [] }>()

const SHOW_TIME = 7_000
const BLACK_TIME = 1_200
const GRACE_TIME = 1_500
// The rickroll plays after the "reboot": the gif is the picture, the 9 s clip (rickroll.mp4) is the sound, and
// it is over when the sound is. The gif is big: it loads while the crash shows and the rickroll is skipped if
// it is not ready in time. The timer is a fallback in case the sound never ends (for example blocked autoplay).
const GIF_SRC = '/rickroll.gif'
const AUDIO_SRC = '/rickroll.mp4'
const ROLL_MAX_TIME = 12_000
// The clip is much louder than the site's own sound effects: play it at a fraction of full volume.
const ROLL_VOLUME = 0.15

const { messages } = useLocale()
const sound = useStageSound()
const percent = ref(0)
const isBlack = ref(false)
const showGif = ref(false)
let isGifReady = false
let audio: HTMLAudioElement | undefined

// A fake QR code for the Windows screen: three corner squares and random-looking cells (it does not scan).
const QR_SIZE = 25
const FINDERS = [[0, 0], [QR_SIZE - 7, 0], [0, QR_SIZE - 7]] as const
const qrCells = (() => {
  const cells: { x: number, y: number }[] = []
  let seed = 7
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
      // Corner squares (7 x 7 with a gap around them): outer ring and centre filled, the ring between empty.
      const corner = FINDERS.find(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7)
      if (corner) {
        const ring = Math.max(Math.abs(x - corner[0] - 3), Math.abs(y - corner[1] - 3))
        if (ring === 3 || ring <= 1) cells.push({ x, y })
      }
      else if ((seed >> 16) & 1) {
        cells.push({ x, y })
      }
    }
  }
  return cells
})()

const LINUX_LINES = [
  '[    7.284113] Kernel panic - not syncing: Attempted to kill init! exitcode=0x0000000b',
  '[    7.284119] CPU: 2 PID: 1 Comm: init Not tainted 6.8.0-floppy #1',
  '[    7.284122] Hardware name: Generic Desktop, BIOS 1.44MB 03/12/1987',
  '[    7.284125] Call Trace:',
  '[    7.284127]  <TASK>',
  '[    7.284131]  dump_stack_lvl+0x48/0x70',
  '[    7.284136]  panic+0x11c/0x2f0',
  '[    7.284141]  do_exit+0x9a1/0xa40',
  '[    7.284146]  floppy_disk_irq+0x4f/0x90 [floppy]',
  '[    7.284151]  ret_from_fork_asm+0x1a/0x30',
  '[    7.284155]  </TASK>',
  '[    7.284160] Kernel Offset: disabled',
  '[    7.284163] ---[ end Kernel panic - not syncing: Attempted to kill init! exitcode=0x0000000b ]---',
]

const shownAt = performance.now()
let timers: ReturnType<typeof setTimeout>[] = []
let ticker: ReturnType<typeof setInterval> | undefined

// Go dark like a reboot, then the rickroll (if its file has loaded), then hand control back.
function finish() {
  if (isBlack.value) return
  isBlack.value = true
  clearInterval(ticker)
  timers.forEach(clearTimeout)
  timers = [setTimeout(() => {
    if (!isGifReady) return emit('done')
    showGif.value = true
    if (audio) {
      audio.muted = sound.isMuted.value
      audio.volume = ROLL_VOLUME
      audio.onended = () => emit('done')
      audio.play().catch(() => {})
    }
    timers = [setTimeout(() => emit('done'), ROLL_MAX_TIME)]
  }, BLACK_TIME)]
}
function leave() {
  if (performance.now() - shownAt < GRACE_TIME) return
  if (showGif.value) emit('done')
  else finish()
}
function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !event.repeat) leave()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  timers.push(setTimeout(finish, SHOW_TIME))
  const preload = new Image()
  preload.onload = () => (isGifReady = true)
  preload.src = GIF_SRC
  audio = new Audio(AUDIO_SRC)
  audio.preload = 'auto'
  // "Collecting error info": the Windows percentage creeps up in fits and starts.
  if (props.os === 'windows') {
    ticker = setInterval(() => {
      percent.value = Math.min(100, percent.value + Math.floor(Math.random() * 5))
    }, 200)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  audio?.pause()
  clearInterval(ticker)
  timers.forEach(clearTimeout)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[60] cursor-none select-none overflow-hidden" @click="leave">
      <span class="sr-only" role="alert">{{ messages.floppy.crashHint }}</span>

      <!-- Windows: blue screen. -->
      <div v-if="os === 'windows'" class="size-full bg-[#0078d7] p-[6vw] font-[Segoe_UI,system-ui,sans-serif] text-white" aria-hidden="true">
        <p class="text-[clamp(4rem,14vw,9rem)] leading-none">
          :(
        </p>
        <p class="mt-6 max-w-3xl text-[clamp(1.1rem,2.6vw,2rem)] leading-snug">
          Your device ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.
        </p>
        <p class="mt-6 text-[clamp(1rem,2.2vw,1.6rem)]">
          {{ percent }}% complete
        </p>
        <div class="mt-8 flex items-start gap-4 text-[clamp(.7rem,1.3vw,.95rem)]">
          <svg class="size-[clamp(4.5rem,9vw,7rem)] shrink-0 bg-white p-1.5" :viewBox="`0 0 ${QR_SIZE} ${QR_SIZE}`" shape-rendering="crispEdges">
            <rect v-for="cell in qrCells" :key="`${cell.x}-${cell.y}`" :x="cell.x" :y="cell.y" width="1" height="1" />
          </svg>
          <div class="space-y-3">
            <p>For more information about this issue and possible fixes, visit the Windows stop code page.</p>
            <p>If you call a support person, give them this info:</p>
            <p>Stop code: CRITICAL_PROCESS_DIED<br>What failed: floppy.sys</p>
          </div>
        </div>
      </div>

      <!-- Mac: the "restarted because of a problem" screen, in several languages like the real one. -->
      <div v-else-if="os === 'mac'" class="grid size-full place-items-center bg-[#2b2b2b] p-8 text-center font-[-apple-system,BlinkMacSystemFont,system-ui,sans-serif] text-[#e8e8e8]" aria-hidden="true">
        <div class="space-y-5 text-[clamp(.85rem,1.6vw,1.15rem)]">
          <p>Your computer was restarted because of a problem.<br>Press a key or wait a few seconds to continue.</p>
          <p>Je computer is opnieuw opgestart vanwege een probleem.<br>Druk op een toets of wacht even om door te gaan.</p>
          <p>Ihr Computer wurde aufgrund eines Problems neu gestartet.<br>Drücken Sie eine Taste oder warten Sie einige Sekunden, um fortzufahren.</p>
          <p>Votre ordinateur a redémarré en raison d'un problème.<br>Appuyez sur une touche ou patientez quelques secondes pour continuer.</p>
        </div>
      </div>

      <!-- Linux: kernel panic on a black console. -->
      <div v-else class="size-full overflow-hidden bg-black p-4 font-mono text-[clamp(.6rem,1.15vw,.85rem)] leading-snug text-[#cfcfcf]" aria-hidden="true">
        <p v-for="line in LINUX_LINES" :key="line" class="whitespace-pre-wrap break-words">
          {{ line }}
        </p>
        <p class="mt-1 animate-pulse">
          _
        </p>
      </div>

      <!-- Reboot: the screen goes dark. -->
      <div v-if="isBlack" class="absolute inset-0 grid place-items-center bg-black" aria-hidden="true">
        <img v-if="showGif" :src="GIF_SRC" alt="" class="size-full object-cover">
      </div>
    </div>
  </Teleport>
</template>
