import { supabase } from "@/lib/db/supabase";
import { Note, AdminNoteResult } from "@/lib/types";
import { DatabaseError } from "@/lib/errors";

// USER
export async function loadAllUsers() {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_get_all_profiles');

    if (!rpcError) {
      return rpcData || [];
    };

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new DatabaseError("Failed to load all users", error);
    };

    return data || [];
  } catch (error) {
    console.error("Error loading users:", error);
    throw new DatabaseError("Failed to load all users", error);
  }
}

export async function updateUserProfile(userId: string, updates: { name?: string, avatar_url?: string }): Promise<void> {
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined && value !== null)
  );

  if (Object.keys(filteredUpdates).length === 0) {
    return;
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      id: userId,
      ...filteredUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) {
    throw new DatabaseError("Failed to update user profile", error);
  };
};

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file) {
    throw new DatabaseError("No file provided for avatar upload");
  };

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${userId}/${fileName}`;

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

export async function createUser(userData: { email: string; password: string; name: string; role: string }): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new DatabaseError("Authentication required");
    }

    const response = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new DatabaseError(errorData.error || "Failed to create user");
    }
  } catch (error) {
    console.error("Error creating user:", error);
    throw new DatabaseError("Failed to create user", error);
  }
}

export async function updateUser(userId: string, updates: { name?: string; role?: string }): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new DatabaseError("Authentication required");
    }

    const response = await fetch("/api/admin/update-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, ...updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new DatabaseError(errorData.error || "Failed to update user");
    }
  } catch (error) {
    console.error("Error updating user:", error);
    throw new DatabaseError("Failed to update user", error);
  }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new DatabaseError("Authentication required");
    }

    const response = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, requesterId: session.user.id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new DatabaseError(errorData.error || "Failed to delete user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new DatabaseError("Failed to delete user", error);
  }
}

// NOTES
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

export async function loadAllNotes(): Promise<Note[]> {
  try {
    const { data, error } = await supabase.rpc('admin_get_all_notes');

    if (error) throw error;

    return (data as AdminNoteResult[] || []).map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      user_id: item.user_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      users: {
        name: item.user_name,
        email: item.user_email
      }
    }));
  } catch {
    const { data, error } = await supabase
      .from("notes")
      .select(`
        *,
        profiles:user_id(name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw new DatabaseError("Failed to load all notes", error);
    }

    return data || [];
  }
};

export async function saveNote(note: Partial<Note>): Promise<Note | null> {
  try {
    const isUpdate = !!note.id;
    const noteToSave = {
      ...(isUpdate ? { id: note.id } : {}),
      title: note.title || '',
      content: note.content || '',
      user_id: note.user_id,
      ...(isUpdate ? { updated_at: new Date().toISOString() } : { created_at: new Date().toISOString() }),
    };

    const { data, error } = await supabase
      .from("notes")
      .upsert(noteToSave)
      .select()
      .single();

    if (error) {
      console.error("Database error while saving note:", error);
      throw new DatabaseError(`Failed to save note: ${note.title}`, error);
    }

    if (!data) {
      throw new DatabaseError("No data returned from save operation");
    }

    return data;
  } catch (error) {
    console.error("Exception while saving note:", error);
    throw error instanceof DatabaseError ? error : new DatabaseError(`Failed to save note: ${note.title}`, error);
  }
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);
  if (error) {
    throw new DatabaseError(`Failed to delete note with ID: ${noteId}`, error);
  };
};

// OTHER
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
