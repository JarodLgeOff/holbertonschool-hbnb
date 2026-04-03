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
import { useI18n } from "@/lib/i18n";
import { dispatchAuthChange } from "@/lib/useAuth";

type ProfileValues = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { t, language } = useI18n();
  const profileSchema = z.object({
    firstName: z.string().min(2, t("validation.firstNameMin")),
    lastName: z.string().min(2, t("validation.lastNameMin")),
    email: z.string().email(t("validation.email")),
    password: z.string().optional(),
  });
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
        const message = error instanceof Error ? error.message : t("profile.loadFailure");
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [form, router, t, language]);

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
      toast.success(t("profile.success"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("profile.failure");
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">{t("profile.account")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t("profile.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("profile.description")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/places/manage">{t("profile.managePlaces")}</Link>
        </Button>
      </div>

      <Card className="border-border/70 bg-card/80 shadow-xl shadow-black/5">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{t("profile.personalInfo")}</CardTitle>
          <CardDescription>{t("profile.personalInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("profile.loading")}</p>
          ) : (
            <Form {...form}>
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.firstName")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("profile.placeholderFirstName")} {...field} />
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
                        <FormLabel>{t("profile.lastName")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("profile.placeholderLastName")} {...field} />
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
                      <FormLabel>{t("profile.email")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.placeholderEmail")} type="email" {...field} />
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
                      <FormLabel>{t("profile.newPassword")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.placeholderPassword")} type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full sm:w-auto" type="submit">
                  {t("profile.update")}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
