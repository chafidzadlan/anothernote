"use client";

import { Note } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => Promise<Note | null>;
  onCancel: () => void;
}

export default function NoteEditor({
  note,
  onCancel,
  onSave,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    };

    if (title !== note.title || content !== note.content) {
      const timeoutId = setTimeout(async () => {
        await handleAutoSave();
      }, 3000);
      setAutoSaveTimeout(timeoutId);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      };
    };
  }, [title, content]);

  const handleAutoSave = async () => {
    if (title === note.title && content === note.content) return;

    const updatedNote = {
      ...note,
      title: title.trim() || "Untitled Note",
      content,
      updated_at: new Date().toISOString(),
    };

    await onSave(updatedNote);
  };

  const handleSave = async () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      setAutoSaveTimeout(null);
    };

    setIsSaving(true);

    const updatedNote = {
      ...note,
      title: title.trim() || "Untitled Note",
      content,
      updated_at: new Date().toISOString(),
    };

    await onSave(updatedNote);
    setIsSaving(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="text-xl font-bold border-none px-0 focus-visible:ring-0"
        />
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
          className="h-[calc(100vh-300px)] resize-none border-none focus-visible:ring-0 p-0 "
        />
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}