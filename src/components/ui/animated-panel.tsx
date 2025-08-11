"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedPanelProps {
  children: React.ReactNode
  isOpen: boolean
  className?: string
  onAnimationComplete?: () => void
}

export function AnimatedPanel({ 
  children, 
  isOpen, 
  className,
  onAnimationComplete 
}: AnimatedPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [height, setHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isOpen) {
      // Opening sequence
      setIsVisible(true)
      // Let the DOM update, then calculate height
      requestAnimationFrame(() => {
        if (contentRef.current) {
          const contentHeight = contentRef.current.scrollHeight
          setHeight(contentHeight)
        }
      })
    } else {
      // Closing sequence
      setHeight(0)
      // Wait for height animation to complete before hiding
      animationTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
        onAnimationComplete?.()
      }, 500) // Match transition duration
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [isOpen, onAnimationComplete])

  // Update height if content changes while open
  useEffect(() => {
    if (isOpen && isVisible && contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight
      if (contentHeight !== height) {
        setHeight(contentHeight)
      }
    }
  }, [children, isOpen, isVisible, height])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out",
        className
      )}
      style={{ height: isOpen ? height : 0 }}
    >
      <div ref={contentRef} className="animate-fade-in">
        {children}
      </div>
    </div>
  )
}