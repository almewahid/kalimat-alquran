import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Search, Edit, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const NOTE_COLORS = [
  "bg-yellow-50 border-yellow-200",
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-pink-50 border-pink-200",
  "bg-purple-50 border-purple-200",
  "bg-orange-50 border-orange-200",
];

export default function ManageNotes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 12;

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [searchTerm, notes]);

  const loadNotes = async () => {
    try {
      const user = await supabaseClient.auth.me();
      const [userNotes, allWords] = await Promise.all([
        supabaseClient.entities.UserNote.filter({ user_email: user.email }),
        supabaseClient.entities.QuranicWord.list(),
      ]);
      // Sort newest first
      userNotes.sort((a, b) =>
        new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
      );
      setNotes(userNotes);
      setWords(allWords);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotes = () => {
    if (!searchTerm.trim()) {
      setFilteredNotes(notes);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredNotes(
        notes.filter((note) => {
          const word = words.find((w) => w.id === note.word_id);
          return (
            note.content?.toLowerCase().includes(term) ||
            word?.word?.toLowerCase().includes(term) ||
            word?.meaning?.toLowerCase().includes(term)
          );
        })
      );
    }
    setCurrentPage(1);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setEditContent(note.content);
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editContent.trim()) {
      toast({ title: "⚠️ الملاحظة فارغة!", variant: "destructive" });
      return;
    }
    try {
      await supabaseClient.entities.UserNote.update(editingNote.id, { content: editContent });
      toast({ title: "✅ تم الحفظ!" });
      setShowEditDialog(false);
      loadNotes();
    } catch {
      toast({ title: "❌ حدث خطأ", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await supabaseClient.entities.UserNote.delete(id);
      toast({ title: "🗑️ تم الحذف" });
      setConfirmDeleteId(null);
      loadNotes();
    } catch {
      toast({ title: "❌ حدث خطأ", variant: "destructive" });
    }
  };

  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * notesPerPage,
    currentPage * notesPerPage
  );
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-6xl"
        >
          📝
        </motion.div>
        <p className="text-lg font-semibold text-muted-foreground">جاري تحميل ملاحظاتك...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">📝 ملاحظاتي</h1>
          <p className="text-sm text-muted-foreground">
            {notes.length > 0
              ? `عندك ${notes.length} ملاحظة محفوظة ✨`
              : "لا توجد ملاحظات بعد"}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="🔍 ابحث في ملاحظاتك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-12 rounded-2xl h-12 text-base border-2 focus:border-primary"
          />
        </div>

        {/* Empty State */}
        {paginatedNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 flex flex-col items-center gap-4"
          >
            <span className="text-8xl">📋</span>
            <p className="text-xl font-bold text-foreground/70">
              {searchTerm ? "ما وجدنا نتائج 🔍" : "لا توجد ملاحظات بعد!"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "جرب كلمة أخرى" : "تعلّم كلمات وأضف ملاحظاتك عليها"}
            </p>
            {!searchTerm && (
              <Link to={createPageUrl("SmartReview")}>
                <Button className="rounded-2xl text-base font-bold px-6 py-3 mt-2 gap-2">
                  ابدأ التعلّم 🚀
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <AnimatePresence>
                {paginatedNotes.map((note, index) => {
                  const word = words.find((w) => w.id === note.word_id);
                  const colorClass = NOTE_COLORS[index % NOTE_COLORS.length];
                  const isConfirmingDelete = confirmDeleteId === note.id;

                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                    >
                      <Card className={`border-2 rounded-2xl transition-all hover:shadow-md ${colorClass}`}>
                        <CardContent className="p-4">
                          {/* Word */}
                          <div className="mb-3">
                            <p className="text-xl font-bold text-foreground">
                              {word?.word || "كلمة محذوفة"}
                            </p>
                            {word?.meaning && (
                              <p className="text-sm text-muted-foreground mt-0.5">{word.meaning}</p>
                            )}
                          </div>

                          {/* Note Content */}
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed mb-4 min-h-[40px]">
                            {note.content}
                          </p>

                          {/* Actions */}
                          {isConfirmingDelete ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1 rounded-xl font-bold"
                                onClick={() => handleDelete(note.id)}
                              >
                                نعم، احذف
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                لا، ارجع
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEdit(note)}
                                className="flex-1 rounded-xl font-bold gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                تعديل
                              </Button>
                              <button
                                onClick={() => setConfirmDeleteId(note.id)}
                                className="w-10 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-400 transition-colors border border-transparent hover:border-red-200"
                                aria-label="حذف الملاحظة"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  className="rounded-2xl px-5 gap-2 font-bold"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </Button>
                <span className="text-sm font-semibold text-muted-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="rounded-2xl px-5 gap-2 font-bold"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                ✏️ عدّل ملاحظتك
              </DialogTitle>
            </DialogHeader>
            <div className="py-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                placeholder="اكتب ملاحظتك هنا..."
                className="rounded-xl text-base resize-none border-2 focus:border-primary"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setShowEditDialog(false)}
              >
                إلغاء
              </Button>
              <Button className="rounded-xl font-bold gap-2" onClick={handleSave}>
                💾 احفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </div>
  );
}
