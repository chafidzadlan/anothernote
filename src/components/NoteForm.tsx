"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NoteForm() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from("notes").insert([{ title, content }]);

        if (!error) {
            setTitle("");
            setContent("");
            window.location.reload();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-100 rounded-lg text-black">
            <input
                type="text"
                placeholder="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mb-2 p-2 rounded border"
                required
            />
            <textarea
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full mb-4 p-2 rounded border"
                required
            />
            <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Add Note
            </button>
        </form>
    );
}