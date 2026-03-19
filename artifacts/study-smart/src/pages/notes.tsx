import { useState } from "react";
import { Layout } from "@/components/layout";
import { useSubjectsData, useCreateSubjectAction, useDeleteSubjectAction } from "@/hooks/use-subjects";
import { useNotesData, useCreateNoteAction, useUpdateNoteAction, useDeleteNoteAction } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, FolderPlus, Plus, Search, Trash2, Edit3, MoreVertical, Sparkles, Folder, AlertCircle } from "lucide-react";
import { QuizModal } from "@/components/quiz-modal";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const SUBJECT_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F43F5E', '#EAB308'];

export default function NotesPage() {
  const { toast } = useToast();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjectsData();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const { data: notes = [], isLoading: loadingNotes } = useNotesData(selectedSubjectId ?? undefined);

  const createSubMut = useCreateSubjectAction();
  const delSubMut = useDeleteSubjectAction();
  const createNoteMut = useCreateNoteAction();
  const updateNoteMut = useUpdateNoteAction();
  const delNoteMut = useDeleteNoteAction();

  const [newSubOpen, setNewSubOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubColor, setNewSubColor] = useState(SUBJECT_COLORS[0]);

  const [noteOpen, setNoteOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubjectId, setNoteSubjectId] = useState<string>("");

  const [quizNoteId, setQuizNoteId] = useState<number | null>(null);
  const [quizSubjectName, setQuizSubjectName] = useState<string>("");
  const [search, setSearch] = useState("");

  const handleCreateSubject = async () => {
    if (!newSubName.trim()) return;
    try {
      await createSubMut.mutateAsync({ data: { name: newSubName, color: newSubColor, icon: "📚" } });
      setNewSubOpen(false);
      setNewSubName("");
      toast({ title: "Subject created!" });
    } catch {
      toast({ title: "Failed to create subject", variant: "destructive" });
    }
  };

  const openNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteSubjectId(selectedSubjectId ? String(selectedSubjectId) : (subjects[0] ? String(subjects[0].id) : ""));
    setNoteOpen(true);
  };

  const openEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteSubjectId(String(note.subjectId));
    setNoteOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      toast({ title: "Note title is required", variant: "destructive" });
      return;
    }
    if (!noteSubjectId) {
      toast({ title: "Please select a subject", variant: "destructive" });
      return;
    }
    try {
      if (editingNoteId) {
        await updateNoteMut.mutateAsync({ id: editingNoteId, data: { title: noteTitle, content: noteContent, subjectId: Number(noteSubjectId) } });
        toast({ title: "Note updated!" });
      } else {
        await createNoteMut.mutateAsync({ data: { title: noteTitle, content: noteContent, subjectId: Number(noteSubjectId) } });
        toast({ title: "Note created!" });
      }
      setNoteOpen(false);
    } catch {
      toast({ title: "Failed to save note", variant: "destructive" });
    }
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout
      title="Notes & Subjects"
      actions={
        <Button onClick={openNewNote} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> New Note
        </Button>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">

        {/* Subjects Sidebar */}
        <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-lg">Subjects</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setNewSubOpen(true)}>
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {subjects.length === 0 && !loadingSubjects && (
              <div className="text-center py-6 px-4">
                <Folder className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Create a subject folder to get started</p>
                <Button size="sm" className="rounded-xl w-full" onClick={() => setNewSubOpen(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" /> Create Subject
                </Button>
              </div>
            )}

            {subjects.length > 0 && (
              <button
                onClick={() => setSelectedSubjectId(null)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left
                  ${selectedSubjectId === null ? "bg-card shadow-sm border border-border font-medium" : "hover:bg-muted/50 text-muted-foreground border border-transparent"}`}
              >
                <BookOpen className="w-5 h-5 text-primary" />
                <span>All Notes</span>
                <span className="ml-auto text-xs text-muted-foreground">{notes.length || ""}</span>
              </button>
            )}

            {subjects.map((sub) => (
              <div key={sub.id} className="relative group">
                <button
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left
                    ${selectedSubjectId === sub.id ? "bg-card shadow-sm border border-border font-medium" : "hover:bg-muted/50 text-muted-foreground border border-transparent"}`}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                  <span className="flex-1 truncate">{sub.name}</span>
                </button>
                <button
                  onClick={() => delSubMut.mutate({ id: sub.id })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Area */}
        <div className="flex-1 bg-card rounded-3xl border border-border/50 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-4 bg-muted/20">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="pl-9 bg-background border-border/50 rounded-xl"
              />
            </div>
            {selectedSubjectId && (
              <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full shrink-0">
                {subjects.find(s => s.id === selectedSubjectId)?.name}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {subjects.length === 0 && !loadingSubjects ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Folder className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Start by creating a subject</h3>
                <p className="text-muted-foreground max-w-sm mb-6">Create a subject folder (like "Mathematics" or "Biology") to organise your notes.</p>
                <Button onClick={() => setNewSubOpen(true)} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                  <FolderPlus className="w-4 h-4 mr-2" /> Create First Subject
                </Button>
              </div>
            ) : loadingNotes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-52 bg-muted animate-pulse rounded-2xl" />)}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No notes yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {selectedSubjectId
                    ? "Add your first note to this subject. The more detail you write, the better AI quizzes you'll get!"
                    : "Select a subject or create your first note."}
                </p>
                <Button onClick={openNewNote} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" /> Create Note
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                <AnimatePresence>
                  {filteredNotes.map((note) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      key={note.id}
                      className="bg-background rounded-2xl border border-border/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
                    >
                      {/* Subject color bar */}
                      <div
                        className="h-1.5 w-full"
                        style={{ backgroundColor: subjects.find(s => s.id === note.subjectId)?.color ?? "#6366f1" }}
                      />

                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            {!selectedSubjectId && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                                {subjects.find(s => s.id === note.subjectId)?.name ?? "Unknown"}
                              </span>
                            )}
                            <h4 className="font-bold text-base leading-snug truncate">{note.title}</h4>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 text-muted-foreground">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => openEditNote(note)} className="gap-2 cursor-pointer">
                                <Edit3 className="w-4 h-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => delNoteMut.mutate({ id: note.id })}
                                className="text-destructive gap-2 cursor-pointer focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1 mb-4">
                          {note.content || <span className="italic opacity-60">No content yet</span>}
                        </p>

                        {/* Generate Quiz Button - clearly visible */}
                        <Button
                          className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-md shadow-primary/20 font-semibold"
                          onClick={() => { setQuizNoteId(note.id); setQuizSubjectName(subjects.find(s => s.id === note.subjectId)?.name ?? ""); }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Quiz
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Subject Dialog */}
      <Dialog open={newSubOpen} onOpenChange={setNewSubOpen}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Subject Name</label>
              <Input
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateSubject()}
                placeholder="e.g. Mathematics, Biology, History…"
                className="rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Colour</label>
              <div className="flex gap-2">
                {SUBJECT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewSubColor(c)}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${newSubColor === c ? "border-foreground scale-110 shadow-lg" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreateSubject} className="w-full rounded-xl" disabled={createSubMut.isPending || !newSubName.trim()}>
              {createSubMut.isPending ? "Creating…" : "Create Subject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Editor Dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-2xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-purple-500 to-accent w-full" />
          <div className="p-6 md:p-8 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingNoteId ? "Edit Note" : "New Note"}</DialogTitle>
            </DialogHeader>

            {/* Subject selector — always shown */}
            {subjects.length === 0 ? (
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">No subjects yet</p>
                  <p>Create a subject folder first, then come back to add notes.</p>
                  <Button
                    size="sm"
                    className="mt-2 rounded-lg"
                    onClick={() => { setNoteOpen(false); setNewSubOpen(true); }}
                  >
                    Create Subject
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Subject</label>
                <Select value={noteSubjectId} onValueChange={setNoteSubjectId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a subject…" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Title</label>
              <Input
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                placeholder="Note title"
                className="rounded-xl text-base font-semibold"
                autoFocus={subjects.length > 0}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">
                Content
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  — The more detail you write, the better your AI quiz will be!
                </span>
              </label>
              <textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Write your study notes here. Include key concepts, definitions, examples and explanations…"
                className="w-full h-56 p-4 bg-muted/30 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 border border-border/50 text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setNoteOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={handleSaveNote}
                disabled={updateNoteMut.isPending || createNoteMut.isPending || subjects.length === 0}
                className="rounded-xl px-8 shadow-lg shadow-primary/20"
              >
                {updateNoteMut.isPending || createNoteMut.isPending ? "Saving…" : "Save Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal */}
      {quizNoteId != null && (
        <QuizModal noteId={quizNoteId} subjectName={quizSubjectName} open={true} onOpenChange={(open) => { if (!open) setQuizNoteId(null); }} />
      )}
    </Layout>
  );
}
