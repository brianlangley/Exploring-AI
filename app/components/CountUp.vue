<script setup lang="ts">
import gsap from 'gsap'

// A number that counts up from 0 once it scrolls into view. Server and reduced motion show the end value.
const props = defineProps<{ to: number }>()
const shown = ref(props.to)
const el = useTemplateRef<HTMLElement>('el')
let mm: gsap.MatchMedia | undefined

onMounted(() => {
  mm = gsap.matchMedia()
  mm.add(MOTION_OK, () => {
    const counter = { value: 0 }
    shown.value = 0
    gsap.to(counter, {
      value: props.to,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => { shown.value = Math.round(counter.value) },
      scrollTrigger: { trigger: el.value, start: 'top 90%', once: true },
    })
    return () => { shown.value = props.to }
  })
})
onBeforeUnmount(() => mm?.revert())
</script>

<template>
  <span ref="el" class="tabular-nums">{{ shown }}</span>
</template>
