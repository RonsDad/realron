"use client"

import { useEffect, useRef } from "react"

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

interface SimpleCommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: string) => void
}

export function SimpleCommandMenu({ isOpen, onClose, onSelect }: SimpleCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Add delay before adding listener
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClick)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      ref={menuRef}
      className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 w-80 z-50"
    >
      {MENU_ITEMS.map((item) => (
        <button
          key={item.value}
          onClick={() => {
            onSelect(item.value)
            onClose()
          }}
          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}