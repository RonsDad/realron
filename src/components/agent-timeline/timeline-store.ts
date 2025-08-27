import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { 
  TimelineEvent, 
  AgentProfile, 
  TimelineFilters,
  ViewMode,
  ParallelExecution,
  EventType,
  AgentType 
} from './types'

interface TimelineStore {
  // State
  events: TimelineEvent[]
  agents: Map<string, AgentProfile>
  filters: TimelineFilters
  viewMode: ViewMode
  
  // Actions
  addEvent: (event: TimelineEvent) => void
  addEvents: (events: TimelineEvent[]) => void
  updateEvent: (id: string, update: Partial<TimelineEvent>) => void
  removeEvent: (id: string) => void
  clearEvents: () => void
  
  registerAgent: (agent: AgentProfile) => void
  updateAgentStatus: (id: string, status: AgentProfile['status']) => void
  unregisterAgent: (id: string) => void
  
  setFilters: (filters: TimelineFilters) => void
  clearFilters: () => void
  setViewMode: (mode: ViewMode) => void
  
  // Computed values (derived state)
  filteredEvents: TimelineEvent[]
  activeAgents: AgentProfile[]
  parallelExecutions: ParallelExecution[]
  
  // Utilities
  getEventById: (id: string) => TimelineEvent | undefined
  getAgentById: (id: string) => AgentProfile | undefined
  getEventsByAgent: (agentId: string) => TimelineEvent[]
  getEventsByType: (type: EventType) => TimelineEvent[]
}

export const useTimelineStore = create<TimelineStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        events: [],
        agents: new Map(),
        filters: {},
        viewMode: 'detailed',
        
        // Actions
        addEvent: (event) => {
          set((state) => ({
            events: [...state.events, event].sort((a, b) => 
              a.timestamp.getTime() - b.timestamp.getTime()
            )
          }))
        },
        
        addEvents: (newEvents) => {
          set((state) => ({
            events: [...state.events, ...newEvents].sort((a, b) => 
              a.timestamp.getTime() - b.timestamp.getTime()
            )
          }))
        },
        
        updateEvent: (id, update) => {
          set((state) => ({
            events: state.events.map(e => 
              e.id === id ? { ...e, ...update } : e
            )
          }))
        },
        
        removeEvent: (id) => {
          set((state) => ({
            events: state.events.filter(e => e.id !== id)
          }))
        },
        
        clearEvents: () => {
          set({ events: [] })
        },
        
        registerAgent: (agent) => {
          set((state) => {
            const newAgents = new Map(state.agents)
            newAgents.set(agent.id, agent)
            return { agents: newAgents }
          })
        },
        
        updateAgentStatus: (id, status) => {
          set((state) => {
            const newAgents = new Map(state.agents)
            const agent = newAgents.get(id)
            if (agent) {
              newAgents.set(id, { ...agent, status })
            }
            return { agents: newAgents }
          })
        },
        
        unregisterAgent: (id) => {
          set((state) => {
            const newAgents = new Map(state.agents)
            newAgents.delete(id)
            return { agents: newAgents }
          })
        },
        
        setFilters: (filters) => {
          set({ filters })
        },
        
        clearFilters: () => {
          set({ filters: {} })
        },
        
        setViewMode: (viewMode) => {
          set({ viewMode })
        },
        
        // Computed values
        get filteredEvents() {
          const state = get()
          let filtered = [...state.events]
          
          // Apply agent type filter
          if (state.filters.agentTypes?.length) {
            filtered = filtered.filter(e => 
              state.filters.agentTypes!.includes(
                state.agents.get(e.agentId)?.type || 'custom'
              )
            )
          }
          
          // Apply event type filter
          if (state.filters.eventTypes?.length) {
            filtered = filtered.filter(e => 
              state.filters.eventTypes!.includes(e.type)
            )
          }
          
          // Apply status filter
          if (state.filters.status?.length) {
            filtered = filtered.filter(e => 
              state.filters.status!.includes(e.status)
            )
          }
          
          // Apply time range filter
          if (state.filters.timeRange) {
            const { start, end } = state.filters.timeRange
            filtered = filtered.filter(e => 
              e.timestamp >= start && e.timestamp <= end
            )
          }
          
          // Apply search query
          if (state.filters.searchQuery) {
            const query = state.filters.searchQuery.toLowerCase()
            filtered = filtered.filter(e => {
              const searchableContent = [
                e.type,
                e.agentId,
                JSON.stringify(e.content),
                JSON.stringify(e.metadata)
              ].join(' ').toLowerCase()
              return searchableContent.includes(query)
            })
          }
          
          return filtered
        },
        
        get activeAgents() {
          const state = get()
          return Array.from(state.agents.values()).filter(
            agent => agent.status !== 'idle'
          )
        },
        
        get parallelExecutions() {
          const state = get()
          const executions: ParallelExecution[] = []
          let currentExecution: ParallelExecution | null = null
          
          state.events.forEach(event => {
            if (event.type === 'parallel_start') {
              currentExecution = {
                id: event.id,
                startTime: event.timestamp,
                agents: [event.agentId],
                events: []
              }
            } else if (event.type === 'parallel_end' && currentExecution) {
              currentExecution.endTime = event.timestamp
              executions.push(currentExecution)
              currentExecution = null
            } else if (currentExecution) {
              if (!currentExecution.agents.includes(event.agentId)) {
                currentExecution.agents.push(event.agentId)
              }
              currentExecution.events.push(event)
            }
          })
          
          return executions
        },
        
        // Utilities
        getEventById: (id) => {
          return get().events.find(e => e.id === id)
        },
        
        getAgentById: (id) => {
          return get().agents.get(id)
        },
        
        getEventsByAgent: (agentId) => {
          return get().events.filter(e => e.agentId === agentId)
        },
        
        getEventsByType: (type) => {
          return get().events.filter(e => e.type === type)
        }
      }),
      {
        name: 'ron-ai-timeline',
        // Don't persist the Map directly, convert to array
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name)
            if (!str) return null
            const state = JSON.parse(str)
            // Convert agents array back to Map
            if (state.state?.agents) {
              state.state.agents = new Map(state.state.agents)
            }
            // Convert date strings back to Date objects
            if (state.state?.events) {
              state.state.events = state.state.events.map((e: any) => ({
                ...e,
                timestamp: new Date(e.timestamp)
              }))
            }
            return state
          },
          setItem: (name, value) => {
            // Convert Map to array for storage
            const state = { ...value }
            if (state.state?.agents instanceof Map) {
              state.state.agents = Array.from(state.state.agents.entries())
            }
            localStorage.setItem(name, JSON.stringify(state))
          },
          removeItem: (name) => {
            localStorage.removeItem(name)
          }
        }
      }
    )
  )
)

// Helper hooks for common use cases
export function useTimelineEvents() {
  return useTimelineStore(state => state.filteredEvents)
}

export function useActiveAgents() {
  return useTimelineStore(state => state.activeAgents)
}

export function useAddTimelineEvent() {
  return useTimelineStore(state => state.addEvent)
}

export function useRegisterAgent() {
  return useTimelineStore(state => state.registerAgent)
}
