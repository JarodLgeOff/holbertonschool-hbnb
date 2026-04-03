"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";

import type { Place } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

type PlaceCardProps = {
  place: Place;
};

export function PlaceCard({ place }: PlaceCardProps) {
  const { t } = useI18n();
  const router = useRouter();

  const handleViewPlace = () => {
    router.push(`/places/${place.id}`);
  };

  return (
    <Card className="group overflow-hidden border-border/70 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          alt={place.name}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          src={place.image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <Badge className="rounded-full bg-white/95 text-foreground shadow-sm hover:bg-white" variant="secondary">
            {place.category}
          </Badge>
          <Badge className="rounded-full bg-black/60 text-white backdrop-blur" variant="outline">
            {place.price} € / nuit
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="flex items-center gap-1 text-sm text-white/85">
            <MapPin className="h-4 w-4" />
            {place.city}, {place.country}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">{place.name}</h3>
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{place.description}</p>

        <div className="flex flex-wrap gap-2">
          {place.amenities.slice(0, 3).map((amenity) => (
            <Badge key={amenity} variant="soft">
              {amenity}
            </Badge>
          ))}
        </div>

        <Button onClick={handleViewPlace} className="w-full">
          {t("placeCard.view")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}