import NoteForm from "@/components/NoteForm"
import NoteList from "@/components/NoteList"

export default async function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">My Notes</h1>
      <NoteForm />
      <NoteList />
    </main>
  )
}