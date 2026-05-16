import React from 'react'

/**
 * Gap hierarchy (always pick from these three, nothing else):
 *   lg  → gap-10 (40px) — between major page sections
 *   md  → gap-6  (24px) — between cards in a grid row
 *   sm  → gap-4  (16px) — between items inside a card
 */
type StackGap = 'lg' | 'md' | 'sm'
type StackDirection = 'col' | 'row'

const gapMap: Record<StackGap, string> = {
  lg: 'gap-10',
  md: 'gap-6',
  sm: 'gap-4',
}

interface StackProps {
  children: React.ReactNode
  gap?: StackGap
  direction?: StackDirection
  /** Pass flex-1 overflow-hidden here when driving internal scroll inside a locked PageWrapper */
  className?: string
}

export function Stack({ children, gap = 'md', direction = 'col', className = '' }: StackProps) {
  const dir = direction === 'col' ? 'flex-col' : 'flex-row'

  return (
    <div className={`flex ${dir} ${gapMap[gap]} ${className}`}>
      {children}
    </div>
  )
}
