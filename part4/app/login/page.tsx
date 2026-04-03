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
import { login, getCurrentUser } from "@/lib/api";
import { hasToken, setToken, setUserInfo } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { dispatchAuthChange } from "@/lib/useAuth";

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("validation.email")),
        password: z.string().min(6, t("validation.passwordMin")),
      }),
    [language, t]
  );
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (hasToken()) {
      router.replace("/places");
    }
  }, [router]);

  const onSubmit = async (values: LoginValues) => {
    try {
      const response = await login(values);
      setToken(response.token);

      const user = await getCurrentUser();
      if (user) {
        setUserInfo(user.firstName, user.lastName, user.email || values.email, user.isAdmin);
      }

      dispatchAuthChange();

      toast.success(t("login.success"));
      router.push("/places");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("login.failure");
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
          <CardTitle className="text-3xl tracking-tight">{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.email")}</FormLabel>
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
                    <FormLabel>{t("login.password")}</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit">
                {t("login.submit")}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t("login.noAccount")} {" "}
                <a className="font-medium text-foreground underline-offset-4 hover:underline" href="/register">
                  {t("login.signup")}
                </a>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
