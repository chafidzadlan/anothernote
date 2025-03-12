"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Note, User } from "@/lib/types";
import { supabase } from "@/lib/db/supabase";
import { loadNotes, saveNote, deleteNote } from "@/lib/notes/storage";
import Header from "@/components/Header";
import NotesSidebar from "@/components/NotesSidebar";
import EmptyState from "@/components/EmptyState";
import NoteEditor from "@/components/NoteEditor";
import NoteView from "@/components/NotesView";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role: data?.role || "user",
          name: data?.name || session.user.user_metadata?.name,
          avatar_url: data?.avatar_url
        });

        const userNotes = await loadNotes(session.user.id);
        setNotes(userNotes);
      };

      setIsLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: data?.role || "user",
            name: data?.name || session.user.user_metadata?.name,
            avatar_url: data?.avatar_url,
          });

          const userNotes = await loadNotes(session.user.id);
          setNotes(userNotes);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setNotes([]);
          setActiveNote(null);
        };
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const createNewNote = async () => {
    if (!user) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: "New Note",
      content: "",
      created_at: new Date().toISOString(),
      user_id: user.id,
    };

    try {
      const savedNote = await saveNote(newNote);
      if (savedNote) {
        setNotes([savedNote, ...notes]);
        setActiveNote(savedNote);
        setIsEditing(true);

        showToast({
          title: "Note created",
          description: "Your new note has been created successfully.",
          type: "success"
        });
      };
    } catch {
      showToast({
        title: "Error",
        description: "Failed to create new note.",
        type: "error"
      });
    };
  };

  const selectNote = (note: Note) => {
    setActiveNote(note);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveNote = async (updatedNote: Note) => {
    try {
      const savedNote = await saveNote(updatedNote);
      if (savedNote) {
        setNotes(notes.map(n => n.id === savedNote.id ? savedNote : n));
        setActiveNote(savedNote);
        setIsEditing(false);

        showToast({
          title: "Note saved",
          description: "Your note has been saved successfully",
          type: "success"
        });
      };
      return savedNote;
    } catch {
      showToast({
        title: "Error",
        description: "Failed to save note.",
        type: "error"
      });
      return null;
    };
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const success = await deleteNote(id);
      if (success) {
        setNotes(notes.filter(n => n.id !== id));
        if (activeNote?.id === id) {
          setActiveNote(null);
        };

        showToast({
          title: "Note deleted",
          description: "Your note has been deleted successfully.",
          type: "success"
        });
      };
    } catch {
      showToast({
        title: "Error",
        description: "Failed to delete note",
        type: "error"
      });
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="mr-2 h-8 w-8 animate-spin" />
    </div>
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Login</h1>
          <div className="space-y-2">
            <Button onClick={() => router.push("/login")}>Login</Button>
            <Button variant="outline" onClick={() => router.push("/register")}>Register</Button>
          </div>
        </div>
      </div>
    )
  }

  const renderNoteContent = () => {
    if (!activeNote && notes.length === 0) {
      return (
        <EmptyState
          message="Create your first note to get started"
          buttonText="New Note"
          onButtonClick={createNewNote}
        />
      );
    };
    if (activeNote && isEditing) {
      return (
        <NoteEditor note={activeNote} onSave={handleSaveNote} onCancel={cancelEdit} />
      );
    };
    if (activeNote) {
      return (
        <NoteView note={activeNote} onEdit={() => setIsEditing(true)} />
      );
    };
    return (
      <EmptyState
        message="Select a note or create a new one"
        buttonText="New Note"
        onButtonClick={createNewNote}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
        <div className="md:col-span-1">
          <NotesSidebar
            createNewNote={createNewNote}
            notes={notes}
            onSelectNote={selectNote}
            onDeleteNote={handleDeleteNote}
            activeNoteId={activeNote?.id}
          />
        </div>
        <div className="md:col-span-3">{renderNoteContent()}</div>
      </main>
    </div>
  );
};