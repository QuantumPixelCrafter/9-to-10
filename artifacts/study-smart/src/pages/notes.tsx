import { useState } from "react";
import { Layout } from "@/components/layout";
import { useSubjectsData, useCreateSubjectAction, useDeleteSubjectAction } from "@/hooks/use-subjects";
import { useNotesData, useCreateNoteAction, useUpdateNoteAction, useDeleteNoteAction } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, FolderPlus, Plus, Search, Trash2, Edit3, MoreVertical, Sparkles, Folder } from "lucide-react";
import { QuizModal } from "@/components/quiz-modal";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function NotesPage() {
  const { toast } = useToast();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjectsData();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  
  const { data: notes = [], isLoading: loadingNotes } = useNotesData(selectedSubjectId || undefined);
  
  const createSubMut = useCreateSubjectAction();
  const delSubMut = useDeleteSubjectAction();
  const createNoteMut = useCreateNoteAction();
  const updateNoteMut = useUpdateNoteAction();
  const delNoteMut = useDeleteNoteAction();

  // Dialog states
  const [newSubOpen, setNewSubOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubColor, setNewSubColor] = useState("#F97316");

  const [noteOpen, setNoteOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [quizNoteId, setQuizNoteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const handleCreateSubject = async () => {
    if (!newSubName.trim()) return;
    try {
      await createSubMut.mutateAsync({ data: { name: newSubName, color: newSubColor, icon: 'folder' }});
      setNewSubOpen(false);
      setNewSubName("");
      toast({ title: "Subject created successfully!" });
    } catch(e) {
      toast({ title: "Failed to create subject", variant: "destructive" });
    }
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !selectedSubjectId) {
      toast({ title: "Title and subject required", variant: "destructive" });
      return;
    }
    
    try {
      if (editingNoteId) {
        await updateNoteMut.mutateAsync({ id: editingNoteId, data: { title: noteTitle, content: noteContent }});
        toast({ title: "Note updated!" });
      } else {
        await createNoteMut.mutateAsync({ data: { title: noteTitle, content: noteContent, subjectId: selectedSubjectId }});
        toast({ title: "Note created!" });
      }
      setNoteOpen(false);
    } catch(e) {
      toast({ title: "Failed to save note", variant: "destructive" });
    }
  };

  const openEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteOpen(true);
  };

  const openNewNote = () => {
    if (!selectedSubjectId) {
      toast({ title: "Select a subject first", variant: "destructive" });
      return;
    }
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteOpen(true);
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout 
      title="Notes & Subjects" 
      actions={
        <Button onClick={openNewNote} disabled={!selectedSubjectId} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> New Note
        </Button>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
        
        {/* Subjects Sidebar */}
        <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-lg">Subjects</h3>
            <Dialog open={newSubOpen} onOpenChange={setNewSubOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><FolderPlus className="w-4 h-4" /></Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">Create Subject</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Subject Name</label>
                    <Input value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="e.g. Mathematics" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Color</label>
                    <div className="flex gap-2">
                      {['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F43F5E'].map(c => (
                        <button 
                          key={c} onClick={() => setNewSubColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${newSubColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreateSubject} className="w-full rounded-xl mt-2" disabled={createSubMut.isPending}>
                    {createSubMut.isPending ? "Creating..." : "Create Subject"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
                ${selectedSubjectId === null ? 'bg-card shadow-sm border border-border font-medium' : 'hover:bg-muted/50 text-muted-foreground border border-transparent'}
              `}
            >
              <BookOpen className="w-5 h-5 text-primary" />
              <span>All Notes</span>
            </button>
            
            {subjects.map((sub) => (
              <div key={sub.id} className="relative group">
                <button
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
                    ${selectedSubjectId === sub.id ? 'bg-card shadow-sm border border-border font-medium' : 'hover:bg-muted/50 text-muted-foreground border border-transparent'}
                  `}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                  <span className="flex-1 truncate">{sub.name}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); delSubMut.mutateAsync({ id: sub.id }); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Area */}
        <div className="flex-1 bg-card rounded-3xl border border-border/50 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center gap-4 justify-between bg-muted/20">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search notes..." 
                className="pl-9 bg-background border-border/50 rounded-xl w-full focus-visible:ring-primary/20"
              />
            </div>
            {selectedSubjectId && (
              <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full shrink-0">
                {subjects.find(s => s.id === selectedSubjectId)?.name}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gradient-to-b from-transparent to-muted/10">
            {loadingNotes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <img src={`${import.meta.env.BASE_URL}images/empty-state-notes.png`} alt="Empty Notes" className="w-48 h-48 mb-6 drop-shadow-xl" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">No notes here yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">Create your first note in this subject to start organizing your knowledge.</p>
                <Button onClick={openNewNote} disabled={!selectedSubjectId} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                  Create Note
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-max">
                <AnimatePresence>
                  {filteredNotes.map((note, i) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={note.id}
                      className="bg-background rounded-2xl p-5 border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-56 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="flex-1 min-w-0 pr-2">
                          {!selectedSubjectId && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                              {subjects.find(s => s.id === note.subjectId)?.name || 'Unknown'}
                            </span>
                          )}
                          <h4 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">{note.title}</h4>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:bg-muted shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => openEditNote(note)} className="gap-2 cursor-pointer"><Edit3 className="w-4 h-4"/> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => delNoteMut.mutate({ id: note.id })} className="text-destructive gap-2 cursor-pointer focus:text-destructive"><Trash2 className="w-4 h-4"/> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex-1 overflow-hidden relative z-10">
                        <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{note.content}</p>
                        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background to-transparent" />
                      </div>

                      <div className="pt-4 mt-auto border-t border-border/50 relative z-10">
                        <Button 
                          variant="secondary" 
                          className="w-full rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/10 text-primary group-hover:shadow-md transition-all"
                          onClick={(e) => { e.stopPropagation(); setQuizNoteId(note.id); }}
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

      {/* Note Editor Dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-2xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-card">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent w-full" />
          <div className="p-6 md:p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">{editingNoteId ? "Edit Note" : "New Note"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input 
                value={noteTitle} onChange={e => setNoteTitle(e.target.value)} 
                placeholder="Note Title" 
                className="text-xl font-bold border-0 border-b-2 border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
              />
              <textarea 
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
                placeholder="Start typing your study notes here... Provide plenty of detail so the AI can generate great quiz questions!"
                className="w-full h-[40vh] p-4 bg-muted/30 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border/50 text-base leading-relaxed custom-scrollbar"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setNoteOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSaveNote} disabled={updateNoteMut.isPending || createNoteMut.isPending} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                {updateNoteMut.isPending || createNoteMut.isPending ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal */}
      {quizNoteId && <QuizModal noteId={quizNoteId} open={!!quizNoteId} onOpenChange={(open) => !open && setQuizNoteId(null)} />}
    </Layout>
  );
}
