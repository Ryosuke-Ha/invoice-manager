interface Props {
  className?: string
  children: React.ReactNode
}

export function Badge({ className = "", children }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${className}`}>
      {children}
    </span>
  )
}
