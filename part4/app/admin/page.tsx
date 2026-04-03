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
import { useI18n } from "@/lib/i18n";

export default function AdminPage() {
  const { t } = useI18n();
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
          toast.error(t("admin.accessDenied"));
          router.replace("/places");
          return;
        }

        await loadData();
      } catch (error) {
        const message = error instanceof Error ? error.message : t("admin.loadError");
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
      toast.success(t("admin.toggleSuccess"));
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("admin.toggleError");
      toast.error(message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserAdmin(userId);
      toast.success(t("admin.userDeleteSuccess"));
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("admin.userDeleteError");
      toast.error(message);
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    try {
      await deletePlaceAdmin(placeId);
      toast.success(t("admin.placeDeleteSuccess"));
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("admin.placeDeleteError");
      toast.error(message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReviewAdmin(reviewId);
      toast.success(t("admin.reviewDeleteSuccess"));
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("admin.reviewDeleteError");
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p>{t("admin.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{t("admin.badge")}</p>
          <h1 className="text-4xl font-semibold tracking-tight">{t("admin.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("admin.description")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/places">{t("admin.backToPlaces")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users")} ({users.length})</CardTitle>
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
                  {user.isAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
                </Button>
                <Button type="button" variant="outline" className="text-red-600" onClick={() => handleDeleteUser(user.id)}>
                  {t("admin.delete")}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.places")} ({places.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {places.map((place) => (
            <div key={place.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{place.name}</p>
                <p className="text-sm text-muted-foreground">{place.location ?? `${place.city}, ${place.country}`}</p>
                <p className="text-sm">{t("admin.price")}: {place.price} EUR</p>
              </div>
              <div className="flex gap-2">
                <Button asChild type="button" variant="outline">
                  <Link href={`/places/manage?id=${place.id}`}>{t("admin.edit")}</Link>
                </Button>
                <Button type="button" variant="outline" className="text-red-600" onClick={() => handleDeletePlace(place.id)}>
                  {t("admin.delete")}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.reviews")} ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{t("admin.rating")}: {review.rating}/5</p>
                <p className="text-sm text-muted-foreground">{review.text || t("admin.noComment")}</p>
                <p className="text-xs text-muted-foreground">{t("admin.placeLabel")}: {review.placeId} | {t("admin.userLabel")}: {review.userId}</p>
              </div>
              <Button type="button" variant="outline" className="text-red-600" onClick={() => handleDeleteReview(review.id)}>
                {t("admin.delete")}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
