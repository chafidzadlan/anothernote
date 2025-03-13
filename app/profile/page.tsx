"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db/supabase";
import { updateUserProfile, uploadAvatar } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { handleError } from "@/lib/errors";
import { User } from "@/lib/types";
import { ArrowLeft, Loader2, User as UserIcon, Key, Mail, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        };

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          role: data?.role || "user",
          name: data?.name || session.user.user_metadata?.name || "",
          avatar_url: data?.avatar_url || "",
        };
        setUser(userData);
        setProfileData({
          name: userData.name,
          email: userData.email,
        });
      } catch (error) {
        handleError(error, "Failed to load user profile");
        router.push("/login");
      } finally {
        setIsLoading(false);
      };
    };

    fetchUser();
  }, [router]);

  const getInitials = (name?: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id.startsWith("password-")) {
      setPasswordData(prev => ({
        ...prev,
        [id.replace("password-", "")]: value,
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [id]: value,
      }));
    };
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({
        title: "Invalid file",
        description: "Please upload an image file",
        type: "error",
      });
      return;
    };
    if (file.size > 2 * 1024 * 1024)  {
      showToast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        type: "error",
      });
      return;
    };

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setIsSaving(true);

    try {
      if (profileData.name !== user.name) {
        await updateUserProfile(user.id, {
          name: profileData.name,
        });
      };

      let avatarUrl = user.avatar_url;
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(user.id, avatarFile);
          await updateUserProfile(user.id, {
            avatar_url: avatarUrl,
          });
        } catch (error) {
          console.error("Failed to upload avatar:", error);
          showToast({
            title: "Avatar update failed",
            description: "Your profile information was updated, but we couldn't update your avatar",
            type: "warning",
          });
        }
      }

      if (profileData.email !== user.email) {
        const { error } = await supabase.auth.updateUser({
          email: profileData.email,
        });

        if (error) {
          showToast({
            title: "Email update failed",
            description: "Your profile was updated, but we couldn't update your email",
            type: "warning",
          });
        } else {
          showToast({
            title: "Email update requested",
            description: "Please check your new email for a confirmation link",
            type: "info",
          });
        };
      };

      setUser({
        ...user,
        name: profileData.name,
        avatar_url: avatarFile ? avatarUrl : user.avatar_url,
      });

      showToast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
        type: "success",
      });
    } catch (error) {
      handleError(error, "Failed to update profile");
    } finally {
      setIsSaving(false);
    };
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        type: "error",
      });
      return;
    };

    setIsSaving(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: passwordData.currentPassword,
      });
      if (signInError) {
        showToast({
          title: "Invalid password",
          description: "Your current password is incorrect",
          type: "error",
        });
        setIsSaving(false);
        return;
      };

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      if (error) throw error;

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showToast({
        title: "Password updated",
        description: "Your password has been changed successfully",
        type: "success",
      });
    } catch (error) {
      handleError(error, "Failed to update password");
    } finally {
      setIsSaving(true);
    };
  };

  const handleAccountDeletion = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);
      if (profileError) throw profileError;

      const { error: notesError } = await supabase
        .from("notes")
        .delete()
        .eq("user_id", user.id);
      if (notesError) throw notesError;

      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;

      await supabase.auth.signOut();

      showToast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
        type: "info",
      });

      router.push("/");
    } catch (error) {
      handleError(error, "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-4">
            You need to be logged in to view this page
          </p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="container mx-auto p-4 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm justify-start text-muted-foreground hover:text-primary mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to notes
            </Link>
          </div>
          <div className="flex justify-center items-center mb-4">
            <h1 className="text-2xl font-bold">Your Profile</h1>
          </div>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="account">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card>
                <form onSubmit={handleProfileUpdate}>
                  <CardHeader className="text-center pb-4">
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your profile information and avatar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-24 w-24">
                          <AvatarImage
                            src={avatarPreview || user.avatar_url || ""}
                            alt={user.name}
                          />
                          <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid w-full max-w-sm items-center gap-2 pt-4">
                          <Label htmlFor="avatar">Avatar</Label>
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-4 flex-1 pb-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            value={profileData.name}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={profileData.email}
                            onChange={handleInputChange}
                            required
                          />
                          <p className="text-xs text-muted-foreground pl-1">
                            Changing your email will require verification
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <UserIcon className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <form onSubmit={handlePasswordChange}>
                  <CardHeader className="text-center">
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="password-currentPassword">Current Password</Label>
                      <Input
                        id="password-currentPassword"
                        type="password"
                        placeholder="Current password"
                        value={passwordData.currentPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-newPassword">New Password</Label>
                      <Input
                        id="password-newPassword"
                        type="password"
                        placeholder="New password"
                        value={passwordData.newPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-confirmPassword">Confirm Password</Label>
                      <Input
                        id="password-confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            <TabsContent value="account">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your email preference settings
                    </p>
                    <div className="mt-4">
                      <Button variant="outline">
                        <Mail className="mr-2 h-4 w-4" />
                        Manage Email preferences
                      </Button>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently delete your account and all of your content
                    </p>
                    <div className="mt-4">
                      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your
                              account and remove all of your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleAccountDeletion}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete Account"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};