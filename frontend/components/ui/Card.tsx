interface Props {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = "" }: Props) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}
