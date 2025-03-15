"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db/supabase";
import { loadAllUsers, loadAllNotes, updateUserProfile, uploadAvatar, deleteUserAccount, deleteNote, saveNote, createUser, updateUser } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { handleError } from "@/lib/errors";
import { User, Note } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProfile } from "@/components/admin/AdminProfile";
import { UserManagement } from "@/components/admin/UserManagement";
import { NoteManagement } from "@/components/admin/NoteManagement";

interface NoteWithUser extends Note {
  users?: { name?: string; email?: string };
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    initial: true,
    saving: false,
    refreshingUsers: false,
    refreshingNotes: false,
    submitting: false,
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allNotes, setAllNotes] = useState<NoteWithUser[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (data?.role !== "admin") {
          showToast({ title: "Access Denied", description: "You don't have permission to access this page", type: "error" });
          router.push("/");
          return;
        }

        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          role: data?.role || "user",
          name: data?.name || session.user.user_metadata?.name || "",
          avatar_url: data?.avatar_url || "",
          created_at: data?.created_at || new Date().toISOString(),
        };

        setUser(userData);
        await fetchAllUsers();
        await fetchAllNotes();
      } catch (error) {
        handleError(error, "Failed to load admin data");
        router.push("/");
      } finally {
        setLoadingStates(prev => ({ ...prev, initial: false }));
      }
    };

    fetchAdminData();
  }, [router]);

  const fetchAllUsers = async () => {
    setLoadingStates(prev => ({ ...prev, refreshingUsers: true }));
    try {
      const data = await loadAllUsers();
      setAllUsers(data);
    } catch (error) {
      handleError(error, "Failed to load users");
    } finally {
      setLoadingStates(prev => ({ ...prev, refreshingUsers: false }));
    }
  };

  const fetchAllNotes = async () => {
    setLoadingStates(prev => ({ ...prev, refreshingNotes: true }));
    try {
      const data = await loadAllNotes();
      setAllNotes(data);
    } catch (error) {
      handleError(error, "Failed to load notes");
    } finally {
      setLoadingStates(prev => ({ ...prev, refreshingNotes: false }));
    }
  };

  const handleProfileUpdate = async ({ name, email, avatarFile }: { name: string; email: string; avatarFile: File | null }) => {
    if (!user) return;
    setLoadingStates(prev => ({ ...prev, saving: true }));
    try {
      if (name !== user.name) await updateUserProfile(user.id, { name });
      let avatarUrl = user.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile);
        await updateUserProfile(user.id, { avatar_url: avatarUrl });
      }
      if (email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        showToast({ title: "Email update requested", description: "Please check your new email for a confirmation link", type: "info" });
      }
      setUser({ ...user, name, avatar_url: avatarUrl });
      showToast({ title: "Profile updated", description: "Your profile has been updated successfully", type: "success" });
    } catch (error) {
      handleError(error, "Failed to update profile");
    } finally {
      setLoadingStates(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setLoadingStates(prev => ({ ...prev, submitting: true }));
    try {
      await deleteUserAccount(userId);
      setAllUsers(prev => prev.filter(user => user.id !== userId));
      showToast({ title: "User deleted", description: "The user has been deleted successfully", type: "success" });
    } catch (error) {
      handleError(error, "Failed to delete user");
    } finally {
      setLoadingStates(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setLoadingStates(prev => ({ ...prev, submitting: true }));
    try {
      await deleteNote(noteId);
      setAllNotes(prev => prev.filter(note => note.id !== noteId));
      showToast({ title: "Note deleted", description: "The note has been permanently deleted", type: "success" });
    } catch (error) {
      handleError(error, "Failed to delete note");
    } finally {
      setLoadingStates(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleSaveNote = async (noteData: { id?: string; title: string; content: string; user_id: string }) => {
    setLoadingStates(prev => ({ ...prev, submitting: true }));
    try {
      await saveNote(noteData);
      await fetchAllNotes();
      showToast({
        title: noteData.id ? "Note Updated" : "Note Created",
        description: `Note "${noteData.title}" was ${noteData.id ? "updated" : "created"} successfully.`,
        type: "success",
      });
    } catch (error) {
      handleError(error, `Failed to ${noteData.id ? "update" : "create"} note`);
    } finally {
      setLoadingStates(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleSaveUser = async (userData: { id?: string; email: string; password?: string; name: string; role: string }) => {
    setLoadingStates(prev => ({ ...prev, submitting: true }));
    try {
      if (userData.id) {
        await updateUser(userData.id, {
          name: userData.name,
          role: userData.role
        });
      } else {
        if (!userData.password) {
          throw new Error("Password is required when creating a new user");
        };
        await createUser({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          role: userData.role,
        });
      }

      await fetchAllUsers();
      showToast({
        title: userData.id ? "User Updated" : "User Created",
        description: `User ${userData.id ? "updated" : "created"} successfully.`,
        type: "success",
      });
    } catch (error) {
      handleError(error, `Failed to ${userData.id ? "update" : "create"} user`);
    } finally {
      setLoadingStates(prev => ({ ...prev, submitting: false }));
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-4">You need admin privileges to view this page</p>
          <Button asChild><Link href="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="container mx-auto p-4 flex-1">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to notes
          </Link>
          <h1 className="text-2xl font-bold text-center mb-4">Admin Dashboard</h1>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Admin Profile</TabsTrigger>
              <TabsTrigger value="users">Manage Users</TabsTrigger>
              <TabsTrigger value="notes">Manage Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <AdminProfile user={user} onUpdate={handleProfileUpdate} loading={loadingStates.saving} />
            </TabsContent>
            <TabsContent value="users">
              <UserManagement
                users={allUsers}
                onDelete={handleDeleteUser}
                onSave={handleSaveUser}
                onRefresh={fetchAllUsers}
                loadingStates={{ refreshing: loadingStates.refreshingUsers, submitting: loadingStates.submitting }}
              />
            </TabsContent>
            <TabsContent value="notes">
              <NoteManagement
                notes={allNotes}
                users={allUsers}
                onDelete={handleDeleteNote}
                onSave={handleSaveNote}
                onRefresh={fetchAllNotes}
                loadingStates={{ refreshing: loadingStates.refreshingNotes, submitting: loadingStates.submitting }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}