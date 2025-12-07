import Avatar, { genConfig, type AvatarFullConfig } from 'react-nice-avatar'

import { cn } from '@/lib/utils'

type AvatarShape = 'circle' | 'rounded' | 'square'
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface UserAvatarProps {
  seed?: string
  config?: AvatarFullConfig
  shape?: AvatarShape
  size?: AvatarSize
  className?: string
  alt?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

export function UserAvatar({
  seed,
  config: customConfig,
  shape = 'circle',
  size = 'md',
  className,
  alt
}: UserAvatarProps) {
  const avatarConfig = customConfig ?? genConfig(seed)

  return (
    <Avatar
      className={cn(sizeClasses[size], className)}
      shape={shape}
      aria-label={alt}
      {...avatarConfig}
    />
  )
}

export { genConfig }
export type { AvatarFullConfig }
