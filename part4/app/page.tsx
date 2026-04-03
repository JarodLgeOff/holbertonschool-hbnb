"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaces, type Place } from "@/lib/api";

function HowItWorksDialog({ onExplore }: { onExplore: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <Button onClick={() => setOpen(true)} variant="outline" type="button">
        Voir comment ça marche
        <PlayCircle className="ml-2 h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Un parcours simple en trois étapes</DialogTitle>
          <DialogDescription>
            Hbnb est pensé pour aller vite, sans sacrifier le confort visuel ni la clarté.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="font-medium">1. Explorer</p>
            <p className="text-sm text-muted-foreground">Filtrez les lieux par pays et ouvrez une fiche détaillée.</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="font-medium">2. Réserver</p>
            <p className="text-sm text-muted-foreground">Connectez-vous et poursuivez votre expérience de réservation.</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="font-medium">3. Partager</p>
            <p className="text-sm text-muted-foreground">Déposez un avis après votre séjour et aidez la communauté.</p>
          </div>
        </div>
        <DialogFooter>
          <DialogCloseButton>
            <button className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium" type="button">
              Fermer
            </button>
          </DialogCloseButton>
          <Button onClick={() => { onExplore(); setOpen(false); }}>
            Explorer maintenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlacesCarousel() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        const data = await getPlaces();
        setPlaces(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger les lieux");
      } finally {
        setLoading(false);
      }
    };

    void loadPlaces();
  }, []);

  const slide = (direction: "left" | "right") => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const amount = Math.max(rail.clientWidth * 0.75, 320);
    rail.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const handleViewPlace = (placeId: string) => {
    router.push(`/places/${placeId}`);
  };

  const handleExploreAll = () => {
    router.push("/places");
  };

  return (
    <section className="mt-24 rounded-[2rem] border border-border/70 bg-card/80 p-8 shadow-sm sm:p-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <Badge className="rounded-full px-4 py-1.5" variant="soft">
            Lieux créés
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Les Hbnb disponible</h2>
          <p className="mt-4 text-muted-foreground">
            Fais défiler les cards pour découvrir rapidement chaque destination, puis ouvre la fiche complète.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button aria-label="Précédent" className="rounded-full" onClick={() => slide("left")} size="icon" type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button aria-label="Suivant" className="rounded-full" onClick={() => slide("right")} size="icon" type="button" variant="outline">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error ? <p className="mt-8 text-sm text-destructive">{error}</p> : null}

      <div className="mt-8 overflow-hidden">
        <div className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2" ref={railRef}>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card className="min-w-[85%] snap-start border-border/70 sm:min-w-[420px]" key={index}>
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <CardContent className="space-y-3 p-5">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-11 w-full rounded-full" />
                  </CardContent>
                </Card>
              ))
            : <>
                {places.slice(0, 4).map((place) => (
                  <Card className="group min-w-[85%] snap-start overflow-hidden border-border/70 bg-background/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:min-w-[420px]" key={place.id}>
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        alt={place.name}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        fill
                        sizes="(max-width: 768px) 85vw, 420px"
                        src={place.image}
                      />
                      <div className="absolute left-4 top-4">
                        <Badge className="rounded-full bg-white/90 text-foreground" variant="secondary">
                          {place.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="space-y-4 p-5">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight">{place.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {place.city}, {place.country}
                        </p>
                      </div>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{place.description}</p>
                      <Button onClick={() => handleViewPlace(place.id)} className="w-full">
                        Voir le lieu
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Card className="group min-w-[85%] snap-start flex flex-col items-center justify-center border-border/70 bg-background/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:min-w-[420px]">
                  <CardContent className="flex flex-col items-center justify-center gap-4 p-5 text-center">
                    <div className="text-5xl">🏠</div>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight">Tous les hbnb</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Découvrez tous les lieux disponibles</p>
                    </div>
                    <Button onClick={handleExploreAll} className="w-full">
                      Explorer tout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </>}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();

  const handleExplore = () => {
    router.push("/places");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl pt-10 text-center">
        <Badge className="rounded-full px-4 py-1.5 text-xs font-medium" variant="soft">
          Plateforme de réservation nouvelle génération
        </Badge>

        <h1 className="mt-8 text-balance text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Découvrez et réservez des lieux uniques partout dans le monde
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
          Hbnb vous permet de trouver, explorer et réserver des logements exceptionnels facilement.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={handleExplore} size="lg">
            Explorer les lieux
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <HowItWorksDialog onExplore={handleExplore} />
        </div>
      </section>

      <PlacesCarousel />
    </div>
  );
}