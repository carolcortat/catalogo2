"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").pipe(z.email("E-mail inválido")),
  password: z.string().min(1, "Informe sua senha"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      // Mensagem genérica: não revela se o e-mail existe
      setFormError("E-mail ou senha incorretos.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="email"
        label="E-mail"
        type="email"
        autoComplete="username"
        inputMode="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Entrar
      </Button>
    </form>
  );
}
