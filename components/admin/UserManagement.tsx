import React, { useState } from "react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/SearchInput";
import { Loader2, RefreshCw, Trash, MoreHorizontal, Edit, Plus } from "lucide-react";

interface UserManagementProps {
  users: User[];
  onDelete: (userId: string) => void;
  onSave?: (userData: { id?: string; email: string; password?: string; name: string; role: string }) => void;
  onRefresh: () => void;
  loadingStates: { refreshing: boolean; submitting: boolean };
}

export function UserManagement({ users, onDelete, onSave, onRefresh, loadingStates }: UserManagementProps) {
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<"create" | "edit">("create");
  const [userFormData, setUserFormData] = useState({ id: "", email: "", password: "", name: "", role: "user" });
  const [isSaving, setIsSaving] = useState(false);

  const filteredUsers = users.filter(user =>
    [user.name, user.email, user.role].some(val => val?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const getInitials = (name?: string): string =>
    name ? name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2) : "U";

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(userFormData);
        setIsUserDialogOpen(false);
        onRefresh();
      } else {
        console.error("onSave function not provided to UserManagement component")
        setIsUserDialogOpen(false);
      };
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <CardTitle>Users Information</CardTitle>
        <CardDescription>View and manage all users registered in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4 gap-2">
          <SearchInput
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            onClear={() => setUserSearch("")}
            placeholder="Search users..."
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loadingStates.refreshing}>
            {loadingStates.refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setUserDialogMode("create");
              setUserFormData({ id: "", email: "", password: "", name: "", role: "user" });
              setIsUserDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create User
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {userSearch ? "No users found matching your search" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[160px]">{user.name || "Anonymous"}</span>
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${user.role === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}</TableCell>
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
                              setUserDialogMode("edit");
                              setUserFormData({ id: user.id, email: user.email, password: "", name: user.name || "", role: user.role });
                              setIsUserDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setSelectedUserToDelete(user)}
                          >
                            <Trash className="h-4 w-4 mr-2" /> Delete User
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
      {selectedUserToDelete && (
        <Dialog open={!!selectedUserToDelete} onOpenChange={open => !open && setSelectedUserToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>Are you sure you want to delete this user? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="border rounded-md p-4 mb-4">
              <p className="font-medium">{selectedUserToDelete.name || "Anonymous"}</p>
              <p className="text-sm text-muted-foreground">{selectedUserToDelete.email}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUserToDelete(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(selectedUserToDelete.id);
                  setSelectedUserToDelete(null);
                }}
                disabled={loadingStates.submitting}
              >
                {loadingStates.submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userDialogMode === "create" ? "Create New User" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {userDialogMode === "create" ? "Add a new user to the system." : "Modify the selected user's details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={userFormData.name}
                onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            {userDialogMode === "create" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userFormData.email}
                    onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={userFormData.password}
                    onChange={e => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </>
            )}
            {userDialogMode === "edit" && (
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userFormData.email}
                  disabled
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={userFormData.role}
                onValueChange={value => setUserFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (userDialogMode === "create" && (!userFormData.email || !userFormData.password))}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : userDialogMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}