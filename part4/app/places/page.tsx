"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { getCountries, getPlaces, type Place } from "@/lib/api";
import { hasToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { PlaceCard } from "@/components/PlaceCard";

export default function PlacesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasToken()) {
      router.replace("/login");
      return;
    }

    const loadPlaces = async () => {
      try {
        setLoading(true);
        const data = await getPlaces();
        setPlaces(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t("home.loadError"));
      } finally {
        setLoading(false);
      }
    };

    void loadPlaces();
  }, [router]);

  const countries = useMemo(() => getCountries(places), [places]);

  const filteredPlaces = useMemo(
    () =>
      places.filter((place) => {
        const matchesCountry = selectedCountry === "all" || place.country === selectedCountry;
        const search = searchQuery.trim().toLowerCase();
        const matchesSearch =
          search.length === 0 ||
          [place.name, place.city, place.country, place.description]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(search));

        return matchesCountry && matchesSearch;
      }),
    [places, searchQuery, selectedCountry]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <Badge className="rounded-full px-4 py-1.5" variant="soft">
            {t("places.badge")}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("places.title")}</h1>
          <p className="text-lg leading-8 text-muted-foreground">
            {t("places.description")}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("places.searchLabel")}</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("places.searchPlaceholder")}
                value={searchQuery}
              />
            </div>
          </div>

          <p className="text-sm font-medium text-muted-foreground">{t("places.filterLabel")}</p>
          <Select onValueChange={setSelectedCountry} value={selectedCountry}>
            <SelectTrigger>
              <SelectValue placeholder={t("places.allCountries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("places.allCountries")}</SelectItem>
              {countries.map((country: string) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Card className="mt-10 border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">{t("places.loadingError")}</CardTitle>
          </CardHeader>
          <CardContent>{error}</CardContent>
        </Card>
      ) : null}

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Card className="overflow-hidden border-border/70 bg-card/80" key={index}>
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-11 w-full rounded-full" />
                </CardContent>
              </Card>
            ))
          : filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} />)}
      </div>

      {!loading && filteredPlaces.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card/80 p-8 text-center text-muted-foreground">
          {t("places.empty")}
        </div>
      ) : null}
    </div>
  );
}