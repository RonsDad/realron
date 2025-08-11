"use client"

import { useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CommandDropdownProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: string) => void
  children: React.ReactNode
}

const MENU_ITEMS = [
  { label: "Find healthcare providers", value: "Help me find healthcare providers in my area" },
  { label: "Find cheaper medications", value: "Help me find the cheapest price for my medication" },
  { label: "Fight an insurance denial", value: "Help me appeal an insurance denial" },
  { label: "Coordinate my care", value: "Help me coordinate care between my providers" },
  { label: "Learn about my diagnosis", value: "Help me understand my diagnosis" },
]

export function CommandDropdown({ isOpen, onClose, onSelect, children }: CommandDropdownProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start" side="top">
        {MENU_ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onSelect={() => {
              onSelect(item.value)
              onClose()
            }}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}