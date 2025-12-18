import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CoursePageSkeleton () {
  return (
    <div className="min-h-screen w-full max-w-7xl">
      <div className="mx-auto px-4 py-8">
        {/* Hero Section Skeleton - Video/Image and Enrollment Side by Side */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video/Image Section Skeleton - Left Side */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-xl border-0 bg-white">
                <div className="aspect-video bg-slate-200 animate-pulse" />
              </Card>
            </div>

            {/* Enrollment Card Skeleton - Right Side */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0 bg-white py-4">
                <CardContent className="p-6 space-y-4">
                  {/* Course title and badge */}
                  <div className="space-y-2">
                    <div className="h-8 bg-slate-200 rounded animate-pulse w-4/5" />
                    <div className="h-6 bg-slate-200 rounded animate-pulse w-20" />
                  </div>

                  {/* Price */}
                  <div className="h-8 bg-slate-200 rounded animate-pulse w-16" />

                  {/* Course Stats */}
                  <div className="space-y-3">
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
                        ))}
                      </div>
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
                    </div>

                    {/* Stats list */}
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enrollment Button */}
                  <div className="h-10 bg-slate-200 rounded animate-pulse" />

                  {/* Features List */}
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse" />
                        <div className="h-4 bg-slate-200 rounded animate-pulse flex-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Course Materials Skeleton */}
              <Card className="shadow-lg border-0 bg-white py-4">
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-2/3" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 bg-slate-200 rounded animate-pulse flex-1" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Story Section Skeleton */}
        <div className="mb-8">
          <Card className="shadow-lg border-0 bg-white py-4">
            <CardContent className="p-8 space-y-4">
              <div className="h-8 bg-slate-200 rounded animate-pulse w-1/2" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Content Skeleton */}
        <Card className="shadow-lg border-0 bg-white py-6 mb-8">
          <CardHeader>
            <div className="h-7 bg-slate-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-1/3" />
                  </div>
                  <div className="w-5 h-5 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Promise Section Skeleton */}
        <Card className="shadow-lg border-0 bg-white mb-8 py-4">
          <CardContent className="p-8 space-y-4">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-1/2" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Sections Skeleton */}
      <div className="space-y-8">
        {/* Reviews Section Skeleton */}
        <div className="bg-slate-100 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white py-4">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-4/5" />
                    </div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section Skeleton */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="h-8 bg-white/20 rounded animate-pulse w-1/2 mx-auto mb-4" />
            <div className="h-4 bg-white/20 rounded animate-pulse w-1/3 mx-auto mb-8" />
            <div className="h-12 bg-white/20 rounded animate-pulse w-48 mx-auto" />
          </div>
        </div>

        {/* FAQ Section Skeleton */}
        <div className="container mx-auto px-4 py-16">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-1/4 mx-auto mb-12" />
          <div className="space-y-4 max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border border-slate-200 rounded-lg">
                <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}