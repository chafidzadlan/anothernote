"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
          <h1 className="text-2xl font-bold">Another Note</h1>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>
        <AuthForm type="register" />
      </div>
    </div>
  );
};