import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader className="space-y-3 text-center">
          <Skeleton className="mx-auto h-8 w-40" />
          <Skeleton className="mx-auto h-5 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-11 w-full rounded-full" />
        </CardContent>
      </Card>
    </div>
  );
}