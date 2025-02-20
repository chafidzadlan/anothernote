import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default async function NoteList() {
    const { data: notes, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });

    if (error) return <div>Error loading notes</div>
    if (!notes?.length) return <div>No notes found</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg hover:shadow-lg">
                    <Link href={`/notes/${note.id}`}>
                        <h3 className="text-xl font-semibold mb-2">{note.title}</h3>
                        <p className="text-gray-600 truncate">{note.content}</p>
                        <small className="text-gray-400">
                            {new Date(note.created_at).toLocaleDateString()}
                        </small>
                    </Link>
                </div>
            ))}
        </div>
    );
}