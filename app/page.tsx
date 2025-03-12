"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Note, User } from "@/lib/types";
import { supabase } from "@/lib/db/supabase";
import { loadNotes, saveNote, deleteNote } from "@/lib/notes/storage";
import Header from "@/components/Header";
import NotesSidebar from "@/components/notes/NotesSidebar";
import EmptyState from "@/components/notes/EmptyState";
import NoteEditor from "@/components/notes/NoteEditor";
import NoteView from "@/components/notes/NotesView";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";

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

    const newNote: Omit<Note, "id"> & { id?: string } = {
      title: "New Note",
      content: "",
      created_at: new Date().toISOString(),
      user_id: user.id,
    };

    try {
      const savedNote = await saveNote(newNote as Note);
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
    } catch (error) {
      console.error("Error creating note:", error);
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
      await deleteNote(id);

      setNotes(notes.filter(n => n.id !== id));
      if (activeNote?.id === id) {
        setActiveNote(null);
      };

      showToast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
        type: "success"
      });
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
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Another Note
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A simple and elegant notes management application to organize your ideas, tasks, memories.
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