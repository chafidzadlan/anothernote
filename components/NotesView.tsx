import { Note } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/notes/storage";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PenSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface NoteViewProps {
  note: Note;
  onEdit: () => void;
}
export default function NoteView({ note, onEdit }: NoteViewProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{note.title || "Untitled Note"}</CardTitle>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <PenSquare className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(note.created_at)}
          {note.updated_at && note.updated_at !== note.created_at &&
            ` (Updated: ${formatDate(note.updated_at)})`}
        </p>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="prose dark:prose-invert max-w-none">
            {note.content ? (
              <ReactMarkdown>{note.content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">No content</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};