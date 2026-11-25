<script setup lang="ts">
// Own code rain: digits, symbols and model words falling. An AI model is a huge pile of numbers.
const SYMBOLS = '0123456789+-*/=<>{}[]#%'.split('')
const WORDS = ['token', 'weights', 'GGUF', '4bit', 'RAM', 'GPU', 'MLX', 'llama', 'ctx']
const FONT_SIZE = 18
const FRAME_INTERVAL = 60

const canvasRef = ref<HTMLCanvasElement | null>(null)
let frame = 0
let cleanUp: (() => void) | undefined

onMounted(() => {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return

  let drops: number[] = []
  function resize() {
    canvas!.width = canvas!.clientWidth
    canvas!.height = canvas!.clientHeight
    drops = Array.from({ length: Math.ceil(canvas!.width / FONT_SIZE) }, () => Math.random() * -50)
  }
  resize()
  window.addEventListener('resize', resize)

  function randomGlyph() {
    // Mostly single symbols; now and then a whole word, drawn top to bottom over the next rows.
    return Math.random() < 0.03 ? WORDS[Math.floor(Math.random() * WORDS.length)]! : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]!
  }

  const glyphColor = getComputedStyle(canvas).getPropertyValue('--color-phosphor-500')
  let last = 0
  function draw(now: number) {
    frame = requestAnimationFrame(draw)
    if (now - last < FRAME_INTERVAL) return
    last = now
    context!.fillStyle = 'rgb(5 8 5 / 0.18)'
    context!.fillRect(0, 0, canvas!.width, canvas!.height)
    context!.fillStyle = glyphColor
    context!.font = `${FONT_SIZE}px monospace`
    drops.forEach((row, column) => {
      const glyph = randomGlyph()
      for (let index = 0; index < glyph.length; index++) {
        context!.fillText(glyph[index]!, column * FONT_SIZE, (row + index) * FONT_SIZE)
      }
      drops[column] = row * FONT_SIZE > canvas!.height && Math.random() > 0.97 ? 0 : row + 1
    })
  }
  frame = requestAnimationFrame(draw)

  cleanUp = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
  }
})

onBeforeUnmount(() => cleanUp?.())
</script>

<template>
  <canvas ref="canvasRef" class="block size-full" aria-hidden="true" />
</template>
