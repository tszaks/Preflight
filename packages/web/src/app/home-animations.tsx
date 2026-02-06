'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function HomeAnimations() {
  useEffect(() => {
    const heroTitle = document.querySelector('[data-hero-title]')
    const heroSubtitle = document.querySelector('[data-hero-subtitle]')
    const heroCta = document.querySelector('[data-hero-cta]')
    const features = document.querySelector('[data-features]')

    if (!heroTitle) return

    const ctx = gsap.context(() => {
      // Hero title - blur slam-in
      gsap.fromTo(
        heroTitle,
        { y: 60, opacity: 0, filter: 'blur(12px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', delay: 0.2 }
      )

      // Subtitle - blur fade-in
      if (heroSubtitle) {
        gsap.fromTo(
          heroSubtitle,
          { y: 30, opacity: 0, filter: 'blur(8px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out', delay: 0.4 }
        )
      }

      // CTA buttons - staggered reveal
      if (heroCta) {
        const buttons = heroCta.querySelectorAll('a')
        gsap.fromTo(
          buttons,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out', delay: 0.6 }
        )
      }

      // Feature cards - staggered reveal with blur
      if (features) {
        const cards = features.querySelectorAll('.vercel-card')
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0, filter: 'blur(6px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: features,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        )
      }

      // Parallax on hero title - reduced movement to prevent cutoff
      if (heroTitle) {
        gsap.to(heroTitle, {
          y: -20,
          scrollTrigger: {
            trigger: 'section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5
          }
        })
      }

      // Parallax on subtitle (subtle)
      if (heroSubtitle) {
        gsap.to(heroSubtitle, {
          y: 10,
          scrollTrigger: {
            trigger: 'section',
            start: 'center center',
            end: 'bottom top',
            scrub: 1
          }
        })
      }
    })

    return () => ctx.revert()
  }, [])

  return null
}
