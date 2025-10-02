"use client"

export interface EmptyStateProps {
  agentState: {
    isActive: boolean
  }
  isMobile?: boolean
}

export function EmptyState({ agentState, isMobile = false }: EmptyStateProps) {
  if (isMobile) {
    return (
      <div className="text-center py-6">
        <h2 className={`font-semibold leading-tight mb-3 ${
          agentState.isActive ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
        }`}>
          Your Health Advocacy
          <br />
          <span className="text-transparent bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-glow">
            Co-Pilot
          </span>
        </h2>
        <p className={`text-muted-foreground max-w-xl mx-auto px-4 ${
          agentState.isActive ? "text-sm" : "text-base"
        }`}>
          Get clarity and confidence in your healthcare decisions with AI-powered insights and expert
          recommendations.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <h2 className={`font-semibold mx-2.5 ${
        agentState.isActive ? "text-3xl lg:text-4xl" : "text-4xl lg:text-5xl"
      }`}>
        Your Health Advocacy
        <br />
        <span className="text-transparent bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-glow">
          Co-Pilot
        </span>
      </h2>
      <p className={`text-muted-foreground max-w-xl mx-auto px-4 mt-4 mb-8 ${
        agentState.isActive ? "text-base" : "text-lg"
      }`}>
        Get clarity and confidence in your healthcare decisions with AI-powered insights and expert
        recommendations.
      </p>
    </div>
  )
}