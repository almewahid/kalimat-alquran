import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { StickyNote, Search, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManageNotes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 20;
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [searchTerm, sortOrder, notes]);

  const loadNotes = async () => {
    try {
      const user = await supabaseClient.auth.me();
      const [userNotes, allWords] = await Promise.all([
        supabaseClient.entities.UserNote.filter({ user_email: user.email }),
        supabaseClient.entities.QuranicWord.list()
      ]);
      
      setNotes(userNotes);
      setWords(allWords);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(note => {
        const word = words.find(w => w.id === note.word_id);
        return (
          note.content?.toLowerCase().includes(term) ||
          word?.word?.toLowerCase().includes(term) ||
          word?.meaning?.toLowerCase().includes(term)
        );
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_date || a.updated_date);
      const dateB = new Date(b.created_date || b.updated_date);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredNotes(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setEditContent(note.content);
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editContent.trim()) {
      toast({ title: "⚠️ المحتوى فارغ", variant: "destructive" });
      return;
    }

    try {
      await supabaseClient.entities.UserNote.update(editingNote.id, { content: editContent });
      toast({ title: "✅ تم التحديث" });
      setShowEditDialog(false);
      loadNotes();
    } catch (error) {
      toast({ title: "❌ فشل التحديث", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذه الملاحظة؟")) return;
    
    try {
      await supabaseClient.entities.UserNote.delete(id);
      toast({ title: "✅ تم الحذف" });
      loadNotes();
    } catch (error) {
      toast({ title: "❌ فشل الحذف", variant: "destructive" });
    }
  };

  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * notesPerPage,
    currentPage * notesPerPage
  );

  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <StickyNote className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">ملاحظاتي</h1>
            <p className="text-foreground/70">إدارة جميع الملاحظات الشخصية</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <Input
                    placeholder="ابحث في الملاحظات أو الكلمات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="الترتيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث أولاً</SelectItem>
                  <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-3">
              <Badge variant="outline">{filteredNotes.length} ملاحظة</Badge>
            </div>
          </CardContent>
        </Card>

        {paginatedNotes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-foreground/70">لا توجد ملاحظات</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {paginatedNotes.map((note) => {
                const word = words.find(w => w.id === note.word_id);
                return (
                  <motion.div key={note.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{word?.word || "كلمة محذوفة"}</CardTitle>
                            <p className="text-sm text-foreground/70">{word?.meaning || ""}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {new Date(note.updated_date || note.created_date).toLocaleDateString('ar-SA')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-foreground/80 whitespace-pre-wrap">{note.content}</p>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(note)} className="flex-1">
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(note.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <span className="text-sm px-4">
                  صفحة {currentPage} من {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الملاحظة</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                placeholder="اكتب ملاحظتك..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>إلغاء</Button>
              <Button onClick={handleSave}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}