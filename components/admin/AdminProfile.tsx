import React, { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, Loader2 } from "lucide-react";

interface AdminProfileProps {
  user: User;
  onUpdate: (data: { name: string; email: string; avatarFile: File | null }) => void;
  loading: boolean;
}

export function AdminProfile({ user, onUpdate, loading }: AdminProfileProps) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);

  useEffect(() => {
    setName(user.name || "");
    setEmail(user.email);
    setAvatarPreview(user.avatar_url || null);
  }, [user]);

  const getInitials = (name?: string): string =>
    name ? name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2) : "U";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      showToast({
        title: file?.type.startsWith("image/") ? "File too large" : "Invalid file",
        description: file?.type.startsWith("image/") ? "Please upload an image smaller than 2MB" : "Please upload an image file",
        type: "error",
      });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting:", { name, email, avatarFile });
    onUpdate({ name, email, avatarFile });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader className="text-center pb-4">
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your administrator profile information and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || ""} alt={name} />
                <AvatarFallback className="text-xl">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="grid w-full max-w-sm items-center gap-2 pt-4">
                <Label htmlFor="avatar">Avatar</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="text-sm" />
              </div>
            </div>
            <div className="space-y-4 flex-1 pb-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <p className="text-xs text-muted-foreground pl-1">Changing your email will require verification</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <UserIcon className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};