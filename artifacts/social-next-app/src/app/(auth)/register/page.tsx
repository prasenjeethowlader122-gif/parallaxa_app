"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, getMe } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => s - 1);

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        break;
      case 1:
        if (!formData.birthday) newErrors.birthday = "Birthday is required";
        break;
      case 2:
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Valid email is required";
        }
        break;
      case 3:
        if (formData.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        }
        break;
      case 4:
        if (!formData.username) newErrors.username = "Username is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (step < 4) {
      nextStep();
      return;
    }

    setErrors({});
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
      setErrors({ general: err.data?.message || "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <FloatingLabelInput
              id="firstName"
              label="First Name"
              icon={<span className="material-symbols-outlined !text-[20px]">person</span>}
              value={formData.firstName}
              onChange={(e) => updateFormData("firstName", e.target.value)}
              error={errors.firstName}
              autoFocus
            />
            <FloatingLabelInput
              id="lastName"
              label="Last Name"
              icon={<span className="material-symbols-outlined !text-[20px]">person</span>}
              value={formData.lastName}
              onChange={(e) => updateFormData("lastName", e.target.value)}
              error={errors.lastName}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <FloatingLabelInput
              id="birthday"
              label="Birthday"
              type="date"
              icon={<span className="material-symbols-outlined !text-[20px]">calendar_today</span>}
              value={formData.birthday}
              onChange={(e) => updateFormData("birthday", e.target.value)}
              error={errors.birthday}
              autoFocus
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <FloatingLabelInput
              id="email"
              label="Email Address"
              type="email"
              icon={<span className="material-symbols-outlined !text-[20px]">mail</span>}
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              error={errors.email}
              autoFocus
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <FloatingLabelInput
              id="password"
              label="Password"
              type="password"
              icon={<span className="material-symbols-outlined !text-[20px]">lock</span>}
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              error={errors.password}
              autoFocus
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <FloatingLabelInput
              id="username"
              label="Username"
              icon={<span className="material-symbols-outlined !text-[20px]">alternate_email</span>}
              value={formData.username}
              onChange={(e) => updateFormData("username", e.target.value.toLowerCase())}
              error={errors.username}
              autoFocus
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-12">
        <div className="flex items-center justify-between mb-8 mt-4">
           <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i <= step ? "bg-primary" : "bg-muted",
                    i === step ? "w-8" : "w-3"
                  )}
                />
              ))}
           </div>
           <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
             Step {step + 1} of 5
           </span>
        </div>

        <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">
          {STEPS[step].title}
        </h1>
        <p className="text-[15px] font-medium text-muted-foreground mt-2 mb-8">
          {STEPS[step].description}
        </p>

        <form onSubmit={handleRegister} className="space-y-6">
          {errors.general && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
              <span className="material-symbols-outlined !text-[20px] mt-0.5">error</span>
              <p className="text-[14px] font-semibold leading-tight">{errors.general}</p>
            </div>
          )}

          <div className="min-h-[140px]">
            {renderStep()}
          </div>

          <div className="flex gap-4 pt-4">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-[54px] w-[54px] p-0 rounded-full border-slate-200"
                onClick={prevStep}
                disabled={isLoading}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </Button>
            )}
            <Button
              type="submit"
              className={cn(
                "flex-1 h-[54px] rounded-full text-[16px] font-bold shadow-none transition-transform active:scale-[0.98]",
                step === 4 ? "bg-foreground text-background hover:bg-foreground/90" : "bg-primary text-white hover:bg-primary/90"
              )}
              disabled={isLoading}
            >
              {step === 4 ? (isLoading ? "Creating account..." : "Complete Registration") : "Continue"}
              {step < 4 && <span className="material-symbols-outlined ml-2">chevron_right</span>}
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-[14px] font-medium text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>

        {step === 4 && (
          <div className="mt-12 text-center animate-in fade-in duration-500">
            <p className="text-[12px] font-medium text-muted-foreground/60 leading-relaxed">
              By clicking "Complete Registration", you agree to our{" "}
              <span className="text-primary font-bold">Terms of Service</span> and{" "}
              <span className="text-primary font-bold">Privacy Policy</span>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
