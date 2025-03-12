import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/notes/EmptyState";
import { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/notes/storage";
import { Plus, Search, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface NotesSidebarProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  createNewNote: () => void;
  onDeleteNote: (id: string) => void;
  activeNoteId?: string;
}
export default function NotesSidebar({
  notes,
  onSelectNote,
  createNewNote,
  onDeleteNote,
  activeNoteId,
}: NotesSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>My Notes</CardTitle>
          <Button onClick={createNewNote} size="icon" variant="outline" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredNotes.length === 0 ? (
          <EmptyState
            message={searchTerm ? "No matching notes found" : "No notes yet"}
            buttonText={searchTerm ? "Clear search" : "Create your first note"}
            onButtonClick={searchTerm ? () => setSearchTerm("") : createNewNote}
          />
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-2">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className={`p-3 rounded-md cursor-pointer hover:bg-accent transition-colors ${
                    activeNoteId === note.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {note.title || "Untitled Note"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {note.content.trim() || "No content"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(note.created_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}