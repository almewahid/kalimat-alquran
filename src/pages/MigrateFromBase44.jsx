import React, { useState } from "react";
import { supabase } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Copy } from "lucide-react";

const SNIPPET = `
// شغّل هذا في console تطبيق base44
(async () => {
  const app = window.__base44_app__ || Object.values(window).find(v => v?.entities);
  const images = await fetch('/api/apps/68b74ae8214aa5bfcb70e378/entities/images/list', {
    method: 'GET', credentials: 'include'
  }).then(r => r.json()).catch(() => []);
  const audios = await fetch('/api/apps/68b74ae8214aa5bfcb70e378/entities/audios/list', {
    method: 'GET', credentials: 'include'
  }).then(r => r.json()).catch(() => []);
  copy(JSON.stringify({ images: images?.data || images || [], audios: audios?.data || audios || [] }));
  console.log('✅ تم النسخ!', 'images:', (images?.data || images || []).length, 'audios:', (audios?.data || audios || []).length);
})();
`.trim();

export default function MigrateFromBase44() {
  const { toast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleParse = () => {
    try {
      const data = JSON.parse(jsonText);
      if (!data.images && !data.audios) throw new Error("لا توجد حقول images أو audios في البيانات");
      setParsed(data);
      setParseError("");
    } catch (e) {
      setParseError(e.message);
      setParsed(null);
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    const res = { images: { success: 0, skip: 0, fail: 0 }, audios: { success: 0, skip: 0, fail: 0 } };

    try {
      // استيراد الصور
      for (const img of (parsed.images || [])) {
        try {
          const { data: existing, error: selErr } = await supabase.from("images").select("id").eq("url", img.url).maybeSingle();
          if (selErr) throw selErr;
          if (existing) { res.images.skip++; continue; }
          const { error: insErr } = await supabase.from("images").insert({
            url: img.url || "",
            title: img.title || "",
            description: img.description || "",
            file_size: img.file_size || null,
            width: img.width || null,
            height: img.height || null,
            category: img.category || "",
            folder_name: img.folder_name || "",
            tags: img.tags || [],
            created_by: img.created_by || img.user_email || "",
            created_date: img.created_date || new Date().toISOString(),
          });
          if (insErr) throw insErr;
          res.images.success++;
        } catch (e) { res.images.fail++; res.images.lastError = e.message; }
      }

      // استيراد الصوتيات
      for (const audio of (parsed.audios || [])) {
        try {
          const { data: existing, error: selErr } = await supabase.from("audios").select("id").eq("url", audio.url).maybeSingle();
          if (selErr) throw selErr;
          if (existing) { res.audios.skip++; continue; }
          const { error: insErr } = await supabase.from("audios").insert({
            url: audio.url || "",
            title: audio.title || "",
            description: audio.description || "",
            file_size: audio.file_size || null,
            duration: audio.duration || null,
            category: audio.category || "",
            word_id: audio.word_id || null,
            created_by: audio.created_by || audio.user_email || "",
            created_date: audio.created_date || new Date().toISOString(),
          });
          if (insErr) throw insErr;
          res.audios.success++;
        } catch (e) { res.audios.fail++; res.audios.lastError = e.message; }
      }

      setResults(res);
      toast({ title: "✅ اكتمل الاستيراد" });
    } catch (e) {
      toast({ title: "❌ خطأ في الاستيراد: " + e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(SNIPPET);
    toast({ title: "✅ تم نسخ الكود" });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">نقل البيانات من base44 إلى Supabase</h1>

      {/* الخطوة 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الخطوة 1 — انسخ البيانات من base44</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            افتح <strong>kalimat-allah.base44.app</strong> في المتصفح، ثم افتح
            <strong> DevTools (F12) → Console</strong> والصق هذا الكود وشغّله:
          </p>
          <div className="relative">
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono">{SNIPPET}</pre>
            <Button size="sm" variant="outline" className="absolute top-2 left-2 gap-1" onClick={copySnippet}>
              <Copy className="w-3 h-3" /> نسخ
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">بعد تشغيله ستظهر رسالة <strong>✅ تم النسخ!</strong> في الـ console.</p>
        </CardContent>
      </Card>

      {/* الخطوة 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الخطوة 2 — ارفع الملف أو الصق البيانات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* رفع ملف */}
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">ارفع ملف migration_data.json مباشرة</p>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const text = ev.target.result;
                  setJsonText(text);
                  try {
                    const data = JSON.parse(text);
                    if (!data.images && !data.audios) throw new Error("لا توجد حقول images أو audios");
                    setParsed(data);
                    setParseError("");
                  } catch (err) {
                    setParseError(err.message);
                    setParsed(null);
                  }
                };
                reader.readAsText(file);
              }}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">— أو —</p>
          <Textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setParsed(null); setParseError(""); }}
            placeholder='الصق JSON هنا...'
            className="h-40 font-mono text-xs"
            dir="ltr"
          />
          {parseError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {parseError}
            </p>
          )}
          <Button onClick={handleParse} disabled={!jsonText.trim()}>تحليل البيانات</Button>

          {parsed && (
            <div className="flex gap-3 pt-1">
              <Badge variant="outline">🖼 {parsed.images?.length || 0} صورة</Badge>
              <Badge variant="outline">🎵 {parsed.audios?.length || 0} صوتية</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الخطوة 3 */}
      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الخطوة 3 — استيراد إلى Supabase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleImport} disabled={importing} className="w-full">
              {importing ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الاستيراد...</> : "ابدأ الاستيراد"}
            </Button>

            {results && (
              <div className="space-y-2 pt-2">
                {[["الصور", results.images], ["الصوتيات", results.audios]].map(([label, r]) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{label}:</span>
                      <Badge className="bg-green-100 text-green-700">{r.success} تم</Badge>
                      <Badge variant="outline">{r.skip} موجود مسبقاً</Badge>
                      {r.fail > 0 && <Badge variant="destructive">{r.fail} فشل</Badge>}
                    </div>
                    {r.lastError && (
                      <p className="text-xs text-red-500 font-mono bg-red-50 p-2 rounded mr-7">
                        ⚠️ {r.lastError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
