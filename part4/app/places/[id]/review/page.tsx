"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/lib/api";
import { hasToken } from "@/lib/auth";

const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, "Votre commentaire doit contenir au moins 10 caractères"),
});

type ReviewValues = z.infer<typeof reviewSchema>;

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  useEffect(() => {
    if (!hasToken()) {
      router.replace("/");
    }
  }, [router]);

  const onSubmit = async (values: ReviewValues) => {
    try {
      await createReview(params.id, values);
      toast.success("Avis publié");
      router.push(`/places/${params.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer votre avis";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full border-border/70 bg-card/80 shadow-xl shadow-black/5">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl tracking-tight">Ajouter un avis</CardTitle>
          <CardDescription>Partagez une note et un commentaire sur votre expérience.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisissez une note" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {value} / 5
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commentaire</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez votre séjour..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit">
                Publier l'avis
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}