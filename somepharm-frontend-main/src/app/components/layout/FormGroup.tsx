import React from 'react'

interface FormGroupProps {
  label: string
  children: React.ReactNode
  /** Shown below the input in red when truthy */
  error?: string
  /** Optional helper text shown below the label */
  hint?: string
  className?: string
}

export function FormGroup({ label, children, error, hint, className = '' }: FormGroupProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 italic">
        {label}
      </label>

      {hint && (
        <p className="text-[10px] font-medium text-gray-400 ml-4 -mt-1 italic">
          {hint}
        </p>
      )}

      {children}

      {error && (
        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-4">
          {error}
        </p>
      )}
    </div>
  )
}
