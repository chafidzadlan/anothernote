import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export interface NoteProps {
    params: {
        id: number;
        title: string;
        content: string;
        created_at: string;
    };
}

export default async function NoteDetail({ params }: NoteProps) {
    const { data: note } = await supabase.from("notes").select("*").eq("id", params.id).single();

    if (!note) return <div>Note not found</div>

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