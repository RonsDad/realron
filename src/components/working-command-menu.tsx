"use client"

import { useEffect, useRef, useState } from "react"

interface MenuItem {
  label: string
  value: string
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Find healthcare providers", value: "Help me find healthcare providers in my area" },
  { label: "Find cheaper medications", value: "Help me find the cheapest price for my medication" },
  { label: "Fight an insurance denial", value: "Help me appeal an insurance denial" },
  { label: "Coordinate my care", value: "Help me coordinate care between my providers" },
  { label: "Learn about my diagnosis", value: "Help me understand my diagnosis" },
]

interface WorkingCommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: string) => void
}

export function WorkingCommandMenu({ isOpen, onClose, onSelect }: WorkingCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Wait for next tick to ensure menu is rendered
      requestAnimationFrame(() => {
        setIsReady(true)
      })
    } else {
      setIsReady(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isReady) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      // Check if click is outside menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        // Also check if the click is not on the input that triggered the menu
        const isInputClick = (target as HTMLElement).tagName === 'TEXTAREA'
        if (!isInputClick) {
          onClose()
        }
      }
    }

    // Use capture phase to catch events early
    document.addEventListener("mousedown", handleClickOutside, true)
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true)
    }
  }, [isReady, onClose])

  if (!isOpen) return null

  return (
    <div 
      ref={menuRef}
      className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 w-80"
      style={{ zIndex: 99999 }}
      onMouseDown={(e) => {
        // Prevent any mousedown events from bubbling up from the menu
        e.stopPropagation()
      }}
    >
      {MENU_ITEMS.map((item) => (
        <button
          key={item.value}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect(item.value)
            onClose()
          }}
          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm cursor-pointer"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}