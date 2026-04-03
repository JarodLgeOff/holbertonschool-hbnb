"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getCurrentUser, updateCurrentUser } from "@/lib/api";
import { getUserInfo, hasToken, setUserInfo } from "@/lib/auth";
import { dispatchAuthChange } from "@/lib/useAuth";

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez saisir une adresse email valide"),
  password: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!hasToken()) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const currentUser = await getCurrentUser();
        const storedUser = getUserInfo();

        form.reset({
          firstName: currentUser?.firstName || storedUser.firstName,
          lastName: currentUser?.lastName || storedUser.lastName,
          email: currentUser?.email || storedUser.email,
          password: "",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de charger votre profil";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [form, router]);

  const onSubmit = async (values: ProfileValues) => {
    try {
      const updated = await updateCurrentUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password || undefined,
      });

      const existing = getUserInfo();
      setUserInfo(
        updated.first_name || values.firstName,
        updated.last_name || values.lastName,
        values.email,
        updated.is_admin ?? existing.isAdmin
      );
      dispatchAuthChange();
      toast.success("Profil mis à jour");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de mettre à jour le profil";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Compte</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Mon profil</h1>
          <p className="mt-3 text-muted-foreground">Consultez et mettez à jour vos informations personnelles.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/places/manage">Gérer mes lieux</Link>
        </Button>
      </div>

      <Card className="border-border/70 bg-card/80 shadow-xl shadow-black/5">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Informations personnelles</CardTitle>
          <CardDescription>Modifiez votre prénom, votre nom, votre email ou votre mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement du profil...</p>
          ) : (
            <Form {...form}>
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="vous@hbnb.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input placeholder="Laisser vide si inchangé" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full sm:w-auto" type="submit">
                  Mettre à jour mon profil
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
