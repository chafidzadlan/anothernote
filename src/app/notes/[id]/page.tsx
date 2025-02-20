import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// Define the expected params type
interface PageProps {
  params: {
    id: string; // Route parameter is always a string
    title: string;
    content: string;
    created_at: string;
  };
}

export default async function NoteDetail({ params }: PageProps) {
  // Fetch the note from Supabase
  const { data: note, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", params.id)
    .single();

  // Handle errors or missing note
  if (error) {
    console.error("Error fetching note:", error);
    return <div>Error loading note</div>;
  }

  if (!note) {
    return <div>Note not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/" className="text-blue-500 mb-4 inline-block">
        ← Back to notes
      </Link>
      <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
      <div className="mt-4 text-gray-400">
        Created: {new Date(note.created_at).toLocaleString()}
      </div>
    </div>
  );
}