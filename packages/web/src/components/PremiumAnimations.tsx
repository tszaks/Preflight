'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function PremiumAnimations({ children }: { children: React.ReactNode }) {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!heroRef.current || !titleRef.current || !subtitleRef.current) return

    const ctx = gsap.context(() => {
      // Hero title - blur slam-in
      gsap.fromTo(
        titleRef.current,
        { y: 60, opacity: 0, filter: 'blur(12px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', delay: 0.2 }
      )

      // Subtitle - blur fade-in
      gsap.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out', delay: 0.4 }
      )

      // CTA buttons - staggered reveal
      if (ctaRef.current) {
        const buttons = ctaRef.current.querySelectorAll('a')
        gsap.fromTo(
          buttons,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out', delay: 0.6 }
        )
      }

      // Feature cards - staggered reveal with blur
      if (featuresRef.current) {
        const cards = featuresRef.current.querySelectorAll('.vercel-card')
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
              trigger: featuresRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        )
      }

      // Parallax on hero title
      if (titleRef.current && heroRef.current) {
        gsap.to(titleRef.current, {
          y: -40,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5
          }
        })
      }

      // Parallax on subtitle (slower)
      if (subtitleRef.current && heroRef.current) {
        gsap.to(subtitleRef.current, {
          y: 20,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'center center',
            end: 'bottom top',
            scrub: 1
          }
        })
      }
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={heroRef} data-hero-ref>
      <div ref={titleRef} data-title-ref />
      <div ref={subtitleRef} data-subtitle-ref />
      <div ref={ctaRef} data-cta-ref />
      <div ref={featuresRef} data-features-ref />
      {children}
    </div>
  )
}

export function useAnimationRefs() {
  return {
    heroRef: { 'data-hero-ref': '' },
    titleRef: { 'data-title-ref': '' },
    subtitleRef: { 'data-subtitle-ref': '' },
    ctaRef: { 'data-cta-ref': '' },
    featuresRef: { 'data-features-ref': '' }
  }
}
