import { useEffect, useRef } from 'react'
import { useGame } from '../game/store'
import { useInterest } from './store'
import { tickDelta, type TrackerState } from './activeTime'

export function useInterestTracker(): void {
  const focusedGadgetId = useGame((s) => s.focusedGadgetId)
  const ref = useRef<TrackerState>({
    focusedGadgetId,
    lastTickAt: Date.now(),
    lastInputAt: Date.now(),
    pageVisible: !document.hidden,
    windowFocused: document.hasFocus(),
  })

  ref.current.focusedGadgetId = focusedGadgetId

  useEffect(() => {
    const input = () => {
      ref.current.lastInputAt = Date.now()
    }

    const vis = () => {
      ref.current.pageVisible = !document.hidden
    }

    const onFocus = () => {
      ref.current.windowFocused = true
    }

    const onBlur = () => {
      ref.current.windowFocused = false
    }

    for (const e of ['pointerdown', 'pointermove', 'keydown']) {
      window.addEventListener(e, input)
    }

    document.addEventListener('visibilitychange', vis)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)

    const iv = setInterval(() => {
      const now = Date.now()
      const id = ref.current.focusedGadgetId
      const d = tickDelta(ref.current, now)

      if (id && d > 0) {
        useInterest.getState().addActiveMs(id, d)
      }

      ref.current.lastTickAt = now
    }, 1000)

    return () => {
      clearInterval(iv)

      for (const e of ['pointerdown', 'pointermove', 'keydown']) {
        window.removeEventListener(e, input)
      }

      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}
