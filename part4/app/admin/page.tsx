"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  deletePlaceAdmin,
  deleteReviewAdmin,
  deleteUserAdmin,
  getCurrentUser,
  getPlaces,
  getReviewsAdmin,
  getUsersAdmin,
  type AdminReview,
  type AdminUser,
  type Place,
  updateUserAdmin,
} from "@/lib/api";
import { hasToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);

  const loadData = async () => {
    const [usersData, placesData, reviewsData] = await Promise.all([
      getUsersAdmin(),
      getPlaces(),
      getReviewsAdmin(),
    ]);

    setUsers(usersData);
    setPlaces(placesData);
    setReviews(reviewsData);
  };

  useEffect(() => {
    const initialize = async () => {
      if (!hasToken()) {
        router.replace("/login");
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.isAdmin) {
          toast.error("Acces reserve aux administrateurs");
          router.replace("/places");
          return;
        }

        await loadData();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de charger le panel admin";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [router]);

  const handleToggleAdmin = async (user: AdminUser) => {
    try {
      await updateUserAdmin(user.id, { isAdmin: !user.isAdmin });
      toast.success("Role admin mis a jour");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mise a jour impossible";
      toast.error(message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserAdmin(userId);
      toast.success("Utilisateur supprime");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Suppression impossible";
      toast.error(message);
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    try {
      await deletePlaceAdmin(placeId);
      toast.success("Lieu supprime");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Suppression du lieu impossible";
      toast.error(message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReviewAdmin(reviewId);
      toast.success("Avis supprime");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Suppression de l'avis impossible";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p>Chargement du panel admin...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Administration</p>
          <h1 className="text-4xl font-semibold tracking-tight">Panel Admin</h1>
          <p className="mt-2 text-muted-foreground">Gerez les utilisateurs, lieux et avis depuis un seul espace.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/places">Retour aux lieux</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleToggleAdmin(user)}>
                  {user.isAdmin ? "Retirer admin" : "Rendre admin"}
                </Button>
                <Button type="button" variant="outline" className="text-red-600" onClick={() => handleDeleteUser(user.id)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lieux ({places.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {places.map((place) => (
            <div key={place.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{place.name}</p>
                <p className="text-sm text-muted-foreground">{place.location ?? `${place.city}, ${place.country}`}</p>
                <p className="text-sm">Prix: {place.price} EUR</p>
              </div>
              <div className="flex gap-2">
                <Button asChild type="button" variant="outline">
                  <Link href={`/places/manage?id=${place.id}`}>Modifier</Link>
                </Button>
                <Button type="button" variant="outline" className="text-red-600" onClick={() => handleDeletePlace(place.id)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avis ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">Note: {review.rating}/5</p>
                <p className="text-sm text-muted-foreground">{review.text || "(Sans commentaire)"}</p>
                <p className="text-xs text-muted-foreground">Place: {review.placeId} | User: {review.userId}</p>
              </div>
              <Button type="button" variant="outline" className="text-red-600" onClick={() => handleDeleteReview(review.id)}>
                Supprimer
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
