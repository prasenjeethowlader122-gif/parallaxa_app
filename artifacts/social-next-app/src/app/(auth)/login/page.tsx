"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, verify2FA, getMe } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpInput, setShowTotpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (showTotpInput) {
        const response = await verify2FA({ email, code: totp });
        if (response.token) {
          await onLoginSuccess(response.token, response.user?.id);
        }
        return;
      }

      const response = await login({ email, password });

      if (response.twoFactorRequired) {
        setShowTotpInput(true);
        setIsLoading(false);
        return;
      }

      if (response.token) {
        await onLoginSuccess(response.token, response.user?.id);
      }
    } catch (err: any) {
      setErrors({ general: err.data?.message || "Invalid email or password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  async function onLoginSuccess(token: string, userId?: string) {
    try {
      setAuth(token, null);
      const user = await getMe();
      setAuth(token, user);
      toast.success("Welcome back!");
      router.push("/feed");
    } catch (err) {
      setAuth(token, null);
      router.push("/feed");
    }
  }

  const canSubmit = !isLoading && email.trim() !== "" && password.trim() !== "" && (!showTotpInput || totp.trim().length === 6);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-12">
        <div className="flex justify-center mb-7 mt-8">
           <img
             src="/parallaxa-logo.svg"
             className="h-[76px] w-auto object-contain dark:hidden"
             alt="Logo"
           />
           <img
             src="/parallaxa-logo-white.svg"
             className="h-[76px] w-auto object-contain hidden dark:block"
             alt="Logo"
           />
        </div>

        <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">
          Welcome back
        </h1>
        <p className="text-[15px] font-medium text-muted-foreground mt-2 mb-6">
          Sign in to continue to your account
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {errors.general && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 animate-in fade-in zoom-in-95">
              <span className="material-symbols-outlined !text-[20px] mt-0.5">error</span>
              <p className="text-[14px] font-semibold leading-tight">{errors.general}</p>
            </div>
          )}

          {!showTotpInput ? (
            <div className={cn("space-y-4 transition-opacity", isLoading && "opacity-50")}>
              <FloatingLabelInput
                id="email"
                label="Email Address"
                type="email"
                icon={<span className="material-symbols-outlined !text-[20px]">mail</span>}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />

              <div className="relative">
                <FloatingLabelInput
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  icon={<span className="material-symbols-outlined !text-[20px]">lock</span>}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="material-symbols-outlined !text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  }
                />
              </div>

              <div className="flex justify-end -mt-2 pb-6">
                <Link
                  href="/forgot-password"
                  className="text-[14px] font-bold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <FloatingLabelInput
                label="6-digit 2FA Code"
                type="text"
                maxLength={6}
                icon={<span className="material-symbols-outlined !text-[20px]">shield</span>}
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                required
                autoFocus
                disabled={isLoading}
              />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowTotpInput(false)}
                  className="text-[14px] font-bold text-primary hover:underline"
                >
                  ← Back to password
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-[54px] rounded-full text-[16px] font-bold bg-foreground text-background hover:bg-foreground/90 shadow-none transition-transform active:scale-[0.98]"
            disabled={!canSubmit}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>

          <div className="text-center pt-3">
             <p className="text-[14px] font-medium text-muted-foreground">
               Don't have an account?{" "}
               <Link href="/register" className="text-primary font-bold hover:underline">
                 Sign up
               </Link>
             </p>
          </div>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[12px] font-medium text-muted-foreground/60 leading-relaxed">
            By signing in, you agree to our{" "}
            <span className="text-primary font-bold">Terms of Service</span> and{" "}
            <span className="text-primary font-bold">Privacy Policy</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
