import { supabase } from "@/lib/db/supabase";
import { Note } from "@/lib/types";
import { DatabaseError } from "@/lib/errors";

export async function loadNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new DatabaseError("Failed to load notes", error);
  };
  return data || [];
};

export async function saveNote(note: Note): Promise<Note | null> {
  const { data, error } = await supabase
    .from("notes")
    .upsert(note)
    .select()
    .single();
  if (error) {
    throw new DatabaseError(`Failed to save note: ${note.title}`, error);
  };
  if (!data) {
    throw new DatabaseError("No data returned from save operation");
  };
  return data;
};

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);
  if (error) {
    throw new DatabaseError(`Failed to delete note with ID: ${noteId}`, error);
  };
};

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export async function updateUserProfile(userId: string, updates: { name?: string, avatar_url?: string }): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    });
  if (error) {
    throw new DatabaseError("Failed to update user profile", error);
  };
};

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("user-content")
    .upload(filePath, file);

  if (uploadError) {
    throw new DatabaseError("Failed to upload avatar", uploadError);
  };

  const { data } = supabase.storage
    .from("user-content")
    .getPublicUrl(filePath);
  if (!data || !data.publicUrl) {
    throw new DatabaseError("Failed to get avatar URL");
  };

  return data.publicUrl;
};