"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlace, type Place } from "@/lib/api";
import { hasToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ReviewCard } from "@/components/ReviewCard";

export default function PlaceDetailsPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasToken()) {
      router.replace("/login");
      return;
    }

    const loadPlace = async () => {
      try {
        setLoading(true);
        const data = await getPlace(params.id);
        setPlace(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t("placeDetails.loadError"));
      } finally {
        setLoading(false);
      }
    };

    void loadPlace();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="mt-4 h-6 w-2/3" />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">{error}</div>;
  }

  if (!place) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">{t("placeDetails.notFound")}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge className="rounded-full px-4 py-1.5" variant="soft">
            {place.category}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{place.name}</h1>
          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {place.city}, {place.country}
          </p>
        </div>

        <Button asChild>
          <Link href={`/places/${place.id}/review`}>
            {t("placeDetails.addReview")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card/80 shadow-sm">
          <div className="grid gap-3 p-3 sm:grid-cols-3">
            {place.gallery.map((image, index) => (
              <div className={`relative overflow-hidden rounded-2xl ${index === 0 ? "sm:col-span-3 aspect-[16/10]" : "aspect-square"}`} key={image}>
                <Image alt={`${place.name} ${index + 1}`} className="object-cover" fill sizes="(max-width: 768px) 100vw, 50vw" src={image} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border border-border bg-card/80 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("placeDetails.price")}</p>
              <p className="text-3xl font-semibold">{place.price} €{t("placeDetails.perNight")}</p>
            </div>
            <Badge variant="soft">{place.rating} <Star className="ml-1 h-3.5 w-3.5" /></Badge>
          </div>

          <p className="text-base leading-8 text-muted-foreground">{place.description}</p>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground">{t("placeDetails.amenities")}</p>
            {place.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {place.amenities.map((amenity) => (
                  <Badge key={amenity} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("placeDetails.noAmenity")}</p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-12 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("placeDetails.reviews")}</h2>
            <p className="text-muted-foreground">{t("placeDetails.reviewsDescription")}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {place.reviews.length > 0 ? place.reviews.map((review) => <ReviewCard key={review.id} review={review} />) : (
            <Card className="border-border/70 bg-card/80">
              <CardContent className="p-6 text-muted-foreground">{t("placeDetails.noReviews")}</CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}