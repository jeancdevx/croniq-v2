import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  count: number
  amount: number
  variant?: 'default' | 'destructive' | 'warning' | 'success'
}

export function StatsCard({
  title,
  count,
  amount,
  variant = 'default'
}: StatsCardProps) {
  const variantStyles = {
    default: 'border-border',
    destructive: 'border-destructive/50 bg-destructive/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    success: 'border-green-500/50 bg-green-500/5'
  }

  const textStyles = {
    default: 'text-foreground',
    destructive: 'text-destructive',
    warning: 'text-yellow-600 dark:text-yellow-500',
    success: 'text-green-600 dark:text-green-500'
  }

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-1'>
          <div className={`text-2xl font-bold ${textStyles[variant]}`}>
            {count} {count === 1 ? 'cliente' : 'clientes'}
          </div>
          <p className='text-muted-foreground text-xs'>
            S/ {amount.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
