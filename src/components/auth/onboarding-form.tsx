"use client";

import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep slug updated with name unless manually edited
  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const finalSlug = slug.trim() || slugify(name);
    if (!name.trim()) {
      setError("Please enter a workspace name.");
      return;
    }
    if (!finalSlug) {
      setError("Please enter a valid URL slug.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: createError } = await authClient.organization.create({
        name: name.trim(),
        slug: finalSlug,
      });

      if (createError) {
        setError(createError.message ?? "Unable to create your workspace.");
        return;
      }

      // Refresh page context/session and navigate to dashboard
      await router.navigate({ to: "/dashboard" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      asideDescription="Create a dedicated workspace for your agency or freelance business. This acts as your private hub to manage clients, projects, and delivery."
      asideTitle="Set up your workspace."
    >
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6 font-sans lg:mx-0">
        <div
          className="animate-slide-up-fade text-center lg:text-left"
          style={{ animationDelay: "50ms" }}
        >
          <h2 className="font-bold text-3xl text-[#08361f] tracking-tight dark:text-white">
            Name your workspace
          </h2>
          <p className="mt-1.5 text-muted-foreground text-xs">
            This will be the name of your agency or studio
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "100ms" }}
            >
              <FieldLabel
                className="text-slate-700 dark:text-slate-300"
                htmlFor="name"
              >
                Workspace Name
              </FieldLabel>
              <Input
                autoComplete="off"
                className="h-10 border-border bg-card px-3.5 py-2 text-sm transition-all duration-150 focus-visible:border-primary focus-visible:ring-primary/20"
                id="name"
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="e.g. Anderson Design"
                required
                value={name}
              />
            </Field>

            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "150ms" }}
            >
              <FieldLabel
                className="text-slate-700 dark:text-slate-300"
                htmlFor="slug"
              >
                Workspace Slug (URL slug)
              </FieldLabel>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-slate-500 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="select-none text-xs">clientra.app/</span>
                <input
                  autoComplete="off"
                  className="flex-1 bg-transparent p-0 text-slate-900 text-sm outline-none dark:text-white"
                  id="slug"
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  placeholder="anderson-design"
                  required
                  value={slug}
                />
              </div>
            </Field>

            {error && (
              <FieldError className="animate-slide-up-fade">{error}</FieldError>
            )}

            <Field
              className="animate-slide-up-fade"
              style={{ animationDelay: "200ms" }}
            >
              <Button
                className="mt-2 h-10 w-full bg-primary px-4 font-semibold text-primary-foreground text-sm shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.985]"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Creating workspace..." : "Create workspace"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </AuthShell>
  );
}
