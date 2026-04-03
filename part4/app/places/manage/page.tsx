"use client";

import { useState, useEffect } from "react";
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

const placeSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  price: z.coerce.number().positive("Le prix doit être positif"),
  latitude: z.coerce
    .number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  location: z.string().min(2, "Le lieu doit contenir au moins 2 caractères"),
  imageUrl: z.string().url("URL d'image invalide"),
});

type PlaceFormData = z.infer<typeof placeSchema>;

export default function ManagePlacesPage() {
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

  const form = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      latitude: 0,
      longitude: 0,
      location: "",
      imageUrl: "",
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
            toast.error("Lieu introuvable");
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
            imageUrl: resolvedPlace.image || "",
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des lieux:", error);
        toast.error("Erreur lors du chargement des lieux");
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
      amenityIds: selectedAmenityIds,
    };

    try {
      const savedPlace = isEditMode
        ? await updatePlace(placeIdToUpdate as string, payload)
        : await createPlace(payload);

      if (isEditMode) {
        toast.success("Lieu mis à jour avec succès");
      } else {
        toast.success("Lieu créé avec succès");
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
          imageUrl: refreshedPlace.image || "",
        });
      }

      router.push(`/places/manage?id=${savedPlace.id}`);
    } catch (error) {
      console.error("Erreur:", error);
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : isEditMode
            ? "Erreur lors de la mise à jour du lieu"
            : "Erreur lors de la création du lieu";
      toast.error(
        errorMessage
      );
    }
  };

  const handleSaveAmenity = async () => {
    const trimmedName = amenityName.trim();

    if (!trimmedName) {
      toast.error("Le nom de l'amenity est obligatoire");
      return;
    }

    try {
      if (activeAmenity) {
        await updateAmenity(activeAmenity.id, { name: trimmedName });
        toast.success("Amenity mise à jour");
      } else {
        const createdAmenity = await createAmenity({ name: trimmedName });
        setSelectedAmenityIds((current) => Array.from(new Set([...current, createdAmenity.id])));
        toast.success("Amenity créée");
      }

      setAmenityName("");
      setActiveAmenity(null);
      setAmenities(await getAmenities());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de sauvegarder l'amenity";
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
      toast.success("Amenity supprimée");
      setAmenities(await getAmenities());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer l'amenity";
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
        <p>Chargement...</p>
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
              {activePlace ? "Modifier le lieu" : "Créer un nouveau lieu"}
            </h1>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nom du lieu"
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre lieu..."
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
                      <FormLabel>Prix par nuit (€)</FormLabel>
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
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="-90 à 90"
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
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="-180 à 180"
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
                      <FormLabel>Lieu (Ville, Pays)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex: Paris, France"
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
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de l&apos;image</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
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
                    <h2 className="text-lg font-semibold">Amenities du lieu</h2>
                    <p className="text-sm text-muted-foreground">
                      Sélectionne les amenities à associer à cette place.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Nom de l'amenity"
                      value={amenityName}
                      onChange={(event) => setAmenityName(event.target.value)}
                      className="bg-white dark:bg-slate-950"
                    />

                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleSaveAmenity} type="button">
                        {activeAmenity ? "Mettre à jour" : "Créer une amenity"}
                      </Button>
                      {activeAmenity && (
                        <Button onClick={handleCancelAmenity} type="button" variant="outline">
                          Annuler
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
                      <p className="text-sm text-muted-foreground">Aucune amenity disponible pour le moment.</p>
                    )}
                  </div>

                  {selectedAmenityIds.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-muted-foreground">Amenities sélectionnées</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Gérer les amenities existantes</p>
                    {amenities.length > 0 ? (
                      <div className="space-y-2">
                        {amenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                            <span className="text-sm font-medium">{amenity.name}</span>
                            <div className="flex gap-2">
                              <Button onClick={() => handleEditAmenity(amenity)} size="sm" type="button" variant="outline">
                                Modifier
                              </Button>
                              <Button onClick={() => handleDeleteAmenity(amenity.id)} size="sm" type="button" variant="outline" className="text-red-600">
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune amenity enregistrée.</p>
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
                      ? "Chargement..."
                      : activePlace
                        ? "Mettre à jour"
                        : "Créer le lieu"}
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
                      Annuler
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
            <h2 className="text-xl font-bold mb-6">Mes lieux ({places.length})</h2>

            {places.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Vous n&apos;avez pas encore créé de lieu.
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
                        €{place.price}/nuit
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleEditPlace(place)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Modifier
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
