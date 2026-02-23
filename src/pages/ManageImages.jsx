import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { invokeLLMWithImage } from "@/api/gemini";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import UploadSection      from "@/components/manage-images/UploadSection";
import SearchToolbar      from "@/components/manage-images/SearchToolbar";
import ImageGrid          from "@/components/manage-images/ImageGrid";
import StatsTab           from "@/components/manage-images/StatsTab";
import ExportTab          from "@/components/manage-images/ExportTab";
import CategoryManager    from "@/components/manage-images/CategoryManager";
import EditImageDialog    from "@/components/manage-images/EditImageDialog";
import BulkActionBar      from "@/components/manage-images/BulkActionBar";
import BulkEditDialog     from "@/components/manage-images/BulkEditDialog";
import AdvancedFixDialog  from "@/components/manage-images/AdvancedFixDialog";

const CLOUD_NAME    = "dufjbywcm";
const UPLOAD_PRESET = "kalimat-allah_uploads";

export default function ManageImages() {
  const { toast } = useToast();

  // --- State ---
  const [images, setImages]                   = useState([]);
  const [filteredImages, setFilteredImages]   = useState([]);
  const [categories, setCategories]           = useState([]);
  const [newCategory, setNewCategory]         = useState({ name: "", description: "" });
  const [isLoading, setIsLoading]             = useState(true);
  const [isAdmin, setIsAdmin]                 = useState(false);
  const [searchTerm, setSearchTerm]           = useState("");
  const [activeTab, setActiveTab]             = useState("الجميع");
  const [sortOrder, setSortOrder]             = useState("newest");
  const [dateFilter, setDateFilter]           = useState("all");
  const [category, setCategory]               = useState("");
  const [previewFiles, setPreviewFiles]       = useState([]);
  const [uploading, setUploading]             = useState(false);
  const [editingImage, setEditingImage]       = useState(null);
  const [showEditDialog, setShowEditDialog]   = useState(false);
  const [brokenImageIds, setBrokenImageIds]   = useState(new Set());
  const [selectedIds, setSelectedIds]         = useState(new Set());
  const [showBulkEdit, setShowBulkEdit]       = useState(false);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [showAdvancedFix, setShowAdvancedFix] = useState(false);
  const [manualPath, setManualPath]           = useState("kalimat/");
  const [transformData, setTransformData]     = useState({ width: 800, height: 600, crop: "fill", effect: "none" });

  // --- Load ---
  useEffect(() => { checkAdminAndLoadAll(); }, []);
  useEffect(() => { filterImages(); }, [searchTerm, activeTab, images, sortOrder, dateFilter]);

  const checkAdminAndLoadAll = async () => {
    try {
      const user = await supabaseClient.auth.me();
      setIsAdmin(user.role === "admin");
      if (user.role !== "admin") { setIsLoading(false); return; }
      await Promise.all([loadImages(), loadCategories()]);
    } catch {
      toast({ title: "❌ خطأ", description: "حدث خطأ أثناء تحميل البيانات", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadImages = async () => {
    const res = await supabaseClient.entities.Image.list("-created_date", 1000);
    setImages(res);
  };

  const loadCategories = async () => {
    const res = await supabaseClient.entities.Category.list("-created_date", 1000);
    setCategories(res.filter(c => c.type === 'image'));
  };

  // --- Filter ---
  const filterImages = () => {
    const normalize = (str) => {
      if (!str) return "";
      return str.trim().normalize("NFKC")
        .replace(/[\u064B-\u065F]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه");
    };

    let filtered = images;

    if (activeTab !== "الجميع" && activeTab !== "cloudinary-stats" && activeTab !== "export") {
      const targetCat = normalize(activeTab);
      filtered = filtered.filter(img => {
        const imgCat = normalize(img.category);
        return imgCat === targetCat || imgCat.includes(targetCat) || targetCat.includes(imgCat);
      });
    }

    if (searchTerm.trim()) {
      const term = normalize(searchTerm.toLowerCase());
      filtered = filtered.filter(img =>
        normalize(img.title?.toLowerCase()).includes(term) ||
        normalize(img.description?.toLowerCase()).includes(term) ||
        normalize(img.url?.toLowerCase()).includes(term) ||
        normalize(img.category?.toLowerCase()).includes(term)
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(img => {
        const imgDate = new Date(img.created_date);
        if (dateFilter === "today") return imgDate.toDateString() === now.toDateString();
        if (dateFilter === "week") { const d = new Date(); d.setDate(now.getDate() - 7); return imgDate >= d; }
        if (dateFilter === "month") { const d = new Date(); d.setMonth(now.getMonth() - 1); return imgDate >= d; }
        return true;
      });
    }

    filtered.sort((a, b) => {
      const dA = new Date(a.created_date).getTime(), dB = new Date(b.created_date).getTime();
      if (sortOrder === "newest") return dB - dA;
      if (sortOrder === "oldest") return dA - dB;
      if (sortOrder === "name_asc") return (a.title || "").localeCompare(b.title || "");
      if (sortOrder === "name_desc") return (b.title || "").localeCompare(a.title || "");
      return 0;
    });

    setFilteredImages(filtered);
  };

  // --- Selection ---
  const toggleSelection = (id) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.size === filteredImages.length ? new Set() : new Set(filteredImages.map(img => img.id)));
  };

  // --- URL Utilities ---
  const fixUrlEncoding = (url) => {
    if (!url || !url.includes('/upload/')) return url;
    try {
      const [base, path] = url.split('/upload/');
      const encodedParts = path.split('/').map(part => {
        if (part.startsWith('v') && !isNaN(parseInt(part.substring(1)))) return part;
        let decoded = part;
        try { let prev; do { prev = decoded; decoded = decodeURIComponent(decoded); } while (decoded !== prev); } catch {}
        return encodeURIComponent(decoded);
      });
      return `${base}/upload/${encodedParts.join('/')}`;
    } catch { return url; }
  };

  const checkUrlExists = async (url) => {
    try { const res = await fetch(url, { method: "HEAD" }); return res.ok; } catch { return false; }
  };

  // --- Upload ---
  const handleFileChange = (e) => setPreviewFiles(Array.from(e.target.files));

  const handleUpload = async () => {
    if (previewFiles.length === 0) { toast({ title: "⚠️ اختر صورًا أولاً" }); return; }
    if (!category) { toast({ title: "⚠️ اختر فئة لوضع الصور فيها" }); return; }
    setUploading(true);
    try {
      for (const file of previewFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("folder", `kalimat/${category}`);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.secure_url) {
          await supabaseClient.entities.Image.create({ url: data.secure_url, title: file.name, description: "", file_size: file.size, width: data.width, height: data.height, category });
        }
      }
      toast({ title: "✅ تم الرفع بنجاح", description: `تم رفع الصور إلى فئة "${category}"`, className: "bg-green-100 text-green-800" });
      setPreviewFiles([]);
      checkAdminAndLoadAll();
    } catch {
      toast({ title: "❌ فشل الرفع", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // --- Edit / Delete ---
  const handleEdit = (image) => { setEditingImage({ ...image }); setShowEditDialog(true); };

  const handleSaveEdit = async () => {
    try {
      await supabaseClient.entities.Image.update(editingImage.id, { title: editingImage.title, description: editingImage.description, category: editingImage.category, url: editingImage.url });
      toast({ title: "✅ تم تحديث بيانات الصورة" });
      setShowEditDialog(false);
      checkAdminAndLoadAll();
    } catch {
      toast({ title: "❌ فشل التحديث", variant: "destructive" });
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
    try {
      await supabaseClient.entities.Image.delete(imageId);
      toast({ title: "✅ تم حذف الصورة" });
      checkAdminAndLoadAll();
    } catch {
      toast({ title: "❌ فشل الحذف", variant: "destructive" });
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: "✅ تم النسخ", description: "تم نسخ رابط الصورة" });
  };

  const handleImageError = (id) => setBrokenImageIds(prev => new Set(prev).add(id));

  // --- URL Fix ---
  const handleFixCurrentUrl = () => {
    const fixed = fixUrlEncoding(editingImage.url);
    if (fixed !== editingImage.url) {
      setEditingImage({ ...editingImage, url: fixed });
      toast({ title: "تم تحسين الرابط" });
    } else {
      toast({ title: "الرابط يبدو سليماً" });
    }
  };

  // --- Transformations ---
  const getTransformedUrl = (url) => {
    if (!url || !url.includes('/upload/')) return url;
    const [base, path] = url.split('/upload/');
    const t = [];
    if (transformData.width) t.push(`w_${transformData.width}`);
    if (transformData.height) t.push(`h_${transformData.height}`);
    if (transformData.crop) t.push(`c_${transformData.crop}`);
    if (transformData.effect && transformData.effect !== 'none') t.push(`e_${transformData.effect}`);
    return `${base}/upload/${t.join(',')}/${path}`;
  };

  const applyTransformation = () => {
    if (!editingImage) return;
    setEditingImage({ ...editingImage, url: getTransformedUrl(editingImage.url) });
    toast({ title: "تم تطبيق التحويل", description: "لا تنس حفظ التعديلات." });
  };

  // --- Bulk Operations ---
  const handleBulkEdit = async (bulkEditData) => {
    setIsProcessing(true);
    try {
      const updates = {};
      if (bulkEditData.category) updates.category = bulkEditData.category;
      if (bulkEditData.description) updates.description = bulkEditData.description;
      if (Object.keys(updates).length === 0) return;
      await Promise.all(Array.from(selectedIds).map(id => supabaseClient.entities.Image.update(id, updates)));
      toast({ title: "✅ تم التعديل الجماعي", description: `تم تحديث ${selectedIds.size} صورة.` });
      setShowBulkEdit(false);
      setSelectedIds(new Set());
      checkAdminAndLoadAll();
    } catch {
      toast({ title: "❌ حدث خطأ", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoTag = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    let successCount = 0;
    try {
      const imagesToTag = images.filter(img => selectedIds.has(img.id));
      toast({ title: "🤖 جاري تحليل الصور...", description: "قد يستغرق هذا بعض الوقت." });
      for (const img of imagesToTag) {
        try {
          if (brokenImageIds.has(img.id) || !img.url) continue;
          const res = await invokeLLMWithImage(
            "حلل هذه الصورة وأعطني 5-8 وسوم ذات صلة باللغة العربية كـ JSON array. مثال: [\"قرآن\", \"طبيعة\"]. أعد فقط الـ array بدون شرح.",
            img.url
          );
          const tags = Array.isArray(res) ? res : res?.tags;
          if (tags?.length) { await supabaseClient.entities.Image.update(img.id, { tags }); successCount++; }
        } catch {}
      }
      toast({ title: "✅ تم إنشاء الوسوم", description: `تم تحديث ${successCount} صورة بنجاح.` });
      checkAdminAndLoadAll();
      setSelectedIds(new Set());
    } catch {
      toast({ title: "❌ فشل التحليل", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRepair = async () => {
    if (brokenImageIds.size === 0) {
      toast({ title: "✅ لم يتم اكتشاف صور مكسورة حالياً" });
      return;
    }
    if (!confirm(`⚠️ هل تريد بدء "البحث الذكي" عن ${brokenImageIds.size} صورة مكسورة؟`)) return;
    setIsLoading(true);
    let updatedCount = 0;
    const CLOUD_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/`;
    try {
      for (const img of images.filter(img => brokenImageIds.has(img.id))) {
        if (!img.url) continue;
        const fileName = decodeURIComponent(img.url.split('/').pop());
        const candidates = [fixUrlEncoding(img.url)];
        if (img.category) {
          const cat = img.category.trim();
          candidates.push(`${CLOUD_BASE}kalimat/${encodeURIComponent(cat.replace(/\s+/g, '_'))}/${fileName}`);
          candidates.push(`${CLOUD_BASE}kalimat/${encodeURIComponent(cat.replace(/\s+/g, '-'))}/${fileName}`);
          candidates.push(`${CLOUD_BASE}kalimat/${cat}/${fileName}`);
        }
        candidates.push(`${CLOUD_BASE}kalimat/${fileName}`);
        let foundUrl = null;
        for (const url of candidates) {
          if (url !== img.url && await checkUrlExists(url)) { foundUrl = url; break; }
        }
        if (foundUrl) { await supabaseClient.entities.Image.update(img.id, { url: foundUrl }); updatedCount++; }
      }
      toast(updatedCount > 0
        ? { title: "✅ نجاح البحث الذكي", description: `تم العثور على ${updatedCount} صورة وإصلاح روابطها!` }
        : { title: "⚠️ لم يتم العثور على صور بديلة" }
      );
      setBrokenImageIds(new Set());
      checkAdminAndLoadAll();
    } catch {
      toast({ title: "❌ حدث خطأ أثناء العملية", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualPathFix = async () => {
    if (!manualPath) return;
    setIsProcessing(true);
    let fixedCount = 0;
    const CLOUD_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/`;
    try {
      for (const img of images.filter(img => selectedIds.has(img.id))) {
        if (!img.url) continue;
        const fileName = img.url.split('/').pop();
        const cleanPath = manualPath.endsWith('/') ? manualPath : manualPath + '/';
        const finalPath = cleanPath.replace(/^v\d+\//, '');
        const potentialUrl = `${CLOUD_BASE}${finalPath}${fileName}`;
        if (await checkUrlExists(potentialUrl)) {
          await supabaseClient.entities.Image.update(img.id, { url: potentialUrl });
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
    } catch {
      toast({ title: "❌ خطأ", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Category Management ---
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) { toast({ title: "⚠️ أدخل اسم الفئة" }); return; }
    try {
      await supabaseClient.entities.Category.create({ name: newCategory.name.trim(), description: newCategory.description.trim(), type: 'image' });
      toast({ title: "✅ تمت إضافة الفئة بنجاح" });
      setNewCategory({ name: "", description: "" });
      loadCategories();
    } catch {
      toast({ title: "❌ فشل إضافة الفئة", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("هل تريد حذف هذه الفئة؟")) return;
    try {
      await supabaseClient.entities.Category.delete(id);
      toast({ title: "✅ تم حذف الفئة" });
      loadCategories();
    } catch {
      toast({ title: "❌ فشل حذف الفئة", variant: "destructive" });
    }
  };

  // --- Guards ---
  if (isLoading) return <div className="p-6 flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  if (!isAdmin) return (
    <div className="p-6 max-w-2xl mx-auto mt-10">
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">⛔ غير مصرح</h2>
          <p className="text-red-600">هذه الصفحة متاحة للمسؤولين فقط</p>
        </CardContent>
      </Card>
    </div>
  );

  // --- Render ---
  return (
    <div className="p-6 w-full space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة الصور والفئات</h1>
            <p className="text-foreground/70">رفع وتعديل وحذف الصور مع إدارة الفئات من قاعدة البيانات</p>
          </div>
        </div>

        <UploadSection
          categories={categories} category={category} setCategory={setCategory}
          previewFiles={previewFiles} handleFileChange={handleFileChange}
          handleUpload={handleUpload} uploading={uploading}
        />

        <SearchToolbar
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          filteredImages={filteredImages} selectedIds={selectedIds} selectAll={selectAll}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
          dateFilter={dateFilter} setDateFilter={setDateFilter}
          brokenImageIds={brokenImageIds} handleBulkRepair={handleBulkRepair}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 mb-6">
            <TabsTrigger value="الجميع">الجميع</TabsTrigger>
            <TabsTrigger value="cloudinary-stats">📊 إحصائيات Cloudinary</TabsTrigger>
            <TabsTrigger value="export">📥 تصدير الروابط</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.name}>{cat.name}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="cloudinary-stats">
            <StatsTab images={images} categories={categories} category={category} setCategory={setCategory} />
          </TabsContent>

          <TabsContent value="export">
            <ExportTab images={images} categories={categories} category={category} setCategory={setCategory} />
          </TabsContent>

          <TabsContent value={activeTab}>
            <ImageGrid
              filteredImages={filteredImages} selectedIds={selectedIds}
              toggleSelection={toggleSelection} handleEdit={handleEdit}
              handleDelete={handleDelete} copyToClipboard={copyToClipboard}
              handleImageError={handleImageError}
            />
          </TabsContent>
        </Tabs>

        <CategoryManager
          categories={categories} newCategory={newCategory} setNewCategory={setNewCategory}
          handleAddCategory={handleAddCategory} handleDeleteCategory={handleDeleteCategory}
        />

        <EditImageDialog
          editingImage={editingImage} setEditingImage={setEditingImage}
          showEditDialog={showEditDialog} setShowEditDialog={setShowEditDialog}
          categories={categories}
          handleSaveEdit={handleSaveEdit} handleFixCurrentUrl={handleFixCurrentUrl}
          transformData={transformData} setTransformData={setTransformData} applyTransformation={applyTransformation}
        />

        <BulkActionBar
          selectedIds={selectedIds} setSelectedIds={setSelectedIds}
          setShowBulkEdit={setShowBulkEdit} handleAutoTag={handleAutoTag}
          setShowAdvancedFix={setShowAdvancedFix} handleDelete={handleDelete}
          isProcessing={isProcessing}
        />

        <BulkEditDialog
          showBulkEdit={showBulkEdit} setShowBulkEdit={setShowBulkEdit}
          selectedIds={selectedIds} categories={categories}
          handleBulkEdit={handleBulkEdit} isProcessing={isProcessing}
        />

        <AdvancedFixDialog
          showAdvancedFix={showAdvancedFix} setShowAdvancedFix={setShowAdvancedFix}
          manualPath={manualPath} setManualPath={setManualPath}
          handleManualPathFix={handleManualPathFix} isProcessing={isProcessing}
        />
      </motion.div>
    </div>
  );
}
