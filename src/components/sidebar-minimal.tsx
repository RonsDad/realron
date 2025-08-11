"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, 
  X, 
  Pill, 
  Users, 
  Shield, 
  FileText, 
  Wrench, 
  Settings, 
  User, 
  HelpCircle, 
  Globe, 
  ChevronLeft,
  Home,
  MessageSquare,
  Activity,
  Calendar,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarMinimalProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const navigationItems = [
  {
    id: "home",
    title: "Home",
    icon: Home,
    href: "/",
    description: "Dashboard overview"
  },
  {
    id: "chat",
    title: "AI Chat",
    icon: MessageSquare,
    href: "/",
    description: "Chat with Ron AI"
  },
  {
    id: "care-team",
    title: "Care Team",
    icon: Users,
    href: "/care-team",
    description: "Healthcare providers"
  },
  {
    id: "benefits",
    title: "Benefits",
    icon: Shield,
    href: "/benefits",
    description: "Insurance coverage"
  },
  {
    id: "treatments",
    title: "Treatments",
    icon: Pill,
    href: "/treatments",
    description: "Medications & plans"
  },
  {
    id: "appointments",
    title: "Appointments",
    icon: Calendar,
    href: "/appointments",
    description: "Schedule & history"
  },
  {
    id: "records",
    title: "Records",
    icon: FileText,
    href: "/records",
    description: "Medical documents"
  },
  {
    id: "vitals",
    title: "Vitals",
    icon: Activity,
    href: "/vitals",
    description: "Health metrics"
  },
  {
    id: "billing",
    title: "Billing",
    icon: CreditCard,
    href: "/billing",
    description: "Payments & claims"
  },
  {
    id: "tools",
    title: "Tools",
    icon: Wrench,
    href: "/tools",
    description: "Health tools"
  },
  {
    id: "browser",
    title: "Browser",
    icon: Globe,
    href: "/browser",
    description: "Web sessions"
  }
]

const bottomItems = [
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    href: "/settings"
  },
  {
    id: "account",
    title: "Account",
    icon: User,
    href: "/account"
  },
  {
    id: "support",
    title: "Support",
    icon: HelpCircle,
    href: "/support"
  }
]

export function SidebarMinimal({ 
  isOpen = false, 
  onOpenChange,
  className 
}: SidebarMinimalProps) {
  const [isExpanded, setIsExpanded] = useState(isOpen)
  const [activeItem, setActiveItem] = useState("chat")
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    setIsExpanded(isOpen)
  }, [isOpen])
  
  const toggleSidebar = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    onOpenChange?.(newState)
  }
  
  if (!mounted) {
    return null
  }
  
  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "fixed left-0 top-0 h-screen z-40 flex",
        className
      )}>
        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{ width: isExpanded ? 260 : 64 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative bg-card border-r border-border shadow-sm flex flex-col"
        >
          {/* Header */}
          <div className="h-16 px-3 flex items-center justify-between border-b border-border">
            <motion.div
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center gap-2",
                !isExpanded && "hidden"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">R</span>
              </div>
              <span className="font-semibold text-sm">Ron AI</span>
            </motion.div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn(
                "h-8 w-8 transition-all",
                !isExpanded && "mx-auto"
              )}
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.id
                
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveItem(item.id)}
                        className={cn(
                          "w-full justify-start h-10 px-3 transition-all",
                          isActive && "bg-primary/10 text-primary hover:bg-primary/15",
                          !isExpanded && "justify-center px-0"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isExpanded && "mr-3"
                        )} />
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                            className="text-sm truncate"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    {!isExpanded && (
                      <TooltipContent side="right" className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </nav>
          </ScrollArea>
          
          {/* Bottom Section */}
          <div className="border-t border-border p-2 space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon
              
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start h-9 px-3",
                        !isExpanded && "justify-center px-0"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isExpanded && "mr-3"
                      )} />
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: 0.1 }}
                          className="text-sm truncate"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
            
            {/* Version */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="pt-2 text-center"
              >
                <span className="text-xs text-muted-foreground">v2.1.0</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}