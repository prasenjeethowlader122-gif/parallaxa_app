"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { forgotPassword, resetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Lock, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: Token & New Password, 3: Success
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await forgotPassword({ email });
      setStep(2);
      toast.success("Reset code sent to your email");
    } catch (err: any) {
      setError(err.data?.message || "Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await resetPassword({ token, password: newPassword });
      setStep(3);
      toast.success("Password reset successfully");
    } catch (err: any) {
      setError(err.data?.message || "Invalid or expired token.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            {step === 1 ? "Forgot password?" : step === 2 ? "Reset password" : "Success!"}
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium text-base">
            {step === 1
              ? "Enter your email to receive a password reset code."
              : step === 2
                ? "Enter the code from your email and your new password."
                : "Your password has been reset successfully."}
          </CardDescription>
        </CardHeader>

        {step === 1 && (
          <form onSubmit={handleRequest}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold bg-slate-900" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>
              <Link href="/login" className="flex items-center text-sm font-bold text-blue-600 hover:underline">
                <ChevronLeft size={16} className="mr-1" />
                Back to login
              </Link>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="token">Reset Code</Label>
                <Input
                  id="token"
                  placeholder="Paste code here"
                  className="h-12 rounded-xl"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    className="pl-10 h-12 rounded-xl"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold bg-slate-900" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Resend code
              </button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <CardContent className="flex flex-col items-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <Button
              className="w-full h-12 rounded-xl text-base font-bold bg-slate-900"
              onClick={() => router.push("/login")}
            >
              Go to login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
