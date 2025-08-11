"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Pill, 
  Shield, 
  Wrench,
  Search,
  DollarSign,
  FileX,
  Brain,
  Stethoscope,
  ClipboardList,
  Microscope,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandMenuItem {
  id: string
  label: string
  icon: React.ElementType
  description?: string
  children?: CommandMenuItem[]
  prompt?: string
}

const COMMAND_MENU_ITEMS: CommandMenuItem[] = [
  {
    id: "care-team",
    label: "My Care Team",
    icon: Users,
    children: [
      {
        id: "find-provider",
        label: "Find a Provider",
        icon: Search,
        description: "Search for in-network specialists",
        prompt: "Help me find an in-network provider for my condition"
      },
      {
        id: "coordinate-care",
        label: "Coordinate Care",
        icon: ClipboardList,
        description: "Manage referrals and appointments",
        prompt: "Help me coordinate care between my providers"
      }
    ]
  },
  {
    id: "treatments",
    label: "My Treatments",
    icon: Pill,
    children: [
      {
        id: "cheaper-meds",
        label: "Find Cheaper Meds",
        icon: DollarSign,
        description: "Search for lowest medication prices",
        prompt: "Help me find the cheapest price for my medication"
      },
      {
        id: "reconcile-meds",
        label: "Reconcile My Meds",
        icon: ClipboardList,
        description: "Review and update medication list",
        prompt: "Help me reconcile my current medications"
      },
      {
        id: "learn-diagnosis",
        label: "Learn About My Diagnosis",
        icon: Brain,
        description: "Understand your condition better",
        prompt: "Help me understand my diagnosis"
      }
    ]
  },
  {
    id: "benefits",
    label: "My Benefits",
    icon: Shield,
    children: [
      {
        id: "fight-denial",
        label: "Fight a Denial",
        icon: FileX,
        description: "Appeal insurance denials",
        prompt: "Help me appeal an insurance denial"
      },
      {
        id: "coverage-check",
        label: "Check Coverage",
        icon: Shield,
        description: "Verify what's covered",
        prompt: "Help me check if a treatment is covered by my insurance"
      }
    ]
  },
  {
    id: "tools",
    label: "My Tools",
    icon: Wrench,
    children: [
      {
        id: "deep-research",
        label: "Deep Research",
        icon: Microscope,
        description: "Comprehensive medical research",
        prompt: "Conduct deep research on a medical topic"
      },
      {
        id: "provider-search",
        label: "Provider Search",
        icon: Stethoscope,
        description: "Advanced provider search",
        prompt: "Search for healthcare providers with specific criteria"
      }
    ]
  }
]

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (prompt: string) => void
}

export function CommandMenu({ isOpen, onClose, onSelect }: CommandMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const openTimeRef = useRef<number>(0)

  // Simple click outside handler
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
        setSelectedCategory(null)
      }
    }

    // Delay to avoid immediate closing
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside)
    }, 10)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleItemClick = (item: CommandMenuItem) => {
    if (item.children) {
      // Toggle category expansion - don't close menu
      setSelectedCategory(selectedCategory === item.id ? null : item.id)
    } else if (item.prompt) {
      // Only close when selecting a final option with a prompt
      onSelect(item.prompt)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute bottom-full mb-2 left-0 z-50 w-80"
        >
          <div className="relative bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <div className="relative p-2">
              {COMMAND_MENU_ITEMS.map((category) => (
                <div key={category.id} className="mb-1 last:mb-0">
                  <motion.button
                    onClick={() => handleItemClick(category)}
                    onMouseEnter={() => setHoveredItem(category.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200",
                      selectedCategory === category.id
                        ? "bg-white/20 dark:bg-white/10 text-gray-900 dark:text-white"
                        : hoveredItem === category.id
                        ? "bg-white/10 dark:bg-white/5 text-gray-800 dark:text-gray-200"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <category.icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{category.label}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        selectedCategory === category.id && "rotate-90"
                      )}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {selectedCategory === category.id && category.children && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 space-y-1">
                          {category.children.map((item) => (
                            <motion.button
                              key={item.id}
                              onClick={() => handleItemClick(item)}
                              onMouseEnter={() => setHoveredItem(item.id)}
                              onMouseLeave={() => setHoveredItem(null)}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.05 }}
                              className={cn(
                                "w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                hoveredItem === item.id
                                  ? "bg-white/15 dark:bg-white/10"
                                  : "hover:bg-white/10 dark:hover:bg-white/5"
                              )}
                            >
                              <item.icon className="w-4 h-4 mt-0.5 text-purple-600 dark:text-purple-400" />
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                  {item.label}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Help text */}
            <div className="px-4 py-3 border-t border-white/10 dark:border-white/5">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Type <kbd className="px-1.5 py-0.5 text-xs bg-white/10 dark:bg-white/5 rounded border border-white/20 dark:border-white/10">/</kbd> to open commands
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}