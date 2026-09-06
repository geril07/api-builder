'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import styles from './welcome.module.css'

export function WelcomeMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || !('IntersectionObserver' in window)) return

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reveals = root.querySelectorAll<HTMLElement>('[data-reveal]')
    const words = root.querySelectorAll<HTMLElement>('[data-word]')
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-visible', 'true')
          revealObserver.unobserve(entry.target)
        }
      },
      { threshold: 0, rootMargin: '0px 0px -48px 0px' },
    )
    const wordObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-visible', 'true')
          wordObserver.unobserve(entry.target)
        }
      },
      { threshold: 1, rootMargin: '0px 0px -20% 0px' },
    )

    function syncMotion() {
      if (!root) return
      root.dataset.motion = String(!preference.matches)
    }

    syncMotion()
    reveals.forEach((element) => revealObserver.observe(element))
    words.forEach((element, index) => {
      element.style.transitionDelay = `${index * 65}ms`
      wordObserver.observe(element)
    })
    preference.addEventListener('change', syncMotion)

    return () => {
      revealObserver.disconnect()
      wordObserver.disconnect()
      preference.removeEventListener('change', syncMotion)
      delete root.dataset.motion
    }
  }, [])

  return (
    <div ref={ref} className={styles.page}>
      {children}
    </div>
  )
}
