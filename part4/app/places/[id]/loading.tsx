import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaceDetailsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-2/5" />
      <Skeleton className="mt-4 h-6 w-1/2" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}