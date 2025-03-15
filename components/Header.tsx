import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

interface HeaderProps {
  user?: User | null;
  onLogout: () => Promise<void>;
};

export default function Header({ user, onLogout }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getInitials = (name?: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout();

      router.push("/");

      showToast({
        title: "Logged out",
        description: "You have been successfully logged out",
        type: "success"
      });
    } catch (error) {
      console.error("Logout error:", error);
      showToast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoggingOut(false);
    };
  };

  if (isLoggingOut) {
    <div className="flex items-center justify-center min-h-screen">
      <div className="mr-2 h-8 w-8">
        Logging out...
      </div>
    </div>
  };

  return (
    <header className="border-b p-4 bg-card sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-primary transition-colors">
          Another Note
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || ""} alt={user.name || user.email} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1 py-2">
                      <p className="text-sm font-medium leading-none capitalize">{user.name || "User"}</p>
                      <p className="text-zs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                    )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};