import { inView, useAnimationControls, useDomRef, useReducedMotion } from 'motion-v'
import type { MotionProps } from 'motion-v'
import type { Ref } from 'vue'

const groupVariants: MotionProps['variants'] = { hidden: {}, visible: {} }
const itemVariants: MotionProps['variants'] = {
  hidden: { opacity: 0, y: 28 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: index * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

export function useMeetScrollReveals() {
  const reducedMotion = useReducedMotion()
  const groups: { element: Ref<HTMLElement | null>; show: () => void }[] = []
  let mounted = false

  onMounted(() => {
    mounted = true
  })
  onBeforeUnmount(() => {
    mounted = false
  })

  function createGroup() {
    const element = useDomRef() as Ref<HTMLElement | null>
    const controls = useAnimationControls()
    let revealed = false
    let stopObserving: (() => void) | undefined

    function show() {
      if (!mounted) return
      revealed = true
      stopObserving?.()
      // Replace child animations too, bypassing every duration and stagger delay.
      void controls.start('visible', { duration: 0, delay: 0 })
    }

    onMounted(() => {
      const group = element.value
      if (!group || reducedMotion.value || typeof IntersectionObserver !== 'function') return
      // Keep SSR and initially visible content untouched; only arm below-viewport groups.
      if (group.getBoundingClientRect().top < window.innerHeight) return
      // A zero-duration start initializes Motion's values and schedules their first render.
      void controls.start('hidden', { duration: 0, delay: 0 })
      stopObserving = inView(
        group,
        () => {
          if (revealed) return
          revealed = true
          void controls.start('visible')
        },
        { amount: 0.1 },
      )
    })
    onBeforeUnmount(() => stopObserving?.())

    groups.push({ element, show })
    return { element, controls }
  }

  function revealContaining(target: Element) {
    groups.forEach(({ element, show }) => {
      if (element.value?.contains(target)) show()
    })
  }

  function revealFocusedGroup(event: FocusEvent) {
    if (event.target instanceof Element) revealContaining(event.target)
  }

  watch(
    reducedMotion,
    (reduce) => {
      if (reduce) groups.forEach(({ show }) => show())
    },
    { flush: 'sync' },
  )

  return { createGroup, groupVariants, itemVariants, revealContaining, revealFocusedGroup }
}
