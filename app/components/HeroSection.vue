<script setup lang="ts">
import gsap from 'gsap'
import { DEMO_MODEL_ID } from '~/utils/demoModel'

const { messages } = useLocale()
const copy = computed(() => messages.value.hero)
const mock = computed(() => messages.value.mock)

const root = useTemplateRef<HTMLElement>('root')
let mm: gsap.MatchMedia | undefined

// The hero's chat: the mock exchange first, then the short follow-ups. 5 exchanges = 10 messages.
const thread = computed(() => [
  { question: mock.value.chatQuestion, answer: mock.value.chatAnswer },
  ...copy.value.chat,
].flatMap(pair => [
  { role: 'user' as const, text: pair.question },
  { role: 'assistant' as const, text: pair.answer },
]))

// Playback state. Defaults are the finished first exchange: what the server, reduced motion and a stopped play show.
const STILL = { shown: 2, typedChars: 0, thinking: false, streamedWords: Infinity, done: true }
const chat = reactive({ ...STILL })

const visibleMessages = computed(() => thread.value.slice(0, chat.shown).map((message, index) => {
  const isStreaming = index === chat.shown - 1 && message.role === 'assistant' && chat.streamedWords !== Infinity
  return {
    ...message,
    isStreaming,
    text: isStreaming ? message.text.split(' ').slice(0, chat.streamedWords).join(' ') : message.text,
  }
}))
const nextQuestion = computed(() => thread.value[chat.shown]?.role === 'user' ? thread.value[chat.shown]!.text : '')
const isTyping = computed(() => chat.typedChars > 0)

// One exchange: type the question in the composer, send it, think, stream the answer word by word.
function playChat() {
  Object.assign(chat, { shown: 0, typedChars: 0, thinking: false, streamedWords: Infinity, done: false })
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: '[data-window]', start: 'top 70%', once: true },
    onComplete: () => { chat.done = true },
  })

  for (let index = 0; index < thread.value.length; index += 2) {
    const question = thread.value[index]!.text
    const answerWords = thread.value[index + 1]!.text.split(' ').length
    const typing = { chars: 0 }
    const streaming = { words: 0 }

    timeline
      .to(typing, {
        chars: question.length,
        duration: Math.min(1.8, question.length * 0.03),
        ease: 'none',
        onUpdate: () => { chat.typedChars = Math.round(typing.chars) },
      }, index === 0 ? 0.4 : '+=1.4')
      .call(() => Object.assign(chat, { shown: index + 1, typedChars: 0, thinking: true }), [], '+=0.3')
      .call(() => Object.assign(chat, { shown: index + 2, thinking: false, streamedWords: 0 }), [], '+=0.9')
      .to(streaming, {
        words: answerWords,
        duration: answerWords * 0.06,
        ease: 'none',
        onUpdate: () => { chat.streamedWords = Math.ceil(streaming.words) },
        onComplete: () => { chat.streamedWords = Infinity },
      })
  }
  return timeline
}

// Load: text then window rise in turn. Scroll: the window grows to full size while the text drifts away.
// GSAP only writes inline styles here, never text, so Vue keeps owning the DOM (the locale can still switch).
onMounted(() => {
  mm = gsap.matchMedia(root.value!)
  mm.add(MOTION_OK, () => {
    gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.1 } })
      .from('[data-intro]', { y: 28, opacity: 0, filter: 'blur(8px)', stagger: 0.1 })
      .from('[data-window]', { y: 80, opacity: 0, scale: 0.94, duration: 1.4 }, '-=0.7')
      .from('[data-glow]', { opacity: 0, duration: 2 }, '<')

    gsap.to('[data-copy]', {
      y: -60,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: root.value, start: 'top top', end: '60% top', scrub: true },
    })
    gsap.fromTo('[data-window-inner]', { scale: 0.9 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: '[data-window]', start: 'top 90%', end: 'top 20%', scrub: true },
    })

    playChat()
    // Reverting (unmount, or reduced motion switched on) leaves the still chat, not a half-typed one.
    return () => Object.assign(chat, STILL)
  })
})
onBeforeUnmount(() => mm?.revert())
</script>

<template>
  <section id="top" ref="root" class="relative isolate overflow-hidden">
    <!-- Soft violet light behind the window. -->
    <div
      data-glow
      class="pointer-events-none absolute inset-x-0 top-[38%] -z-10 mx-auto h-[640px] max-w-5xl rounded-full bg-[radial-gradient(closest-side,rgb(117_80_240/0.35),transparent)] blur-2xl"
      aria-hidden="true"
    />

    <UContainer class="pt-24 pb-16 lg:pt-36">
      <div data-copy class="mx-auto flex max-w-4xl flex-col items-center gap-7 text-center">
        <p data-intro class="text-sm font-medium text-primary">
          {{ copy.badge }} · 2026
        </p>
        <h1 data-intro class="font-display text-6xl font-semibold leading-[0.95] tracking-[-0.045em] text-balance text-highlighted sm:text-7xl lg:text-[7.5rem]">
          {{ copy.modernTitle }}
        </h1>
        <p data-intro class="max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          {{ copy.modernText }}
        </p>
        <div data-intro class="flex flex-wrap justify-center gap-3">
          <UButton to="#device" size="xl" :label="copy.checkDevice" trailing-icon="i-lucide-arrow-down" />
          <UButton to="/" size="xl" color="neutral" variant="ghost" :label="copy.watchIntro" icon="i-lucide-play" />
        </div>
      </div>

      <!-- Product shot: a simulated chat, built in HTML so it stays sharp. Decorative; the same story is told below. -->
      <div data-window class="mx-auto mt-20 max-w-5xl lg:mt-28" aria-hidden="true">
        <div data-window-inner class="overflow-hidden rounded-[22px] bg-[#101114] shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_50px_120px_-20px_rgb(0_0_0/0.8)] [will-change:transform]">
          <div class="flex h-11 items-center gap-2 border-b border-white/[0.06] px-4">
            <span class="size-3 rounded-full bg-white/15" />
            <span class="size-3 rounded-full bg-white/15" />
            <span class="size-3 rounded-full bg-white/15" />
            <span class="ml-auto rounded-md bg-white/[0.05] px-3 py-1 font-mono text-xs text-emerald-300">● {{ DEMO_MODEL_ID }}</span>
          </div>
          <div class="flex text-left">
            <div class="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-white/[0.06] py-4 sm:flex">
              <img src="/brand/LM Studio Icon Color.svg" alt="" class="size-7">
              <span v-for="icon in ['i-lucide-search', 'i-lucide-hard-drive', 'i-lucide-message-square', 'i-lucide-terminal']" :key="icon" class="grid size-10 place-items-center rounded-lg" :class="icon === 'i-lucide-message-square' ? 'bg-violet-500/20 text-violet-100' : 'text-zinc-500'">
                <UIcon :name="icon" class="size-5" />
              </span>
            </div>

            <div class="flex min-w-0 flex-1 flex-col gap-4 p-5 text-[15px] sm:p-8">
              <!-- Fixed height, newest at the bottom: older messages slide up and fade out at the top, like a real chat. -->
              <TransitionGroup
                tag="div"
                class="flex h-[380px] flex-col justify-end gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%)] sm:h-[420px]"
                enter-active-class="transition duration-500 ease-out"
                enter-from-class="translate-y-3 scale-[0.97] opacity-0"
                leave-active-class="hidden"
                move-class="transition-transform duration-500 ease-out"
              >
                <p
                  v-for="(message, index) in visibleMessages"
                  :key="index"
                  class="shrink-0 rounded-2xl px-4 leading-relaxed"
                  :class="message.role === 'user'
                    ? 'ml-auto max-w-[75%] origin-bottom-right rounded-br-sm bg-violet-500/25 py-2.5 text-highlighted'
                    : 'max-w-[85%] origin-bottom-left rounded-bl-sm bg-white/[0.05] py-3 text-default'"
                >
                  {{ message.text }}<span v-if="message.isStreaming" class="ml-0.5 animate-pulse text-primary">▍</span>
                </p>
                <!-- Thinking: three dots where the answer will start. -->
                <p v-if="chat.thinking" key="thinking" class="flex w-fit shrink-0 origin-bottom-left gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.05] px-4 py-4">
                  <span v-for="dot in 3" :key="dot" class="size-2 animate-pulse rounded-full bg-zinc-300" :style="{ animationDelay: `${dot * 200}ms` }" />
                </p>
              </TransitionGroup>

              <!-- Composer: each question is typed here first, then sent. -->
              <div class="flex items-center gap-3 rounded-xl bg-white/[0.04] py-2 pr-2 pl-4 ring-1 ring-white/[0.06]">
                <span class="min-w-0 flex-1 truncate" :class="isTyping ? 'text-highlighted' : 'text-dimmed'">
                  {{ isTyping ? nextQuestion.slice(0, chat.typedChars) : mock.chatPlaceholder }}<span v-if="isTyping" class="animate-pulse text-primary">|</span>
                </span>
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-lg transition-colors"
                  :class="isTyping ? 'bg-violet-500 text-white' : 'bg-white/[0.06] text-zinc-500'"
                >
                  <UIcon name="i-lucide-arrow-up" class="size-4" />
                </span>
              </div>
              <p class="-mt-1 font-mono text-xs text-dimmed transition-opacity duration-700" :class="chat.done ? 'opacity-100' : 'opacity-0'">
                {{ mock.chatStats }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
