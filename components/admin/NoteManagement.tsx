// components/NoteManagement.tsx
import React, { useState } from "react";
import { User, Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/SearchInput";
import { Loader2, RefreshCw, Trash, MoreHorizontal, Edit, Plus } from "lucide-react";
import { Textarea } from "../ui/textarea";

interface NoteWithUser extends Note {
  users?: { name?: string; email?: string };
}

interface NoteManagementProps {
  notes: NoteWithUser[];
  users: User[];
  onDelete: (noteId: string) => void;
  onSave: (noteData: { id?: string; title: string; content: string; user_id: string }) => void;
  onRefresh: () => void;
  loadingStates: { refreshing: boolean; submitting: boolean };
}

export function NoteManagement({ notes, users, onDelete, onSave, onRefresh, loadingStates }: NoteManagementProps) {
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedNoteToDelete, setSelectedNoteToDelete] = useState<NoteWithUser | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteDialogMode, setNoteDialogMode] = useState<"create" | "edit">("create");
  const [noteFormData, setNoteFormData] = useState({ id: "", title: "", content: "", user_id: "" });

  const filteredNotes = notes.filter(note =>
    [note.title, note.content, note.users?.email, note.users?.name].some(val => val?.toLowerCase().includes(noteSearch.toLowerCase()))
  );

  const getInitials = (name?: string): string =>
    name ? name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2) : "U";

  const handleSave = () => {
    onSave(noteFormData);
    setIsNoteDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <CardTitle>Notes Management</CardTitle>
        <CardDescription>View and manage all notes in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4 gap-2">
          <SearchInput
            value={noteSearch}
            onChange={e => setNoteSearch(e.target.value)}
            onClear={() => setNoteSearch("")}
            placeholder="Search notes..."
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loadingStates.refreshing}>
            {loadingStates.refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setNoteDialogMode("create");
              setNoteFormData({ id: "", title: "", content: "", user_id: "" });
              setIsNoteDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create Note
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {noteSearch ? "No notes found matching your search" : "No notes found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotes.map(note => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium truncate max-w-[200px]">{note.title}</TableCell>
                    <TableCell><p className="truncate max-w-[200px]">{note.content || "No content"}</p></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{getInitials(note.users?.name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">{note.users?.name || note.users?.email || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(note.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setNoteDialogMode("edit");
                              setNoteFormData({ id: note.id, title: note.title, content: note.content || "", user_id: note.user_id });
                              setIsNoteDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Note
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setSelectedNoteToDelete(note)}
                          >
                            <Trash className="h-4 w-4 mr-2" /> Delete Note
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {selectedNoteToDelete && (
        <Dialog open={!!selectedNoteToDelete} onOpenChange={open => !open && setSelectedNoteToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Note</DialogTitle>
              <DialogDescription>Are you sure you want to delete this note? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="border rounded-md p-4 mb-4">
              <p className="font-medium">{selectedNoteToDelete.title}</p>
              <p className="text-sm text-muted-foreground">{selectedNoteToDelete.content || "No content"}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedNoteToDelete(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(selectedNoteToDelete.id);
                  setSelectedNoteToDelete(null);
                }}
                disabled={loadingStates.submitting}
              >
                {loadingStates.submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete Note"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isNoteDialogOpen} onOpenChange={open => !open && setIsNoteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{noteDialogMode === "create" ? "Create New Note" : "Edit Note"}</DialogTitle>
            <DialogDescription>{noteDialogMode === "create" ? "Add a new note for a user." : "Modify the selected note."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={noteFormData.title}
                onChange={e => setNoteFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                value={noteFormData.content}
                onChange={e => setNoteFormData(prev => ({ ...prev, content: e.target.value }))}
                className="resize-y"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-user">User</Label>
              <Select value={noteFormData.user_id} onValueChange={value => setNoteFormData(prev => ({ ...prev, user_id: value }))}>
                <SelectTrigger id="note-user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={loadingStates.submitting || !noteFormData.title || !noteFormData.user_id}
            >
              {loadingStates.submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : noteDialogMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};