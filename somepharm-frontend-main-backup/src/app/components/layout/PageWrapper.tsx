import React from 'react'

interface PageWrapperProps {
  children: React.ReactNode
  /**
   * locked=true  → h-screen overflow-hidden. Headers stay fixed, inner sections
   *               scroll independently. Use for dashboards and data-heavy tools.
   * locked=false → Standard document flow with pb-24 bottom padding.
   *               Use for forms, profiles, and configuration pages.
   */
  locked?: boolean
  className?: string
}

export function PageWrapper({ children, locked = false, className = '' }: PageWrapperProps) {
  const base = 'pt-28 px-12'
  const flow = locked ? 'h-screen overflow-hidden flex flex-col' : 'pb-24'

  return (
    <div className={`${base} ${flow} ${className}`}>
      {children}
    </div>
  )
}
