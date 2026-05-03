"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const formSchema = z
  .object({
    fullName: z.string().trim().min(2, { message: "Please enter your name." }).max(80, { message: "Name is too long." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string().min(6, { message: "Confirm Password must be at least 6 characters." }),
    mode: z.enum(["create", "link"]),
    vendorName: z.string().trim().optional(),
    vendorDescription: z.string().trim().max(280, { message: "Description must be 280 characters or fewer." }).optional(),
    vendorId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "create" && (!data.vendorName || data.vendorName.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vendorName"],
        message: "Vendor name must be at least 2 characters.",
      });
    }

    if (data.mode === "link" && !data.vendorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vendorId"],
        message: "Please choose an existing vendor.",
      });
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type VendorOption = {
  id: string;
  name: string;
  slug: string;
  neighborhoodSlugs?: string[];
};

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vendorQuery, setVendorQuery] = useState("");
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as never),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      mode: "create",
      vendorName: "",
      vendorDescription: "",
      vendorId: undefined,
    },
  });

  const mode = form.watch("mode");

  useEffect(() => {
    if (mode !== "link") {
      return;
    }

    const controller = new AbortController();
    const fetchVendors = async () => {
      setIsLoadingVendors(true);
      try {
        const query = vendorQuery.trim();
        const response = await fetch(`/api/auth/vendors${query ? `?q=${encodeURIComponent(query)}` : ""}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load vendors");
        }

        const payload = (await response.json()) as { items?: VendorOption[] };
        setVendorOptions(payload.items ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Unable to load vendors");
        }
      } finally {
        setIsLoadingVendors(false);
      }
    };

    fetchVendors();
    return () => controller.abort();
  }, [mode, vendorQuery]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            name: data.fullName.trim(),
          },
        },
      });

      if (signupError) {
        toast.error("Sign-up failed", { description: signupError.message });
        return;
      }

      if (!signupData.user) {
        toast.error("Sign-up failed", { description: "No user was returned by authentication." });
        return;
      }

      const onboardingPayload =
        data.mode === "create"
          ? {
              mode: "create" as const,
              vendorName: data.vendorName?.trim(),
              description: data.vendorDescription?.trim() || undefined,
            }
          : {
              mode: "link" as const,
              vendorId: data.vendorId,
            };

      const onboardingResponse = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(onboardingPayload),
      });

      if (!onboardingResponse.ok) {
        const payload = (await onboardingResponse.json().catch(() => null)) as { error?: string } | null;
        toast.error("Onboarding failed", {
          description: payload?.error ?? "Unable to finalize vendor membership.",
        });
        return;
      }

      toast.success("Account created");
      router.push("/dashboard/default");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-full-name">Full name</FieldLabel>
              <Input
                {...field}
                id="register-full-name"
                type="text"
                placeholder="Alex Vendor"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-email">Email Address</FieldLabel>
              <Input
                {...field}
                id="register-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-password">Password</FieldLabel>
              <Input
                {...field}
                id="register-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-confirm-password">Confirm Password</FieldLabel>
              <Input
                {...field}
                id="register-confirm-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="mode"
          render={({ field }) => (
            <Field className="gap-1.5">
              <FieldLabel htmlFor="register-vendor-mode">Vendor setup</FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("vendorId", undefined);
                }}
              >
                <SelectTrigger id="register-vendor-mode" className="w-full">
                  <SelectValue placeholder="Choose vendor setup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create new vendor</SelectItem>
                  <SelectItem value="link">Link existing vendor</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        {mode === "create" && (
          <>
            <Controller
              control={form.control}
              name="vendorName"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-vendor-name">Vendor name</FieldLabel>
                  <Input
                    {...field}
                    id="register-vendor-name"
                    type="text"
                    placeholder="Cafe Neighborhood"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="vendorDescription"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-vendor-description">Vendor description (optional)</FieldLabel>
                  <Input
                    {...field}
                    id="register-vendor-description"
                    type="text"
                    placeholder="Neighborhood pastry shop"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>Up to 280 characters.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </>
        )}

        {mode === "link" && (
          <>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="register-vendor-search">Search existing vendors</FieldLabel>
              <Input
                id="register-vendor-search"
                type="text"
                value={vendorQuery}
                onChange={(event) => setVendorQuery(event.target.value)}
                placeholder="Search by name or slug"
              />
            </Field>
            <Controller
              control={form.control}
              name="vendorId"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-vendor-id">Choose vendor</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="register-vendor-id" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder={isLoadingVendors ? "Loading vendors..." : "Select vendor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorOptions.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} ({vendor.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isLoadingVendors && vendorOptions.length === 0 && (
                    <FieldDescription>No vendors found. Try searching or choose create new vendor.</FieldDescription>
                  )}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </>
        )}
      </FieldGroup>
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        Register
      </Button>
    </form>
  );
}
