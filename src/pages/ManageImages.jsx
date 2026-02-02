"use client";

import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient"; // ✅ نحتفظ بالاتصال الأصلي
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Image as ImageIcon,
  Trash2,
  Edit,
  Loader2,
  Search,
  Upload,
  FolderTree,
  PlusCircle,
  Wrench,
  RefreshCw,
  CheckSquare,
  Square,
  Sparkles,
  Tags,
  Scissors,
  Layers,
  Wand2,
  AlertTriangle,
  Download,
  Copy
} from "lucide-react";
import { Label } from "@/components/ui/label";
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

export default function ManageImages() {
  const CLOUD_NAME = "dufjbywcm";
  const UPLOAD_PRESET = "kalimat-allah_uploads";

  const { toast } = useToast();
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  // Advanced Filter States
  const [sortOrder, setSortOrder] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [categories, setCategories] = useState([]); // ✅ الفئات من قاعدة البيانات
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("الجميع");
  const [editingImage, setEditingImage] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [category, setCategory] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState(new Set()); // ✅ تتبع الصور المكسورة فقط
  
  // Bulk Edit & Selection States
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ category: "", description: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Advanced Fix State
  const [showAdvancedFix, setShowAdvancedFix] = useState(false);
  const [manualPath, setManualPath] = useState("kalimat/");

  // Transformations State
  const [transformTab, setTransformTab] = useState("resize");
  const [transformData, setTransformData] = useState({ width: 800, height: 600, crop: "fill", effect: "none" });

  // 🧩 تحميل الصور والفئات
  useEffect(() => {
    checkAdminAndLoadAll();
  }, []);

  useEffect(() => {
    filterImages();
  }, [searchTerm, activeTab, images, sortOrder, dateFilter]);

  const checkAdminAndLoadAll = async () => {
    try {
      const user = await supabaseClient.auth.me();
      setIsAdmin(user.role === "admin");

      if (user.role !== "admin") {
        setIsLoading(false);
        return;
      }

      await Promise.all([loadImages(), loadCategories()]);
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

  const loadImages = async () => {
    const res = await supabaseClient.entities.images.list("-created_date", 1000);
    setImages(res);
  };

  const loadCategories = async () => {
    try {
      // ✅ جلب الفئات (صور أو غير محدد)
      const res = await supabaseClient.entities.categories.list("-created_date", 1000);
      // ✅ تصفية الفئات: الصور فقط
      setCategories(res.filter(c => c.type === 'image'));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // 🔍 تصفية الصور (نسخة محسنة)
  const filterImages = () => {
    let filtered = images;

    // دالة تنظيف النصوص
    const normalize = (str) => {
      if (!str) return "";
      return str.trim()
        .normalize("NFKC")
        .replace(/[\u064B-\u065F]/g, "") // إزالة التشكيل
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه");
    };

    if (activeTab !== "الجميع" && activeTab !== "cloudinary-stats" && activeTab !== "export") {
      const targetCat = normalize(activeTab);
      filtered = filtered.filter((img) => {
        const imgCat = normalize(img.category);
        return imgCat === targetCat || imgCat.includes(targetCat) || targetCat.includes(imgCat);
      });
    }

    if (searchTerm.trim()) {
      const term = normalize(searchTerm.toLowerCase());
      filtered = filtered.filter(
        (img) =>
          normalize(img.title?.toLowerCase()).includes(term) ||
          normalize(img.description?.toLowerCase()).includes(term) ||
          normalize(img.url?.toLowerCase()).includes(term) ||
          normalize(img.category?.toLowerCase()).includes(term)
      );
    }

    // Advanced Filtering: Date
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(img => {
        const imgDate = new Date(img.created_date);
        if (dateFilter === "today") return imgDate.toDateString() === now.toDateString();
        if (dateFilter === "week") {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return imgDate >= weekAgo;
        }
        if (dateFilter === "month") {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return imgDate >= monthAgo;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_date).getTime();
      const dateB = new Date(b.created_date).getTime();
      if (sortOrder === "newest") return dateB - dateA;
      if (sortOrder === "oldest") return dateA - dateB;
      if (sortOrder === "name_asc") return (a.title || "").localeCompare(b.title || "");
      if (sortOrder === "name_desc") return (b.title || "").localeCompare(a.title || "");
      return 0;
    });

    setFilteredImages(filtered);
  };

  // 📦 Selection Logic
  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map(img => img.id)));
    }
  };

  // 🤖 AI Auto-Tagging
  const handleAutoTag = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    let successCount = 0;

    try {
        const imagesToTag = images.filter(img => selectedIds.has(img.id));
        toast({ title: "🤖 جاري تحليل الصور...", description: "قد يستغرق هذا بعض الوقت." });

        for (const img of imagesToTag) {
            try {
                // Skip if broken link (can't analyze)
                if (brokenImageIds.has(img.id) || !img.url) continue;

                const res = await supabaseClient.integrations.Core.InvokeLLM({
                    prompt: "Analyze this image and provide 5-8 relevant tags in Arabic as a simple JSON array of strings. Example: [\"قرآن\", \"طبيعة\"]. Do not include explanation.",
                    file_urls: [img.url], // Pass image URL for analysis
                    response_json_schema: { type: "object", properties: { tags: { type: "array", items: { type: "string" } } } }
                });

                if (res && res.tags) {
                    await supabaseClient.entities.images.update(img.id, { tags: res.tags });
                    successCount++;
                }
            } catch (e) {
                console.error("AI Tagging failed for", img.id, e);
            }
        }
        toast({ title: "✅ تم إنشاء الوسوم", description: `تم تحديث ${successCount} صورة بنجاح.` });
        checkAdminAndLoadAll();
        setSelectedIds(new Set());
    } catch (e) {
        toast({ title: "❌ فشل التحليل", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  // ✏️ Bulk Edit Execution
  const handleBulkEdit = async () => {
      setIsProcessing(true);
      try {
          const updates = {};
          if (bulkEditData.category) updates.category = bulkEditData.category;
          if (bulkEditData.description) updates.description = bulkEditData.description;

          if (Object.keys(updates).length === 0) return;

          const promises = Array.from(selectedIds).map(id => 
              supabaseClient.entities.images.update(id, updates)
          );
          
          await Promise.all(promises);
          toast({ title: "✅ تم التعديل الجماعي", description: `تم تحديث ${selectedIds.size} صورة.` });
          setShowBulkEdit(false);
          setSelectedIds(new Set());
          checkAdminAndLoadAll();
      } catch (e) {
          toast({ title: "❌ حدث خطأ", variant: "destructive" });
      } finally {
          setIsProcessing(false);
      }
  };

  // 🛠️ Advanced Manual Path Fix
  const handleManualPathFix = async () => {
      if (!manualPath) return;
      setIsProcessing(true);
      let fixedCount = 0;
      const CLOUD_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/`;
      
      try {
          const targets = images.filter(img => selectedIds.has(img.id));
          
          for (const img of targets) {
              if (!img.url) continue;
              const urlParts = img.url.split('/');
              const fileName = urlParts[urlParts.length - 1];
              // Try to construct URL with manual path
              const cleanPath = manualPath.endsWith('/') ? manualPath : manualPath + '/';
              // Remove v1 from path if user included it, to avoid v1/v1
              const finalPath = cleanPath.replace(/^v\d+\//, ''); 
              
              const potentialUrl = `${CLOUD_BASE}${finalPath}${fileName}`;
              
              if (await checkUrlExists(potentialUrl)) {
                  await supabaseClient.entities.images.update(img.id, { url: potentialUrl });
                  fixedCount++;
              }
          }
          
          if (fixedCount > 0) {
              toast({ title: "✅ تم إصلاح المسارات", description: `تم العثور على ${fixedCount} صورة في المجلد المحدد.` });
              setShowAdvancedFix(false);
              setSelectedIds(new Set());
              checkAdminAndLoadAll();
          } else {
              toast({ title: "⚠️ لم يتم العثور على صور", description: "تأكد من صحة اسم المجلد في Cloudinary." });
          }
      } catch (e) {
          console.error(e);
          toast({ title: "❌ خطأ", variant: "destructive" });
      } finally {
          setIsProcessing(false);
      }
  };

  // 🎨 Generate Transformed URL
  const getTransformedUrl = (url) => {
      if (!url || !url.includes('/upload/')) return url;
      const [base, path] = url.split('/upload/');
      let transforms = [];
      
      if (transformData.width) transforms.push(`w_${transformData.width}`);
      if (transformData.height) transforms.push(`h_${transformData.height}`);
      if (transformData.crop) transforms.push(`c_${transformData.crop}`);
      if (transformData.effect && transformData.effect !== 'none') transforms.push(`e_${transformData.effect}`);
      
      const transformString = transforms.join(',');
      return `${base}/upload/${transformString}/${path}`;
  };

  const applyTransformation = async () => {
      if (!editingImage) return;
      const newUrl = getTransformedUrl(editingImage.url);
      setEditingImage({ ...editingImage, url: newUrl });
      toast({ title: "تم تطبيق التحويل", description: "لا تنس حفظ التعديلات." });
  };

  // 🟢 رفع صور متعددة
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setPreviewFiles(files);
  };

  const handleUpload = async () => {
    if (previewFiles.length === 0) {
      toast({ title: "⚠️ اختر صورًا أولاً" });
      return;
    }
    if (!category) {
      toast({ title: "⚠️ اختر فئة لوضع الصور فيها" });
      return;
    }

    setUploading(true);

    try {
      for (const file of previewFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("folder", `kalimat/${category}`);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();

        if (data.secure_url) {
          await supabaseClient.entities.images.create({
            url: data.secure_url,
            title: file.name,
            description: "",
            file_size: file.size,
            width: data.width,
            height: data.height,
            category: category,
          });
        }
      }

      toast({
        title: "✅ تم الرفع بنجاح",
        description: `تم رفع الصور إلى فئة "${category}"`,
        className: "bg-green-100 text-green-800",
      });

      setPreviewFiles([]);
      checkAdminAndLoadAll();
    } catch (error) {
      console.error("Error uploading:", error);
      toast({
        title: "❌ فشل الرفع",
        description: "حدث خطأ أثناء رفع الصور",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // ✏️ تعديل الصور
  const handleEdit = (image) => {
    setEditingImage({ ...image });
    setShowEditDialog(true);
  };

  // 🛠️ دالة مساعدة لتصحيح ترميز الرابط الموجود
  const fixUrlEncoding = (url) => {
    if (!url) return url;
    try {
        if (!url.includes('/upload/')) return url;

        const [base, path] = url.split('/upload/');
        const pathParts = path.split('/');
        
        const encodedParts = pathParts.map(part => {
            // نتخطى الإصدارات
            if (part.startsWith('v') && !isNaN(parseInt(part.substring(1)))) return part;
            
            // فك التشفير التكراري (لحل مشكلة التشفير المزدوج أو الثلاثي)
            let decoded = part;
            try {
                let prev;
                do {
                    prev = decoded;
                    decoded = decodeURIComponent(decoded);
                } while (decoded !== prev); // استمر في فك التشفير طالما يتغير
            } catch (e) {
                // تجاهل أخطاء فك التشفير
            }

            // إعادة التشفير مرة واحدة بشكل صحيح
            return encodeURIComponent(decoded);
        });

        return `${base}/upload/${encodedParts.join('/')}`;
    } catch (e) {
        console.error("Error fixing url encoding:", e);
        return url;
    }
  };

  // 🛠️ تصحيح الرابط الحالي فقط
  const handleFixCurrentUrl = () => {
    if (!editingImage.url) return;
    const fixed = fixUrlEncoding(editingImage.url);
    if (fixed !== editingImage.url) {
        setEditingImage({ ...editingImage, url: fixed });
        toast({ title: "تم تحسين الرابط", description: "تم إعادة ضبط ترميز الرابط." });
    } else {
        toast({ title: "الرابط يبدو سليماً", description: "لم يتم العثور على مشاكل ترميز." });
    }
  };

  // 🕵️‍♂️ دالة للتحقق من وجود الرابط
  const checkUrlExists = async (url) => {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
    } catch (e) {
        return false;
    }
  };

  const handleBulkRepair = async () => {
    const brokenCount = brokenImageIds.size;
    
    if (brokenCount === 0) {
        toast({ title: "✅ لم يتم اكتشاف صور مكسورة حالياً", description: "تأكد من تصفح الصور ليتم اكتشاف المكسور منها." });
        return;
    }

    if (!confirm(`⚠️ هل تريد بدء "البحث الذكي" عن ${brokenCount} صورة مكسورة؟\n\nسيحاول النظام تخمين مكان الصور (مثلاً: استبدال المسافات بشرطة سفلية، أو البحث في المجلد الرئيسي) وتحديث الروابط تلقائياً.`)) return;
    
    setIsLoading(true);
    let updatedCount = 0;
    
    try {
        const imagesToFix = images.filter(img => brokenImageIds.has(img.id));
        const CLOUD_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/`;

        for (const img of imagesToFix) {
             if (!img.url) continue;

             // استخراج اسم الملف من الرابط الحالي
             const urlParts = img.url.split('/');
             const fileName = urlParts[urlParts.length - 1]; // e.g. "image.jpg"
             const cleanFileName = decodeURIComponent(fileName); 
             
             // احتمالات أماكن الصورة
             const candidates = [];
             
             // 1. الاحتمال الحالي مع تصحيح الترميز
             candidates.push(fixUrlEncoding(img.url));

             if (img.category) {
                 // 2. الفئة مع استبدال المسافات بشرطة سفلية (شائع في Cloudinary)
                 const catUnderscore = img.category.trim().replace(/\s+/g, '_');
                 candidates.push(`${CLOUD_BASE}kalimat/${encodeURIComponent(catUnderscore)}/${cleanFileName}`);

                 // 3. الفئة مع استبدال المسافات بشرطة عادية
                 const catDash = img.category.trim().replace(/\s+/g, '-');
                 candidates.push(`${CLOUD_BASE}kalimat/${encodeURIComponent(catDash)}/${cleanFileName}`);
                 
                 // 4. الفئة بدون تشفير (للحالات القديمة)
                 candidates.push(`${CLOUD_BASE}kalimat/${img.category.trim()}/${cleanFileName}`);
             }

             // 5. المجلد الرئيسي (بدون فئة)
             candidates.push(`${CLOUD_BASE}kalimat/${cleanFileName}`);

             // تجربة الاحتمالات
             let foundUrl = null;
             for (const url of candidates) {
                 if (url !== img.url && await checkUrlExists(url)) {
                     foundUrl = url;
                     break;
                 }
             }

             if (foundUrl) {
                 await supabaseClient.entities.images.update(img.id, { url: foundUrl });
                 updatedCount++;
             }
        }
        
        if (updatedCount > 0) {
            toast({ title: "✅ نجاح البحث الذكي", description: `تم العثور على ${updatedCount} صورة وإصلاح روابطها!` });
        } else {
            toast({ title: "⚠️ لم يتم العثور على صور بديلة", description: "لم تنجح محاولات التخمين. قد تكون الصور محذوفة فعلياً." });
        }
        
        setBrokenImageIds(new Set());
        checkAdminAndLoadAll();
    } catch (e) {
        console.error(e);
        toast({ title: "❌ حدث خطأ أثناء العملية", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageError = (id) => {
    setBrokenImageIds(prev => new Set(prev).add(id));
  };

  const handleSaveEdit = async () => {
    try {
      await supabaseClient.entities.images.update(editingImage.id, {
        title: editingImage.title,
        description: editingImage.description,
        category: editingImage.category,
        url: editingImage.url, // ✅ تحديث الرابط
      });
      toast({ title: "✅ تم تحديث بيانات الصورة" });
      setShowEditDialog(false);
      checkAdminAndLoadAll();
    } catch (error) {
      console.error("Error updating:", error);
      toast({ title: "❌ فشل التحديث", variant: "destructive" });
    }
  };

  // 🗑️ حذف الصور
  const handleDelete = async (imageId) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
    try {
      await supabaseClient.entities.images.delete(imageId);
      toast({ title: "✅ تم حذف الصورة" });
      checkAdminAndLoadAll();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "❌ فشل الحذف", variant: "destructive" });
    }
  };

  // 📋 نسخ الرابط
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: "✅ تم النسخ", description: "تم نسخ رابط الصورة" });
  };

  // 🧩 إدارة الفئات
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({ title: "⚠️ أدخل اسم الفئة" });
      return;
    }
    try {
      await supabaseClient.entities.categories.create({
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        type: 'image', // ✅ تحديد النوع كصورة
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

  // 🌀 تحميل مبدئي
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

  // 🖼️ واجهة الصفحة
  return (
    <div className="p-6 w-full space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        {/* 🏷️ رأس الصفحة */}
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة الصور والفئات</h1>
            <p className="text-foreground/70">
              رفع وتعديل وحذف الصور مع إدارة الفئات من قاعدة البيانات
            </p>
          </div>
        </div>

        {/* 📤 رفع الصور */}
        <Card>
          <CardHeader>
            <CardTitle>📁 رفع صور حسب الفئة</CardTitle>
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

              <Input type="file" multiple accept="image/*" onChange={handleFileChange} />
            </div>

            {previewFiles.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4">
                {previewFiles.map((file, i) => (
                  <div key={i} className="border rounded-lg p-2">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded"
                    />
                    <p className="text-sm mt-2 truncate">{file.name}</p>
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
                  <Upload className="w-4 h-4 mr-2" /> رفع الصور
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 🔍 البحث */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-foreground/50" />
            <Input
              placeholder="ابحث في الصور..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Badge variant="outline">{filteredImages.length} صورة</Badge>
            {filteredImages.length > 0 && (
              <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={selectAll}
                  className="mr-auto"
              >
                  {selectedIds.size === filteredImages.length ? <CheckSquare className="w-4 h-4 ml-2" /> : <Square className="w-4 h-4 ml-2" />}
                  {selectedIds.size === filteredImages.length ? "إلغاء التحديد" : "تحديد الكل"}
              </Button>
            )}
            </CardContent>

            {/* Advanced Filters Toolbar */}
          <div className="px-4 pb-4 flex gap-4 flex-wrap justify-between items-center">
             <div className="flex gap-4 flex-wrap">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="ترتيب حسب" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">الأحدث أولاً</SelectItem>
                        <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                        <SelectItem value="name_asc">الاسم (أ-ي)</SelectItem>
                        <SelectItem value="name_desc">الاسم (ي-أ)</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="التاريخ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">كل الأوقات</SelectItem>
                        <SelectItem value="today">اليوم</SelectItem>
                        <SelectItem value="week">آخر أسبوع</SelectItem>
                        <SelectItem value="month">آخر شهر</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             
             <Button 
                variant="outline" 
                onClick={handleBulkRepair} 
                className={`text-orange-600 border-orange-200 hover:bg-orange-50 ${brokenImageIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={brokenImageIds.size === 0}
                title="إصلاح الروابط للصور المكسورة فقط"
             >
                <Wrench className="w-4 h-4 mr-2" />
                إصلاح المكسور ({brokenImageIds.size})
             </Button>
          </div>
        </Card>

        {/* 🧭 تبويبات الفئات */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 mb-6">
            <TabsTrigger value="الجميع">الجميع</TabsTrigger>
            <TabsTrigger value="cloudinary-stats">📊 إحصائيات Cloudinary</TabsTrigger>
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
                <CardTitle>📊 إحصائيات استخدام Cloudinary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="mb-4">
                  <Label>فلتر الفئة</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full md:w-1/3">
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
                
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-blue-600">
                        {category === "all" ? images.length : images.filter(img => img.category === category).length}
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">إجمالي الصور</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-purple-50 dark:bg-purple-900/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-purple-600">
                        {(
                          (category === "all" ? images : images.filter(img => img.category === category))
                          .reduce((sum, img) => sum + (img.file_size || 0), 0) / 1024 / 1024
                        ).toFixed(2)} MB
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
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">التوزيع حسب الفئات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categories.map(cat => {
                        const count = images.filter(img => img.category === cat.name).length;
                        const percentage = images.length > 0 ? ((count / images.length) * 100).toFixed(1) : 0;
                        return (
                          <div key={cat.id} className="flex items-center justify-between">
                            <span className="font-medium">{cat.name}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="text-sm text-foreground/70">{count} ({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
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
                        const dataToExport = category === "all" ? images : images.filter(img => img.category === category);
                        const csv = [
                          ["العنوان", "الفئة", "الرابط", "الحجم (KB)", "العرض", "الارتفاع"],
                          ...dataToExport.map(img => [
                            img.title || "بدون عنوان",
                            img.category || "",
                            img.url || "",
                            Math.round((img.file_size || 0) / 1024),
                            img.width || "",
                            img.height || ""
                          ])
                        ].map(row => row.join(",")).join("\n");
                        
                        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `images_export_${category}_${new Date().toISOString().split('T')[0]}.csv`;
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
                        const dataToExport = category === "all" ? images : images.filter(img => img.category === category);
                        const urls = dataToExport.map(img => img.url).join("\n");
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
                      💡 سيتم تصدير البيانات التالية: العنوان، الفئة، الرابط، الحجم، الأبعاد
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value={activeTab}>
            {filteredImages.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-foreground/70">لا توجد صور في هذه الفئة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredImages.map((image) => (
                  <motion.div key={image.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={`overflow-hidden hover:shadow-lg transition-all ${selectedIds.has(image.id) ? 'ring-2 ring-primary' : ''}`}>
                      <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden group">
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 right-2 z-10">
                          <input 
                              type="checkbox" 
                              className="w-5 h-5 accent-primary cursor-pointer shadow-sm"
                              checked={selectedIds.has(image.id)}
                              onChange={() => toggleSelection(image.id)}
                          />
                        </div>

                        {/* Tags Badge */}
                        {image.tags && image.tags.length > 0 && (
                            <div className="absolute top-2 left-2 z-10">
                                <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs flex gap-1">
                                    <Tags className="w-3 h-3" /> {image.tags.length}
                                </Badge>
                            </div>
                        )}
                        <img
                        src={image.url}
                        alt={image.title || "صورة"}
                        className="w-full h-full object-cover transition-opacity duration-300"
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = "https://placehold.co/400x300?text=Broken+Link"; 
                          e.target.classList.add("opacity-50");
                          handleImageError(image.id); // ✅ تسجيل الصورة كـ "مكسورة"
                        }}
                        />
                        {/* Fix Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(image)}>
                              <Wrench className="w-4 h-4 mr-2" /> إصلاح الرابط
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-lg truncate">
                            {image.title || "بدون عنوان"}
                          </h3>
                          {image.category && (
                            <Badge variant="secondary" className="text-xs">
                              <FolderTree className="w-3 h-3 mr-1 inline" /> {image.category}
                            </Badge>
                          )}
                        </div>
                        {image.description && (
                          <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
                            {image.description}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button onClick={() => copyToClipboard(image.url)} size="sm" variant="outline" className="flex-1">
                            نسخ الرابط
                          </Button>
                          <Button onClick={() => handleEdit(image)} size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDelete(image.id)} size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
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

        {/* 🧩 قسم إدارة الفئات */}
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

        {/* ✏️ نافذة التعديل والتحويل */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent dir="rtl" className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>تعديل الصورة وتحسينها</DialogTitle>
        </DialogHeader>

        {editingImage && (
          <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">البيانات الأساسية</TabsTrigger>
                  <TabsTrigger value="transform">التحويلات & Cloudinary</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 py-4">
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <img
                              src={editingImage.url}
                              alt="معاينة"
                              className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                            <div className="text-xs text-gray-500 mb-2">
                                {editingImage.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {editingImage.tags.map((t, i) => (
                                            <Badge key={i} variant="secondary">{t}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-1/2 space-y-3">
                            <Input
                              value={editingImage.title || ""}
                              onChange={(e) =>
                                setEditingImage({ ...editingImage, title: e.target.value })
                              }
                              placeholder="عنوان الصورة"
                            />
                            <Select
                              value={editingImage.category || ""}
                              onValueChange={(v) =>
                                setEditingImage({ ...editingImage, category: v })
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
                            <Textarea
                              value={editingImage.description || ""}
                              onChange={(e) =>
                                setEditingImage({ ...editingImage, description: e.target.value })
                              }
                              placeholder="وصف الصورة"
                              rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <Input
                          value={editingImage.url}
                          onChange={(e) => setEditingImage({ ...editingImage, url: e.target.value })}
                          placeholder="رابط الصورة"
                          className="flex-1 dir-ltr text-xs font-mono"
                        />
                        <Button variant="outline" size="icon" onClick={handleFixCurrentUrl} title="إصلاح ترميز الرابط">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
              </TabsContent>

              <TabsContent value="transform" className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <h3 className="font-semibold flex items-center gap-2"><Scissors className="w-4 h-4"/> إعدادات التحويل</h3>

                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="text-xs">العرض (px)</label>
                                  <Input type="number" value={transformData.width} onChange={(e) => setTransformData({...transformData, width: e.target.value})} />
                              </div>
                              <div>
                                  <label className="text-xs">الارتفاع (px)</label>
                                  <Input type="number" value={transformData.height} onChange={(e) => setTransformData({...transformData, height: e.target.value})} />
                              </div>
                          </div>

                          <div>
                              <label className="text-xs">وضع القص</label>
                              <Select value={transformData.crop} onValueChange={(v) => setTransformData({...transformData, crop: v})}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="fill">Fill (تعبئة)</SelectItem>
                                      <SelectItem value="scale">Scale (تغيير حجم)</SelectItem>
                                      <SelectItem value="crop">Crop (قص)</SelectItem>
                                      <SelectItem value="thumb">Thumbnail (مصغرة)</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>

                          <div>
                              <label className="text-xs">تأثيرات</label>
                              <Select value={transformData.effect} onValueChange={(v) => setTransformData({...transformData, effect: v})}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="none">بدون</SelectItem>
                                      <SelectItem value="grayscale">أبيض وأسود</SelectItem>
                                      <SelectItem value="sepia">Sepia</SelectItem>
                                      <SelectItem value="pixelate">بكسلة</SelectItem>
                                      <SelectItem value="blur">ضبابية</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>

                          <Button onClick={applyTransformation} className="w-full">
                              <Wand2 className="w-4 h-4 mr-2"/> تطبيق على الرابط
                          </Button>
                      </div>

                      <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-center border-2 border-dashed">
                          <div className="text-center">
                              <p className="text-xs text-gray-500 mb-2">معاينة النتيجة الحالية للرابط</p>
                              <img 
                                  src={editingImage.url} 
                                  className="max-h-48 max-w-full object-contain mx-auto shadow-sm"
                                  alt="Preview"
                              />
                          </div>
                      </div>
                  </div>
              </TabsContent>
          </Tabs>
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

        {/* 🛠️ Bulk Action Bar */}
        {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 border border-border animate-in slide-in-from-bottom-5">
            <span className="font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                {selectedIds.size} محدد
            </span>

            <div className="h-6 w-px bg-gray-200"></div>

            <Button size="sm" variant="ghost" onClick={() => setShowBulkEdit(true)} title="تعديل جماعي">
                <Edit className="w-4 h-4 mr-2"/> تعديل
            </Button>

            <Button size="sm" variant="ghost" onClick={handleAutoTag} disabled={isProcessing} title="توليد وسوم بالذكاء الاصطناعي">
                <Sparkles className="w-4 h-4 mr-2 text-purple-500"/> AI Tags
            </Button>

            <Button size="sm" variant="ghost" onClick={() => setShowAdvancedFix(true)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" title="إصلاح روابط الصور المحددة يدوياً">
                <Wrench className="w-4 h-4 mr-2"/> مسار مخصص
            </Button>

            <div className="h-6 w-px bg-gray-200"></div>

            <Button size="sm" variant="ghost" onClick={() => {
                if(confirm("حذف الصور المحددة؟")) {
                    selectedIds.forEach(id => handleDelete(id));
                    setSelectedIds(new Set());
                }
            }} className="text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4"/>
            </Button>

            <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 ml-2" onClick={() => setSelectedIds(new Set())}>
                &times;
            </Button>
        </div>
        )}

        {/* 🛠️ Bulk Edit Dialog */}
        <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تعديل جماعي ({selectedIds.size} عنصر)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">تغيير الفئة للكل</label>
                    <Select onValueChange={(v) => setBulkEditData({...bulkEditData, category: v})}>
                        <SelectTrigger><SelectValue placeholder="اختر الفئة الجديدة (اختياري)" /></SelectTrigger>
                        <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">تحديث الوصف</label>
                    <Input 
                        placeholder="وصف موحد للكل (اختياري)" 
                        onChange={(e) => setBulkEditData({...bulkEditData, description: e.target.value})}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkEdit(false)}>إلغاء</Button>
                <Button onClick={handleBulkEdit} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : "تطبيق التعديلات"}
                </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>

        {/* 🛠️ Advanced Fix Dialog */}
        <Dialog open={showAdvancedFix} onOpenChange={setShowAdvancedFix}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500"/> 
                    إصلاح الروابط (مسار مخصص)
                </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                    إذا كانت الصور تظهر "مكسورة"، فقد تكون في مجلد مختلف عن المتوقع.
                    أدخل اسم المجلد الصحيح في Cloudinary وسنحاول العثور عليها هناك.
                </p>
                <div className="bg-slate-100 p-3 rounded text-xs font-mono mb-2">
                    Cloudinary Structure: kalimat / 
                    <span className="text-blue-600 font-bold">{manualPath}</span>
                     / filename.jpg
                </div>
                <Input 
                    value={manualPath} 
                    onChange={(e) => setManualPath(e.target.value)} 
                    placeholder="مثال: old_folder_name أو kalimat_backup"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdvancedFix(false)}>إلغاء</Button>
                <Button onClick={handleManualPathFix} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : "بدء البحث والإصلاح"}
                </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}