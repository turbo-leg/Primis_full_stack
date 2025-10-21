import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function StatsCardSkeleton() {
  return (
    <Card className="dark:bg-primis-navy-light dark:border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

export function SecondaryStatsCardSkeleton() {
  return (
    <Card className="dark:bg-primis-navy-light dark:border-white/10">
      <CardContent className="p-6">
        <div className="flex items-center">
          <Skeleton className="h-8 w-8 rounded mr-3" />
          <div>
            <Skeleton className="h-6 w-12 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ListCardSkeleton({ title, description }: { title: string; description: string }) {
  return (
    <Card className="dark:bg-primis-navy-light dark:border-white/10">
      <CardHeader>
        <CardTitle className="dark:text-white">{title}</CardTitle>
        <CardDescription className="dark:text-gray-300">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border dark:border-white/10 rounded-lg">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SecondaryStatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <ListCardSkeleton 
            key={i} 
            title="Loading..." 
            description="Please wait" 
          />
        ))}
      </div>
    </div>
  )
}
