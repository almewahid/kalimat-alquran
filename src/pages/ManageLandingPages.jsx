import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Rocket, Plus, Edit, Trash2, Eye, Calendar, Loader2, Palette } from "lucide-react";
import { motion } from "framer-motion";

const AVAILABLE_PAGES = ["Dashboard", "Learn", "SmartReview", "QuizTypes", "Search", "Favorites", "Groups", "Leaderboard", "Achievements"];

export default function ManageLandingPages() {
  const { toast } = useToast();
  const [landingPages, setLandingPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image_url: "",
    button_text: "انتقل الآن",
    button_link: "",
    background_color: "#f0f9ff",
    text_color: "#1e293b",
    start_date: "",
    end_date: "",
    target_pages: ["Dashboard"],
    is_active: true,
    position: "top",
    priority: 0
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const user = await supabaseClient.supabase.auth.getUser();
      setIsAdmin(user.role === "admin");
      
      if (user.role === "admin") {
        await loadLandingPages();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLandingPages = async () => {
    try {
      const pages = await supabaseClient.entities.LandingPage.list("-priority", 100);
      setLandingPages(pages);
    } catch (error) {
      console.error("Error loading landing pages:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.button_text || !formData.button_link || !formData.start_date || !formData.end_date) {
      toast({ title: "⚠️ الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    try {
      if (editingPage) {
        await supabaseClient.entities.LandingPage.update(editingPage.id, formData);
        toast({ title: "✅ تم التحديث بنجاح" });
      } else {
        await supabaseClient.entities.LandingPage.create(formData);
        toast({ title: "✅ تم الإنشاء بنجاح" });
      }
      
      setShowDialog(false);
      resetForm();
      loadLandingPages();
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "❌ حدث خطأ", variant: "destructive" });
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      subtitle: page.subtitle || "",
      description: page.description || "",
      image_url: page.image_url || "",
      button_text: page.button_text,
      button_link: page.button_link,
      background_color: page.background_color || "#f0f9ff",
      text_color: page.text_color || "#1e293b",
      start_date: page.start_date?.split('T')[0] || "",
      end_date: page.end_date?.split('T')[0] || "",
      target_pages: page.target_pages || ["Dashboard"],
      is_active: page.is_active,
      position: page.position || "top",
      priority: page.priority || 0
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    
    try {
      await supabaseClient.entities.LandingPage.delete(id);
      toast({ title: "✅ تم الحذف" });
      loadLandingPages();
    } catch (error) {
      toast({ title: "❌ فشل الحذف", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingPage(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image_url: "",
      button_text: "انتقل الآن",
      button_link: "",
      background_color: "#f0f9ff",
      text_color: "#1e293b",
      start_date: "",
      end_date: "",
      target_pages: ["Dashboard"],
      is_active: true,
      position: "top",
      priority: 0
    });
  };

  const togglePageSelection = (page) => {
    setFormData(prev => ({
      ...prev,
      target_pages: prev.target_pages.includes(page)
        ? prev.target_pages.filter(p => p !== page)
        : [...prev.target_pages, page]
    }));
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
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
  }

  return (
    <div className="p-6 w-full space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Rocket className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold gradient-text">صفحات الهبوط</h1>
              <p className="text-foreground/70">إدارة الإعلانات والمسابقات</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
            <Plus className="w-5 h-5" />
            إنشاء جديد
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landingPages.map((page, index) => (
            <motion.div key={page.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className={`${!page.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    {page.is_active ? (
                      <Badge className="bg-green-100 text-green-700">نشط</Badge>
                    ) : (
                      <Badge variant="outline">معطل</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {page.image_url && (
                    <img src={page.image_url} alt={page.title} className="w-full h-32 object-cover rounded-lg" />
                  )}
                  
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-foreground/60" />
                      <span className="text-foreground/70">
                        {new Date(page.start_date).toLocaleDateString('ar-SA')} - {new Date(page.end_date).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {page.target_pages?.map(p => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(page)} className="flex-1">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(page.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPage ? "تعديل صفحة الهبوط" : "إنشاء صفحة هبوط جديدة"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">العنوان *</label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="مسابقة رمضان 2026" />
              </div>

              <div>
                <label className="text-sm font-medium">عنوان فرعي</label>
                <Input value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} placeholder="جوائز قيمة للفائزين" />
              </div>

              <div>
                <label className="text-sm font-medium">الوصف</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="شارك في المسابقة..." rows={3} />
              </div>

              <div>
                <label className="text-sm font-medium">رابط الصورة</label>
                <Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">نص الزر *</label>
                  <Input value={formData.button_text} onChange={(e) => setFormData({...formData, button_text: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">رابط الزر *</label>
                  <Input value={formData.button_link} onChange={(e) => setFormData({...formData, button_link: e.target.value})} placeholder="اسم الصفحة: Groups أو رابط خارجي: https://..." />
                  <p className="text-xs text-muted-foreground mt-1">
                    للصفحات الداخلية: Groups, Dashboard, Learn إلخ<br/>
                    للروابط الخارجية: https://example.com
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4" /> لون الخلفية
                  </label>
                  <div className="flex gap-2">
                    <Input type="color" value={formData.background_color} onChange={(e) => setFormData({...formData, background_color: e.target.value})} className="w-14 h-10" />
                    <Input value={formData.background_color} onChange={(e) => setFormData({...formData, background_color: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">لون النص</label>
                  <div className="flex gap-2">
                    <Input type="color" value={formData.text_color} onChange={(e) => setFormData({...formData, text_color: e.target.value})} className="w-14 h-10" />
                    <Input value={formData.text_color} onChange={(e) => setFormData({...formData, text_color: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">تاريخ البداية *</label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">تاريخ النهاية *</label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">الصفحات المستهدفة</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PAGES.map(page => (
                    <Badge
                      key={page}
                      variant={formData.target_pages.includes(page) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => togglePageSelection(page)}
                    >
                      {page}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">الموقع</label>
                  <Select value={formData.position} onValueChange={(v) => setFormData({...formData, position: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">أعلى الصفحة</SelectItem>
                      <SelectItem value="bottom">أسفل الصفحة</SelectItem>
                      <SelectItem value="modal">نافذة منبثقة (مرة واحدة)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    أعلى/أسفل: يظهر دائماً | منبثقة: مرة واحدة لكل مستخدم
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">الأولوية (0-10)</label>
                  <Input type="number" min="0" max="10" value={formData.priority} onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})} />
                  <p className="text-xs text-muted-foreground mt-1">
                    الأولوية الأعلى (10) تظهر أولاً، الأقل (0) تظهر آخراً
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-background-soft rounded-lg">
                <span className="text-sm font-medium">تفعيل الصفحة</span>
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({...formData, is_active: v})} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button onClick={handleSubmit}>{editingPage ? "تحديث" : "إنشاء"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}