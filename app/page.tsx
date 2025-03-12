import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Another Note
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A simple and elegant notes management app to organize your ideas, tasks, and memories.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};