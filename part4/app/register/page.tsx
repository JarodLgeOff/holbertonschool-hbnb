"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { register } from "@/lib/api";
import { hasToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type RegisterValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const registerSchema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(2, t("validation.firstNameMin")),
          lastName: z.string().min(2, t("validation.lastNameMin")),
          email: z.string().email(t("validation.email")),
          password: z.string().min(6, t("validation.passwordMin")),
          confirmPassword: z.string().min(6, t("validation.confirmPasswordMin")),
        })
        .refine((values) => values.password === values.confirmPassword, {
          message: t("validation.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [language, t]
  );
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (hasToken()) {
      router.replace("/places");
    }
  }, [router]);

  const onSubmit = async (values: RegisterValues) => {
    try {
      await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });

      toast.success(t("register.success"));
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("register.failure");
      toast.error(message);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center px-4 py-16 sm:px-6 lg:px-8">
      <Link
        aria-label={t("auth.backHome")}
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted sm:left-4 sm:top-4"
        href="/"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <Card className="w-full border-border/70 bg-card/80 shadow-xl shadow-black/5">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-3xl tracking-tight">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("register.firstName")}</FormLabel>
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
                      <FormLabel>{t("register.lastName")}</FormLabel>
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
                    <FormLabel>{t("register.email")}</FormLabel>
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
                    <FormLabel>{t("register.password")}</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("register.confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit">
                {t("register.submit")}
              </Button>
            </form>
          </Form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t("register.hasAccount")} {" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/login">
              {t("register.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
