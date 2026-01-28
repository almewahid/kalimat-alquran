import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Award, Search, FileText, CheckCircle, Clock, XCircle, Printer, Eye, Plus, Trash2, Edit } from "lucide-react";
import { Link } from "react-router-dom";

export default function ManageCertificates() {
  const { toast } = useToast();
  const [certificates, setCertificates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Template Form State
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
      const [certsData, coursesData] = await Promise.all([
        base44.entities.Certificate.list("-issue_date", 1000),
        base44.entities.Course.list()
      ]);
      setCertificates(certsData);
      setCourses(coursesData);
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
    
    // Assuming status logic or adding a mock status for now since entity might not have it
    // If entity has status, use it. If not, treat all as 'issued'
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

  // Helper to update a course's template
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
      fetchData(); // Refresh courses
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
            إدارة الشهادات
          </h1>
          <p className="text-muted-foreground">عرض وتتبع وإدارة الشهادات الصادرة وقوالبها</p>
        </div>
      </div>

      <Tabs defaultValue="issued" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="issued">الشهادات الصادرة</TabsTrigger>
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
                {/* Status Filter (Mock functionality as example) */}
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

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تخصيص قالب الشهادة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان الشهادة</label>
              <Input 
                value={templateForm.title} 
                onChange={e => setTemplateForm({...templateForm, title: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نص الشهادة</label>
              <Input 
                value={templateForm.body} 
                onChange={e => setTemplateForm({...templateForm, body: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">التوقيع</label>
              <Input 
                value={templateForm.signature} 
                onChange={e => setTemplateForm({...templateForm, signature: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">النمط</label>
              <Select 
                value={templateForm.style} 
                onValueChange={v => setTemplateForm({...templateForm, style: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">كلاسيكي</SelectItem>
                  <SelectItem value="modern">عصري</SelectItem>
                  <SelectItem value="islamic">زخرفة إسلامية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">لون الحدود</label>
                    <div className="flex gap-2">
                        <Input 
                            type="color" 
                            className="w-12 p-1 h-10"
                            value={templateForm.borderColor} 
                            onChange={e => setTemplateForm({...templateForm, borderColor: e.target.value})} 
                        />
                        <Input 
                            value={templateForm.borderColor} 
                            onChange={e => setTemplateForm({...templateForm, borderColor: e.target.value})} 
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">لون النص</label>
                    <div className="flex gap-2">
                        <Input 
                            type="color" 
                            className="w-12 p-1 h-10"
                            value={templateForm.textColor} 
                            onChange={e => setTemplateForm({...templateForm, textColor: e.target.value})} 
                        />
                        <Input 
                            value={templateForm.textColor} 
                            onChange={e => setTemplateForm({...templateForm, textColor: e.target.value})} 
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">صورة الخلفية (رابط)</label>
              <Input 
                value={templateForm.backgroundImage} 
                onChange={e => setTemplateForm({...templateForm, backgroundImage: e.target.value})} 
                placeholder="https://example.com/bg.png"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">رابط الشعار (Logo)</label>
              <Input 
                value={templateForm.logoUrl} 
                onChange={e => setTemplateForm({...templateForm, logoUrl: e.target.value})} 
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>إلغاء</Button>
            <Button onClick={handleUpdateTemplate}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}