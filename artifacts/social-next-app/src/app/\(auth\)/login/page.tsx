"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, verify2FA, getMe } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Mail, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpInput, setShowTotpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      setError(err.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onLoginSuccess(token: string, userId?: string) {
    try {
      setAuth(token, null); // Initial set to update API client
      const user = await getMe();
      setAuth(token, user);
      toast.success("Welcome back!");
      router.push("/feed");
    } catch (err) {
      setAuth(token, null);
      router.push("/feed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
             <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
               P
             </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Sign in to continue to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            {!showTotpInput ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-bold text-blue-600 hover:text-blue-700"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Label htmlFor="totp">6-digit 2FA Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="totp"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500 text-center text-2xl tracking-[0.5em] font-mono"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                    required
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowTotpInput(false)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 w-full text-center py-2"
                >
                  ← Back to password
                </button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold bg-slate-900 hover:bg-slate-800"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-center text-sm text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 font-bold hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
