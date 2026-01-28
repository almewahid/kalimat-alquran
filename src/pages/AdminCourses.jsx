import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Edit, Trash2, BookOpen, Award, Eye, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminCourses() {
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [availableWords, setAvailableWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [surahList, setSuraList] = useState([]);
  const [selectedSurahToAdd, setSelectedSurahToAdd] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "beginner",
    image_url: "",
    is_active: true,
    enable_certificate: true,
    certificate_config: {
      title: "شهادة إتمام",
      body: "تشهد إدارة التطبيق بأن الطالب/ة قد أتم الدورة بنجاح",
      signature: "إدارة كلمات القرآن",
      template_style: "classic"
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesData, wordsData] = await Promise.all([
        base44.entities.Course.list("-created_date"),
        base44.entities.QuranicWord.list("-created_date", 2000)
      ]);
      setCourses(coursesData);
      setAvailableWords(wordsData);
      
      // Extract unique surahs
      const surahs = [...new Set(wordsData.map(w => w.surah_name))].filter(Boolean).sort();
      setSuraList(surahs);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "❌ خطأ في تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (course = null) => {
    if (course) {
      setCurrentCourse(course);
      setFormData({
        title: course.title,
        description: course.description,
        level: course.level || "beginner",
        image_url: course.image_url || "",
        is_active: course.is_active,
        enable_certificate: course.enable_certificate,
        certificate_config: course.certificate_config || {
          title: "شهادة إتمام",
          body: "تشهد إدارة التطبيق بأن الطالب/ة قد أتم الدورة بنجاح",
          signature: "إدارة كلمات القرآن",
          template_style: "classic"
        }
      });
      setSelectedWords(course.words_ids || []);
    } else {
      setCurrentCourse(null);
      setFormData({
        title: "",
        description: "",
        level: "beginner",
        image_url: "",
        is_active: true,
        enable_certificate: true,
        certificate_config: {
          title: "شهادة إتمام",
          body: "تشهد إدارة التطبيق بأن الطالب/ة قد أتم الدورة بنجاح",
          signature: "إدارة كلمات القرآن",
          template_style: "classic"
        }
      });
      setSelectedWords([]);
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({ title: "⚠️ يرجى إدخال عنوان الدورة" });
      return;
    }

    try {
      const payload = {
        ...formData,
        words_ids: selectedWords
      };

      if (currentCourse) {
        await base44.entities.Course.update(currentCourse.id, payload);
        toast({ title: "✅ تم تحديث الدورة" });
      } else {
        await base44.entities.Course.create(payload);
        toast({ title: "✅ تم إنشاء الدورة" });
      }
      setShowDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error saving course:", error);
      toast({ title: "❌ خطأ في الحفظ", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الدورة؟")) return;
    try {
      await base44.entities.Course.delete(id);
      toast({ title: "✅ تم الحذف" });
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "❌ خطأ في الحذف", variant: "destructive" });
    }
  };

  const toggleWordSelection = (wordId) => {
    setSelectedWords(prev => 
      prev.includes(wordId) 
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedWords);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedWords(items);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          إدارة الدورات التعليمية
        </h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 ml-2" /> دورة جديدة
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gray-100 relative">
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <BookOpen className="w-12 h-12 opacity-50" />
                  </div>
                )}
                {!course.is_active && (
                  <Badge variant="destructive" className="absolute top-2 right-2">غير نشطة</Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="truncate">{course.title}</span>
                  <Badge variant="outline">{course.level}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{course.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.words_ids?.length || 0} كلمة</span>
                  {course.enable_certificate && <span className="flex items-center gap-1 text-green-600"><Award className="w-3 h-3" /> شهادة</span>}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleOpenDialog(course)}>
                  <Edit className="w-4 h-4 ml-2" /> تعديل
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(course.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentCourse ? "تعديل الدورة" : "إنشاء دورة جديدة"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">عنوان الدورة</label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثال: دورة جزء عم للمبتدئين" />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">الوصف</label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="وصف محتوى الدورة وأهدافها" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">المستوى</label>
                  <Select value={formData.level} onValueChange={v => setFormData({...formData, level: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">مبتدئ</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="advanced">متقدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">رابط الصورة (اختياري)</label>
                  <div className="flex gap-2">
                    <Input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
                    {formData.image_url && <img src={formData.image_url} alt="preview" className="w-10 h-10 rounded object-cover" />}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={c => setFormData({...formData, is_active: c})} />
                  <label className="text-sm font-medium">تفعيل الدورة</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.enable_certificate} onCheckedChange={c => setFormData({...formData, enable_certificate: c})} />
                  <label className="text-sm font-medium">إصدار شهادات</label>
                </div>
              </div>

              {formData.enable_certificate && (
                <div className="border p-4 rounded-lg bg-gray-50 space-y-3">
                  <h3 className="font-bold flex items-center gap-2"><Award className="w-4 h-4" /> إعدادات الشهادة</h3>
                  <Input 
                    value={formData.certificate_config.title} 
                    onChange={e => setFormData({...formData, certificate_config: {...formData.certificate_config, title: e.target.value}})} 
                    placeholder="عنوان الشهادة" 
                  />
                  <Textarea 
                    value={formData.certificate_config.body} 
                    onChange={e => setFormData({...formData, certificate_config: {...formData.certificate_config, body: e.target.value}})} 
                    placeholder="نص الشهادة" 
                  />
                  <Input 
                    value={formData.certificate_config.signature} 
                    onChange={e => setFormData({...formData, certificate_config: {...formData.certificate_config, signature: e.target.value}})} 
                    placeholder="التوقيع" 
                  />
                  <Select 
                    value={formData.certificate_config.template_style} 
                    onValueChange={v => setFormData({...formData, certificate_config: {...formData.certificate_config, template_style: v}})}
                  >
                    <SelectTrigger><SelectValue placeholder="نمط التصميم" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">كلاسيكي</SelectItem>
                      <SelectItem value="modern">عصري</SelectItem>
                      <SelectItem value="islamic">زخرفة إسلامية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* زر معاينة الشهادة */}
              {formData.enable_certificate && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                        // فتح صفحة الشهادة في وضع المعاينة
                        const url = `/CertificateView?preview=true&courseId=${currentCourse?.id || ''}`;
                        window.open(url, '_blank');
                    }}
                  >
                    <Eye className="w-4 h-4 ml-2" /> معاينة شكل الشهادة
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium mb-1 block">ترتيب الكلمات المختارة (اسحب لإعادة الترتيب)</label>
              {selectedWords.length > 0 ? (
                <div className="border rounded-lg h-[200px] overflow-y-auto p-2 bg-gray-50 mb-4">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="selected-words-list">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {selectedWords.map((wordId, index) => {
                            const word = availableWords.find(w => w.id === wordId);
                            if (!word) return null;
                            return (
                              <Draggable key={wordId} draggableId={wordId} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="p-2 bg-white border rounded shadow-sm flex items-center gap-2"
                                  >
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                    <span className="flex-1">{word.word} <span className="text-xs text-gray-500">({word.surah_name})</span></span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => toggleWordSelection(wordId)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              ) : <div className="text-sm text-gray-500 text-center border p-4 rounded bg-gray-50">لم يتم اختيار كلمات بعد</div>}

              <label className="text-sm font-medium mb-1 block">إضافة كلمات</label>
              
              {/* Add Full Surah Feature */}
              <div className="flex gap-2 mb-2">
                <Select value={selectedSurahToAdd} onValueChange={setSelectedSurahToAdd}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="إضافة سورة كاملة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {surahList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  onClick={() => {
                    if (!selectedSurahToAdd) return;
                    const wordsToAdd = availableWords
                      .filter(w => w.surah_name === selectedSurahToAdd && !selectedWords.includes(w.id))
                      .map(w => w.id);
                    
                    if (wordsToAdd.length === 0) {
                      toast({ title: "جميع كلمات هذه السورة مضافة بالفعل" });
                      return;
                    }
                    
                    setSelectedWords(prev => [...prev, ...wordsToAdd]);
                    toast({ title: `تم إضافة ${wordsToAdd.length} كلمة من سورة ${selectedSurahToAdd}` });
                    setSelectedSurahToAdd("");
                  }}
                  variant="secondary"
                >
                  <Plus className="w-4 h-4 mr-1" /> إضافة الكل
                </Button>
              </div>

              <div className="border rounded-lg h-[300px] overflow-y-auto p-2 space-y-1 bg-white">
                {availableWords.filter(w => !selectedWords.includes(w.id)).map(word => (
                  <div 
                    key={word.id} 
                    onClick={() => toggleWordSelection(word.id)}
                    className="p-2 rounded cursor-pointer text-sm flex justify-between items-center hover:bg-gray-100"
                  >
                    <span>{word.word} - <span className="text-gray-500">{word.surah_name}</span></span>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}