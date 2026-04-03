"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Amenity,
  createAmenity,
  createPlace,
  deleteAmenity,
  getAmenities,
  updatePlace,
  getPlaces,
  getCurrentUser,
  getPlace,
  updateAmenity,
  type Place,
} from "@/lib/api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Edit2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type PlaceFormData = {
  title: string;
  description: string;
  price: number;
  latitude: number;
  longitude: number;
  location: string;
  imageUrlsText: string;
};

function parseImageUrlsText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatImageUrlsText(gallery: string[] | undefined, fallbackImage?: string) {
  const candidates = gallery && gallery.length > 0 ? gallery : fallbackImage ? [fallbackImage] : [];
  const unique = Array.from(new Set(candidates.map((url) => url.trim()).filter(Boolean)));
  return unique.join("\n");
}

export default function ManagePlacesPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingPlaceId = searchParams?.get("id") ?? null;
  const [places, setPlaces] = useState<Place[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [amenityName, setAmenityName] = useState("");
  const [activeAmenity, setActiveAmenity] = useState<Amenity | null>(null);
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  const placeSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(3, t("manage.validation.titleMin")),
        description: z
          .string()
          .min(10, t("manage.validation.descriptionMin")),
        price: z.coerce.number().positive(t("manage.validation.pricePositive")),
        latitude: z.coerce
          .number()
          .min(-90, t("manage.validation.latitudeInvalid"))
          .max(90, t("manage.validation.latitudeInvalid")),
        longitude: z.coerce
          .number()
          .min(-180, t("manage.validation.longitudeInvalid"))
          .max(180, t("manage.validation.longitudeInvalid")),
        location: z.string().min(2, t("manage.validation.locationMin")),
        imageUrlsText: z
          .string()
          .refine((value) => parseImageUrlsText(value).length > 0, t("manage.validation.imagesRequired"))
          .refine(
            (value) => parseImageUrlsText(value).every((url) => /^https?:\/\//i.test(url)),
            t("manage.validation.imagesInvalid")
          ),
      }),
    [language, t]
  );

  const form = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      latitude: 0,
      longitude: 0,
      location: "",
      imageUrlsText: "",
    },
  });

  // Load user's places and check for edit mode
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        const [allPlaces, allAmenities] = await Promise.all([getPlaces(), getAmenities()]);

        if (!currentUser?.id) {
          setPlaces([]);
          setAmenities([]);
          return;
        }

        // Filter to show only user's places
        const userPlaces = allPlaces.filter(
          (place) => place.ownerId === currentUser.id
        );
        setPlaces(userPlaces);
        setAmenities(allAmenities);

        // Check if we're in edit mode
        if (editingPlaceId) {
          const placeToEdit = await getPlace(editingPlaceId);
          const fallbackPlace = allPlaces.find((place) => place.id === editingPlaceId);
          const resolvedPlace = placeToEdit ?? fallbackPlace ?? null;

          if (!resolvedPlace) {
            toast.error(t("manage.notFound"));
            return;
          }

          setActivePlace(resolvedPlace);
          setSelectedAmenityIds(resolvedPlace.amenityIds ?? []);
          form.reset({
            title: resolvedPlace.name,
            description: resolvedPlace.description,
            price: resolvedPlace.price,
            latitude: resolvedPlace.latitude ?? 0,
            longitude: resolvedPlace.longitude ?? 0,
            location: resolvedPlace.location ?? `${resolvedPlace.city}, ${resolvedPlace.country}`,
            imageUrlsText: formatImageUrlsText(resolvedPlace.gallery, resolvedPlace.image),
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des lieux:", error);
        toast.error(t("manage.loadError"));
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [editingPlaceId, form]);

  const onSubmit = async (data: PlaceFormData) => {
    const placeIdToUpdate = editingPlaceId ?? activePlace?.id ?? null;
    const isEditMode = Boolean(placeIdToUpdate);
    const payload = {
      ...data,
      imageUrls: parseImageUrlsText(data.imageUrlsText),
      amenityIds: selectedAmenityIds,
    };

    try {
      const savedPlace = isEditMode
        ? await updatePlace(placeIdToUpdate as string, payload)
        : await createPlace(payload);

      if (isEditMode) {
        toast.success(t("manage.updateSuccess"));
      } else {
        toast.success(t("manage.createSuccess"));
      }

      const currentUser = await getCurrentUser();
      const allPlaces = await getPlaces();
      if (currentUser?.id) {
        setPlaces(allPlaces.filter((place) => place.ownerId === currentUser.id));
      }

      const refreshedPlace = await getPlace(savedPlace.id);
      if (refreshedPlace) {
        setActivePlace(refreshedPlace);
        setSelectedAmenityIds(refreshedPlace.amenityIds ?? []);
        form.reset({
          title: refreshedPlace.name,
          description: refreshedPlace.description,
          price: refreshedPlace.price,
          latitude: refreshedPlace.latitude ?? 0,
          longitude: refreshedPlace.longitude ?? 0,
          location: refreshedPlace.location ?? `${refreshedPlace.city}, ${refreshedPlace.country}`,
          imageUrlsText: formatImageUrlsText(refreshedPlace.gallery, refreshedPlace.image),
        });
      }

      router.push(`/places/manage?id=${savedPlace.id}`);
    } catch (error) {
      console.error("Erreur:", error);
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : isEditMode
            ? t("manage.updateError")
            : t("manage.createError");
      toast.error(
        errorMessage
      );
    }
  };

  const handleSaveAmenity = async () => {
    const trimmedName = amenityName.trim();

    if (!trimmedName) {
      toast.error(t("manage.amenityNameRequired"));
      return;
    }

    try {
      if (activeAmenity) {
        await updateAmenity(activeAmenity.id, { name: trimmedName });
        toast.success(t("manage.amenityUpdateSuccess"));
      } else {
        const createdAmenity = await createAmenity({ name: trimmedName });
        setSelectedAmenityIds((current) => Array.from(new Set([...current, createdAmenity.id])));
        toast.success(t("manage.amenityCreateSuccess"));
      }

      setAmenityName("");
      setActiveAmenity(null);
      setAmenities(await getAmenities());
    } catch (error) {
      const message = error instanceof Error ? error.message : t("manage.amenitySaveError");
      toast.error(message);
    }
  };

  const handleEditAmenity = (amenity: Amenity) => {
    setActiveAmenity(amenity);
    setAmenityName(amenity.name);
  };

  const handleToggleAmenity = (amenityId: string) => {
    setSelectedAmenityIds((current) =>
      current.includes(amenityId)
        ? current.filter((id) => id !== amenityId)
        : [...current, amenityId]
    );
  };

  const handleDeleteAmenity = async (amenityId: string) => {
    try {
      await deleteAmenity(amenityId);
      if (activeAmenity?.id === amenityId) {
        setActiveAmenity(null);
        setAmenityName("");
      }
      toast.success(t("manage.amenityDeleteSuccess"));
      setAmenities(await getAmenities());
    } catch (error) {
      const message = error instanceof Error ? error.message : t("manage.amenityDeleteError");
      toast.error(message);
    }
  };

  const handleCancelAmenity = () => {
    setActiveAmenity(null);
    setAmenityName("");
  };

  const handleEditPlace = (place: Place) => {
    router.push(`/places/manage?id=${place.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("manage.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <h1 className="text-3xl font-bold mb-6">
              {activePlace ? t("manage.editTitle") : t("manage.createTitle")}
            </h1>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("manage.field.title")}</FormLabel>
                      <FormControl>
                        <Input
                            placeholder={t("manage.field.titlePlaceholder")}
                          {...field}
                          className="bg-white dark:bg-slate-950"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("manage.field.description")}</FormLabel>
                      <FormControl>
                        <Textarea
                            placeholder={t("manage.field.descriptionPlaceholder")}
                          {...field}
                          className="bg-white dark:bg-slate-950"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("manage.field.price")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          className="bg-white dark:bg-slate-950"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("manage.field.latitude")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("manage.field.latitudePlaceholder")}
                            step="0.0001"
                            {...field}
                            className="bg-white dark:bg-slate-950"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("manage.field.longitude")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("manage.field.longitudePlaceholder")}
                            step="0.0001"
                            {...field}
                            className="bg-white dark:bg-slate-950"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("manage.field.location")}</FormLabel>
                      <FormControl>
                        <Input
                            placeholder={t("manage.field.locationPlaceholder")}
                          {...field}
                          className="bg-white dark:bg-slate-950"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrlsText"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("manage.field.images")}</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder={t("manage.field.imagesPlaceholder")}
                          {...field}
                          className="bg-white dark:bg-slate-950"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">{t("manage.amenities.title")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("manage.amenities.description")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder={t("manage.amenities.namePlaceholder")}
                      value={amenityName}
                      onChange={(event) => setAmenityName(event.target.value)}
                      className="bg-white dark:bg-slate-950"
                    />

                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleSaveAmenity} type="button">
                        {activeAmenity ? t("manage.amenities.update") : t("manage.amenities.create")}
                      </Button>
                      {activeAmenity && (
                        <Button onClick={handleCancelAmenity} type="button" variant="outline">
                          {t("manage.cancel")}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {amenities.length > 0 ? (
                      amenities.map((amenity) => {
                        const isSelected = selectedAmenityIds.includes(amenity.id);

                        return (
                          <button
                            key={amenity.id}
                            type="button"
                            onClick={() => handleToggleAmenity(amenity.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted"
                            }`}
                          >
                            {amenity.name}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("manage.amenities.noneAvailable")}</p>
                    )}
                  </div>

                  {selectedAmenityIds.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-muted-foreground">{t("manage.amenities.selected")}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAmenityIds.map((amenityId) => {
                          const amenity = amenities.find((item) => item.id === amenityId);

                          if (!amenity) {
                            return null;
                          }

                          return (
                            <Button
                              key={amenity.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleToggleAmenity(amenity.id)}
                            >
                              {amenity.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">{t("manage.amenities.manageExisting")}</p>
                    {amenities.length > 0 ? (
                      <div className="space-y-2">
                        {amenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                            <span className="text-sm font-medium">{amenity.name}</span>
                            <div className="flex gap-2">
                              <Button onClick={() => handleEditAmenity(amenity)} size="sm" type="button" variant="outline">
                                {t("manage.edit")}
                              </Button>
                              <Button onClick={() => handleDeleteAmenity(amenity.id)} size="sm" type="button" variant="outline" className="text-red-600">
                                {t("manage.delete")}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("manage.amenities.noneSaved")}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="flex-1"
                  >
                    {form.formState.isSubmitting
                      ? t("manage.submitting")
                      : activePlace
                        ? t("manage.submitUpdate")
                        : t("manage.submitCreate")}
                  </Button>
                  {activePlace && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActivePlace(null);
                        form.reset();
                        router.push("/places/manage");
                      }}
                    >
                      {t("manage.cancel")}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </Card>
        </div>

        {/* Sidebar - User's Places */}
        <div>
          <Card className="p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-6">{t("manage.myPlaces")} ({places.length})</h2>

            {places.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("manage.noPlaces")}
              </p>
            ) : (
              <div className="space-y-4">
                {places.map((place) => (
                  <div
                    key={place.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {place.image && (
                      <div className="h-32 w-full bg-muted overflow-hidden">
                        <img
                          src={place.image}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">
                        {place.name}
                      </h3>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{place.location ?? `${place.city}, ${place.country}`}</span>
                      </div>
                      <p className="text-sm font-semibold mt-2">
                        €{place.price}{t("manage.perNight")}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleEditPlace(place)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        {t("manage.edit")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
