"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, getMe, checkUsername } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, User, Mail, Lock, Calendar, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Name", description: "What's your name?" },
  { title: "Birthday", description: "When were you born?" },
  { title: "Contact", description: "Your email address" },
  { title: "Security", description: "Choose a password" },
  { title: "Username", description: "Pick a handle" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    email: "",
    password: "",
    username: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => s - 1);

  const validateCurrentStep = () => {
    switch (step) {
      case 0:
        if (!formData.firstName || !formData.lastName) {
          setError("First and last name are required");
          return false;
        }
        return true;
      case 1:
        if (!formData.birthday) {
          setError("Birthday is required");
          return false;
        }
        return true;
      case 2:
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError("Valid email is required");
          return false;
        }
        return true;
      case 3:
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return false;
        }
        return true;
      case 4:
        if (!formData.username) {
          setError("Username is required");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (step < 4) {
      nextStep();
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: `${formData.firstName} ${formData.lastName}`,
        dateOfBirth: formData.birthday ? new Date(formData.birthday).toISOString() : new Date().toISOString(),
      });

      if (response.token) {
        setAuth(response.token, null);
        const user = await getMe();
        setAuth(response.token, user);
        toast.success("Account created successfully!");
        router.push("/feed");
      }
    } catch (err: any) {
      setError(err.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => updateFormData("lastName", e.target.value)}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => updateFormData("birthday", e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => updateFormData("username", e.target.value.toLowerCase())}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By clicking "Complete Registration", you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i <= step ? "bg-primary" : "bg-muted",
                      i === step ? "w-8" : "w-4"
                    )}
                  />
                ))}
             </div>
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
               Step {step + 1} of 5
             </span>
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            {STEPS[step].title}
          </CardTitle>
          <CardDescription className="text-muted-foreground font-medium text-base">
            {STEPS[step].description}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="min-h-[140px]">
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-50 border-red-100 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}
            {renderStep()}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex gap-3 w-full">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-12 p-0"
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  <ChevronLeft size={20} />
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 h-12"
                disabled={isLoading}
              >
                {step === 4 ? (isLoading ? "Creating account..." : "Complete Registration") : "Continue"}
                {step < 4 && <ChevronRight className="ml-2" size={20} />}
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
