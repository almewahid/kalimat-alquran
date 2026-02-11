"use client";

import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Volume2,
  Trash2,
  Edit,
  Loader2,
  Search,
  Upload,
  FolderTree,
  PlusCircle,
  Copy,
  Play,
  Pause,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export default function ManageAudios() {
  const CLOUD_NAME = "dufjbywcm";
  const UPLOAD_PRESET = "kalimat-allah_uploads";

  const { toast } = useToast();
  const [audios, setAudios] = useState([]);
  const [filteredAudios, setFilteredAudios] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("الجميع");
  const [editingAudio, setEditingAudio] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [category, setCategory] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = React.useRef(new Audio());

  useEffect(() => {
    checkAdminAndLoadAll();
  }, []);

  useEffect(() => {
    filterAudios();
  }, [searchTerm, activeTab, audios]);

  const checkAdminAndLoadAll = async () => {
    try {
      const user = await supabaseClient.supabase.auth.getUser();
      setIsAdmin(user.role === "admin");

      if (user.role !== "admin") {
        setIsLoading(false);
        return;
      }

      await Promise.all([loadAudios(), loadCategories()]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAudios = async () => {
    const res = await supabaseClient.entities.audios.list("-created_date", 1000);
    setAudios(res);
  };

  const loadCategories = async () => {
    try {
      // ✅ جلب فئات الصوتيات فقط
      const res = await supabaseClient.entities.categories.list("-created_date", 1000);
      setCategories(res.filter(c => c.type === 'audio'));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const filterAudios = () => {
    let filtered = audios;

    if (activeTab !== "الجميع") {
      filtered = filtered.filter((audio) => audio.category === activeTab);
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (audio) =>
          audio.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          audio.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          audio.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          audio.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAudios(filtered);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setPreviewFiles(files);
  };

  const handleUpload = async () => {
    if (previewFiles.length === 0) {
      toast({ title: "⚠️ اختر ملفات صوتية أولاً" });
      return;
    }
    if (!category) {
      toast({ title: "⚠️ اختر فئة لوضع الملفات فيها" });
      return;
    }

    setUploading(true);

    try {
      for (const file of previewFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("folder", `kalimat/${category}/audios`);
        formData.append("resource_type", "auto");

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();

        if (data.secure_url) {
          await supabaseClient.entities.audios.create({
            url: data.secure_url,
            title: file.name,
            description: "",
            file_size: file.size,
            duration: data.duration || 0,
            category: category,
            folder_name: `kalimat/${category}/audios`,
          });
        }
      }

      toast({
        title: "✅ تم الرفع بنجاح",
        description: `تم رفع الملفات الصوتية إلى فئة "${category}"`,
        className: "bg-green-100 text-green-800",
      });

      setPreviewFiles([]);
      checkAdminAndLoadAll();
    } catch (error) {
      console.error("Error uploading:", error);
      toast({
        title: "❌ فشل الرفع",
        description: "حدث خطأ أثناء رفع الملفات",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (audio) => {
    setEditingAudio({ ...audio });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await supabaseClient.entities.audios.update(editingAudio.id, {
        title: editingAudio.title,
        description: editingAudio.description,
        category: editingAudio.category,
        folder_name: editingAudio.folder_name,
      });
      toast({ title: "✅ تم تحديث بيانات الملف الصوتي" });
      setShowEditDialog(false);
      checkAdminAndLoadAll();
    } catch (error) {
      console.error("Error updating:", error);
      toast({ title: "❌ فشل التحديث", variant: "destructive" });
    }
  };

  const handleDelete = async (audioId) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف الصوتي؟")) return;
    try {
      await supabaseClient.entities.audios.delete(audioId);
      toast({ title: "✅ تم حذف الملف الصوتي" });
      checkAdminAndLoadAll();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "❌ فشل الحذف", variant: "destructive" });
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: "✅ تم النسخ", description: "تم نسخ رابط الملف الصوتي" });
  };

  const handlePlayAudio = (audioUrl, audioId) => {
    if (playingAudio === audioId) {
      audioRef.current.pause();
      setPlayingAudio(null);
    } else {
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setPlayingAudio(audioId);
      
      audioRef.current.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({ title: "⚠️ أدخل اسم الفئة" });
      return;
    }
    try {
      await supabaseClient.entities.categories.create({
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        type: 'audio', // ✅ تحديد النوع كصوتيات
      });
      toast({ title: "✅ تمت إضافة الفئة بنجاح" });
      setNewCategory({ name: "", description: "" });
      loadCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      toast({ title: "❌ فشل إضافة الفئة", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("هل تريد حذف هذه الفئة؟")) return;
    try {
      await supabaseClient.entities.categories.delete(id);
      toast({ title: "✅ تم حذف الفئة" });
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({ title: "❌ فشل حذف الفئة", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading)
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );

  if (!isAdmin)
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">⛔ غير مصرح</h2>
            <p className="text-red-600">هذه الصفحة متاحة للمسؤولين فقط</p>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Volume2 className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة الملفات الصوتية والفئات</h1>
            <p className="text-foreground/70">
              رفع وتعديل وحذف الملفات الصوتية مع إدارة الفئات من قاعدة البيانات
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📁 رفع ملفات صوتية حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-1/3">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input type="file" multiple accept="audio/*" onChange={handleFileChange} />
            </div>

            {previewFiles.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewFiles.map((file, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <Volume2 className="w-8 h-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> جاري الرفع...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> رفع الملفات الصوتية
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-foreground/50" />
            <Input
              placeholder="ابحث في الملفات الصوتية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Badge variant="outline">{filteredAudios.length} ملف صوتي</Badge>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 mb-6">
            <TabsTrigger value="الجميع">الجميع</TabsTrigger>
            <TabsTrigger value="export">📥 تصدير الروابط</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.name}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="cloudinary-stats">
            <Card>
              <CardHeader>
                <CardTitle>📊 إحصائيات الصوتيات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-blue-600">{audios.length}</div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">إجمالي الملفات</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 dark:bg-purple-900/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-purple-600">
                        {(audios.reduce((sum, audio) => sum + (audio.file_size || 0), 0) / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <p className="text-sm text-purple-800 dark:text-purple-200 mt-2">حجم التخزين</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 dark:bg-green-900/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-green-600">{categories.length}</div>
                      <p className="text-sm text-green-800 dark:text-green-200 mt-2">عدد الفئات</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>📥 تصدير الروابط والبيانات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>اختر الفئة للتصدير</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Button 
                      onClick={async () => {
                        const dataToExport = category === "all" ? audios : audios.filter(a => a.category === category);
                        const csv = [
                          ["العنوان", "الفئة", "الرابط", "الحجم (KB)", "المدة (ثانية)"],
                          ...dataToExport.map(audio => [
                            audio.title || "بدون عنوان",
                            audio.category || "",
                            audio.url || "",
                            Math.round((audio.file_size || 0) / 1024),
                            audio.duration || ""
                          ])
                        ].map(row => row.join(",")).join("\n");

                        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `audios_export_${category}_${new Date().toISOString().split('T')[0]}.csv`;
                        link.click();

                        toast({ title: "✅ تم التصدير إلى CSV" });
                      }}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      تصدير CSV
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => {
                        const dataToExport = category === "all" ? audios : audios.filter(a => a.category === category);
                        const urls = dataToExport.map(a => a.url).join("\n");
                        navigator.clipboard.writeText(urls);
                        toast({ title: `✅ تم نسخ ${dataToExport.length} رابط` });
                      }}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      نسخ جميع الروابط
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 سيتم تصدير البيانات التالية: العنوان، الفئة، الرابط، الحجم، المدة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value={activeTab}>
            {filteredAudios.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Volume2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-foreground/70">لا توجد ملفات صوتية في هذه الفئة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAudios.map((audio) => (
                  <motion.div key={audio.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                        <Volume2 className="w-16 h-16 text-primary/40" />
                        <Button
                          onClick={() => handlePlayAudio(audio.url, audio.id)}
                          size="icon"
                          className="absolute bottom-4 right-4 rounded-full w-12 h-12 bg-primary hover:bg-primary/90"
                        >
                          {playingAudio === audio.id ? (
                            <Pause className="w-6 h-6" />
                          ) : (
                            <Play className="w-6 h-6" />
                          )}
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-lg truncate">
                            {audio.title || "بدون عنوان"}
                          </h3>
                          {audio.category && (
                            <Badge variant="secondary" className="text-xs">
                              <FolderTree className="w-3 h-3 mr-1 inline" /> {audio.category}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mb-3 text-xs text-foreground/60">
                          <span>📦 {formatFileSize(audio.file_size || 0)}</span>
                          <span>⏱️ {formatDuration(audio.duration)}</span>
                        </div>

                        {audio.description && (
                          <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
                            {audio.description}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          <Button onClick={() => copyToClipboard(audio.url)} size="sm" variant="outline" className="flex-1">
                            <Copy className="w-4 h-4 mr-1" />
                            نسخ
                          </Button>
                          <Button onClick={() => handleEdit(audio)} size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDelete(audio.id)} size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>🧩 إدارة الفئات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="اسم الفئة الجديدة"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
              <Input
                placeholder="وصف الفئة (اختياري)"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
              <Button onClick={handleAddCategory}>
                <PlusCircle className="w-4 h-4 mr-1" /> إضافة
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <Card key={cat.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat.description}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                    حذف
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل بيانات الملف الصوتي</DialogTitle>
            </DialogHeader>
            {editingAudio && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 p-6 rounded-lg flex items-center justify-center gap-4">
                  <Volume2 className="w-12 h-12 text-primary" />
                  <Button
                    onClick={() => handlePlayAudio(editingAudio.url, editingAudio.id)}
                    variant="outline"
                  >
                    {playingAudio === editingAudio.id ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" /> إيقاف
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" /> تشغيل
                      </>
                    )}
                  </Button>
                </div>

                <Input
                  value={editingAudio.title || ""}
                  onChange={(e) =>
                    setEditingAudio({ ...editingAudio, title: e.target.value })
                  }
                  placeholder="اسم الملف"
                />
                <Textarea
                  value={editingAudio.description || ""}
                  onChange={(e) =>
                    setEditingAudio({ ...editingAudio, description: e.target.value })
                  }
                  placeholder="وصف الملف"
                  rows={3}
                />
                <Input
                  value={editingAudio.folder_name || ""}
                  onChange={(e) =>
                    setEditingAudio({ ...editingAudio, folder_name: e.target.value })
                  }
                  placeholder="اسم المجلد"
                />
                <Select
                  value={editingAudio.category || ""}
                  onValueChange={(v) =>
                    setEditingAudio({ ...editingAudio, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveEdit}>
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}