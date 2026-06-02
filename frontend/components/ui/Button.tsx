interface Props {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  className?: string
}

const VARIANTS: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600",
  secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  danger: "bg-white border border-red-300 text-red-600 hover:bg-red-50",
  ghost: "text-gray-600 hover:bg-gray-100",
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-base",
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}
