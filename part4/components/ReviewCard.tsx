import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Review } from "@/lib/api";

type ReviewCardProps = {
  review: Review;
};

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{review.author}</p>
            <p className="text-sm text-muted-foreground">{review.date}</p>
          </div>
          <Badge variant="soft">{review.rating}/5</Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{review.comment}</p>
      </CardContent>
    </Card>
  );
}