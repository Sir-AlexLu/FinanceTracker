'use client'

export function Avatar({ name, size = 'md', src, ...props }) {
  const sizes = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  }

  const initial = name?.charAt(0).toUpperCase() || '?'

  return (
    <div
      className={cn(
        'relative rounded-full bg-gradient-to-br from-primary-500 to-purple-500',
        'flex items-center justify-center text-white font-semibold',
        sizes[size]
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="absolute inset-0 rounded-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}
