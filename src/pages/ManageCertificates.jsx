import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, Link } from "react-router-dom";
import { Loader2, Award, Search, Clock, Eye, Trash2, Edit, BookOpen, Plus, GripVertical } from "lucide-react";

export default function ManageCertificates() {
  const { toast } = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTabFromUrl = searchParams.get("tab") || "issued";
  
  const [certificates, setCertificates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [availableWords, setAvailableWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [surahList, setSurahList] = useState([]);
  const [selectedSurahToAdd, setSelectedSurahToAdd] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
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

  const [templateForm, setTemplateForm] = useState({
    title: "شهادة إتمام",
    body: "تشهد إدارة التطبيق بأن الطالب/ة قد أتم الدورة بنجاح",
    signature: "إدارة كلمات القرآن",
    style: "classic",
    borderColor: "#000000",
    textColor: "#000000",
    backgroundImage: "",
    logoUrl: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [certsData, coursesData, wordsData] = await Promise.all([
        base44.entities.Certificate.list("-issue_date", 1000),
        base44.entities.Course.list(),
        base44.entities.QuranicWord.list("-created_date", 2000)
      ]);
      setCertificates(certsData);
      setCourses(coursesData);
      setAvailableWords(wordsData);
      
      const surahs = [...new Set(wordsData.map(w => w.surah_name))].filter(Boolean).sort();
      setSurahList(surahs);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "❌ خطأ في تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = cert.status || 'issued'; 
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشهادة؟")) return;
    try {
      await base44.entities.Certificate.delete(id);
      setCertificates(prev => prev.filter(c => c.id !== id));
      toast({ title: "✅ تم الحذف" });
    } catch (error) {
      toast({ title: "❌ خطأ في الحذف", variant: "destructive" });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      const course = courses.find(c => c.id === editingTemplate);
      if (!course) return;

      await base44.entities.Course.update(course.id, {
        certificate_config: {
          title: templateForm.title,
          body: templateForm.body,
          signature: templateForm.signature,
          template_style: templateForm.style,
          borderColor: templateForm.borderColor,
          textColor: templateForm.textColor,
          backgroundImage: templateForm.backgroundImage,
          logoUrl: templateForm.logoUrl
        }
      });

      toast({ title: "✅ تم تحديث قالب الشهادة للدورة" });
      setShowTemplateDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error updating template:", error);
      toast({ title: "❌ خطأ في التحديث", variant: "destructive" });
    }
  };

  const openTemplateDialog = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setEditingTemplate(courseId);
      setTemplateForm({
        title: course.certificate_config?.title || "شهادة إتمام",
        body: course.certificate_config?.body || "تشهد إدارة التطبيق بأن الطالب/ة قد أتم الدورة بنجاح",
        signature: course.certificate_config?.signature || "إدارة كلمات القرآن",
        style: course.certificate_config?.template_style || "classic",
        borderColor: course.certificate_config?.borderColor || "#000000",
        textColor: course.certificate_config?.textColor || "#000000",
        backgroundImage: course.certificate_config?.backgroundImage || "",
        logoUrl: course.certificate_config?.logoUrl || ""
      });
      setShowTemplateDialog(true);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="w-8 h-8 text-primary" />
            الدورات والشهادات
          </h1>
          <p className="text-muted-foreground">إدارة الدورات التعليمية والشهادات الصادرة</p>
        </div>
      </div>

      <Tabs defaultValue={activeTabFromUrl} className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="issued">الشهادات الصادرة</TabsTrigger>
          <TabsTrigger value="courses">إدارة الدورات</TabsTrigger>
          <TabsTrigger value="templates">قوالب الشهادات</TabsTrigger>
        </TabsList>

        <TabsContent value="issued" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث باسم الطالب، البريد، أو الكود..." 
                    className="pr-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="issued">صادرة</SelectItem>
                    <SelectItem value="pending">قيد المعالجة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCertificates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  لا توجد شهادات مطابقة للبحث
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-right border-b">
                        <th className="p-4 font-medium">الطالب</th>
                        <th className="p-4 font-medium">الدورة</th>
                        <th className="p-4 font-medium">تاريخ الإصدار</th>
                        <th className="p-4 font-medium">كود الشهادة</th>
                        <th className="p-4 font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCertificates.map((cert) => (
                        <tr key={cert.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{cert.user_name}</div>
                            <div className="text-xs text-muted-foreground">{cert.user_email}</div>
                          </td>
                          <td className="p-4">{cert.course_title}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {new Date(cert.issue_date).toLocaleDateString('ar-SA')}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs">{cert.code}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" asChild title="عرض">
                                <Link to={`/CertificateView?id=${cert.id}`} target="_blank">
                                  <Eye className="w-4 h-4 text-blue-600" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(cert.id)} title="حذف">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/10">
              <p className="text-xs text-muted-foreground">إجمالي الشهادات: {filteredCertificates.length}</p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">الدورات التعليمية</h2>
            <Button onClick={() => {
              setCourseFormData({
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
              setEditingCourse(null);
              setShowCourseDialog(true);
            }}>
              <Plus className="w-4 h-4 ml-2" /> دورة جديدة
            </Button>
          </div>

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
                  <CardTitle className="flex justify-between items-start text-base">
                    <span className="truncate">{course.title}</span>
                    <Badge variant="outline">{course.level}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.words_ids?.length || 0} كلمة</span>
                    {course.enable_certificate && <span className="flex items-center gap-1 text-green-600"><Award className="w-3 h-3" /> شهادة</span>}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setEditingCourse(course);
                    setCourseFormData({
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
                    setShowCourseDialog(true);
                  }}>
                    <Edit className="w-4 h-4 ml-2" /> تعديل
                  </Button>
                  <Button variant="destructive" size="icon" onClick={async () => {
                    if (!confirm("هل أنت متأكد من حذف هذه الدورة؟")) return;
                    try {
                      await base44.entities.Course.delete(course.id);
                      toast({ title: "✅ تم الحذف" });
                      fetchData();
                    } catch (error) {
                      toast({ title: "❌ خطأ في الحذف", variant: "destructive" });
                    }
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Card key={course.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-lg flex justify-between items-start">
                    {course.title}
                    {course.enable_certificate ? (
                      <Badge className="bg-green-100 text-green-700">مفعلة</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">غير مفعلة</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-sm space-y-2">
                    <p><span className="font-semibold">العنوان:</span> {course.certificate_config?.title || "افتراضي"}</p>
                    <p><span className="font-semibold">النمط:</span> {course.certificate_config?.template_style || "كلاسيكي"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => openTemplateDialog(course.id)}>
                      <Edit className="w-4 h-4 ml-2" />
                      تخصيص
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => window.open(`/CertificateView?preview=true&courseId=${course.id}`, '_blank')} title="معاينة">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "تعديل الدورة" : "إنشاء دورة جديدة"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <Input value={courseFormData.title} onChange={e => setCourseFormData({...courseFormData, title: e.target.value})} placeholder="عنوان الدورة" />
              <Textarea value={courseFormData.description} onChange={e => setCourseFormData({...courseFormData, description: e.target.value})} placeholder="الوصف" />
              <div className="grid grid-cols-2 gap-4">
                <Select value={courseFormData.level} onValueChange={v => setCourseFormData({...courseFormData, level: v})}>
                  <SelectTrigger><SelectValue placeholder="المستوى" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدئ</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={courseFormData.image_url} onChange={e => setCourseFormData({...courseFormData, image_url: e.target.value})} placeholder="رابط الصورة" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={courseFormData.is_active} onChange={e => setCourseFormData({...courseFormData, is_active: e.target.checked})} />
                  نشطة
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={courseFormData.enable_certificate} onChange={e => setCourseFormData({...courseFormData, enable_certificate: e.target.checked})} />
                  شهادات
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">الكلمات ({selectedWords.length})</label>
              {selectedWords.length > 0 && (
                <div className="border rounded h-[150px] overflow-y-auto p-2 bg-gray-50">
                  {selectedWords.map((wordId, idx) => {
                    const word = availableWords.find(w => w.id === wordId);
                    return word ? (
                      <div key={wordId} className="p-2 bg-white border rounded mb-1 text-sm flex justify-between">
                        <span>{word.word}</span>
                        <button onClick={() => setSelectedWords(prev => prev.filter(id => id !== wordId))} className="text-red-500">✕</button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              
              <div className="flex gap-2">
                <Select value={selectedSurahToAdd} onValueChange={setSelectedSurahToAdd}>
                  <SelectTrigger><SelectValue placeholder="إضافة سورة" /></SelectTrigger>
                  <SelectContent>
                    {surahList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  if (!selectedSurahToAdd) return;
                  const wordsToAdd = availableWords.filter(w => w.surah_name === selectedSurahToAdd && !selectedWords.includes(w.id)).map(w => w.id);
                  setSelectedWords(prev => [...prev, ...wordsToAdd]);
                  setSelectedSurahToAdd("");
                }}>إضافة</Button>
              </div>
              
              <div className="border rounded h-[200px] overflow-y-auto p-2 bg-white">
                {availableWords.filter(w => !selectedWords.includes(w.id)).slice(0, 100).map(word => (
                  <div key={word.id} onClick={() => setSelectedWords(prev => [...prev, word.id])} className="p-2 text-sm cursor-pointer hover:bg-gray-100 rounded">
                    {word.word} - {word.surah_name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>إلغاء</Button>
            <Button onClick={async () => {
              if (!courseFormData.title) return toast({ title: "⚠️ يرجى إدخال عنوان" });
              try {
                const payload = { ...courseFormData, words_ids: selectedWords };
                if (editingCourse) {
                  await base44.entities.Course.update(editingCourse.id, payload);
                  toast({ title: "✅ تم التحديث" });
                } else {
                  await base44.entities.Course.create(payload);
                  toast({ title: "✅ تم الإنشاء" });
                }
                setShowCourseDialog(false);
                fetchData();
              } catch (error) {
                toast({ title: "❌ خطأ", variant: "destructive" });
              }
            }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تخصيص قالب الشهادة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={templateForm.title} onChange={e => setTemplateForm({...templateForm, title: e.target.value})} placeholder="عنوان الشهادة" />
            <Textarea value={templateForm.body} onChange={e => setTemplateForm({...templateForm, body: e.target.value})} placeholder="نص الشهادة" />
            <Input value={templateForm.signature} onChange={e => setTemplateForm({...templateForm, signature: e.target.value})} placeholder="التوقيع" />
            <Select value={templateForm.style} onValueChange={v => setTemplateForm({...templateForm, style: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">كلاسيكي</SelectItem>
                <SelectItem value="modern">عصري</SelectItem>
                <SelectItem value="islamic">زخرفة إسلامية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>إلغاء</Button>
            <Button onClick={handleUpdateTemplate}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}