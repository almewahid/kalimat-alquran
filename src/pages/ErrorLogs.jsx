import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, RefreshCw, Trash2, Copy, ChevronDown, ChevronUp, Bug, Search, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ErrorLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterContext, setFilterContext] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetching more logs to allow better client-side filtering
      const data = await base44.entities.ErrorLog.list("-timestamp", 100);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    try {
      await base44.entities.ErrorLog.delete(id);
      setLogs(logs.filter(l => l.id !== id));
    } catch (error) {
      alert("فشل الحذف");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm("تحذير: هل أنت متأكد من حذف جميع السجلات الظاهرة؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    setDeleteLoading(true);
    try {
      // Delete visible logs one by one (safer with current SDK)
      const idsToDelete = filteredLogs.map(l => l.id);
      await Promise.all(idsToDelete.map(id => base44.entities.ErrorLog.delete(id)));
      
      setLogs(logs.filter(l => !idsToDelete.includes(l.id)));
      alert("تم حذف السجلات بنجاح");
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    alert("تم نسخ التفاصيل");
  };

  const toggleLog = (id) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.error_message && log.error_message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.error_details && log.error_details.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesContext = filterContext === "all" || log.context === filterContext;
    
    return matchesSearch && matchesContext;
  });

  const uniqueContexts = [...new Set(logs.map(l => l.context))];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
              <div className="bg-red-100 p-2 rounded-xl">
                <Bug className="w-8 h-8 text-red-600" />
              </div>
              سجل الأخطاء
            </h1>
            <p className="text-slate-500 mt-2 mr-1">متابعة وتشخيص أخطاء النظام التقنية</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleBulkDelete} 
              variant="destructive" 
              disabled={deleteLoading || filteredLogs.length === 0}
              className="shadow-sm gap-2"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              حذف الكل
            </Button>
            <Button onClick={fetchLogs} variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </header>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="بحث في الرسالة، البريد، أو التفاصيل..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-9"
                />
            </div>
            
            <Select value={filterContext} onValueChange={setFilterContext}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="تصفية حسب السياق" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل السياقات</SelectItem>
                    {uniqueContexts.map(ctx => (
                        <SelectItem key={ctx} value={ctx}>{ctx}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="text-sm text-slate-500 whitespace-nowrap">
                النتائج: <strong>{filteredLogs.length}</strong>
            </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-slate-500">جاري تحميل السجلات...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLogs.length === 0 ? (
              <Card className="bg-white border-dashed border-2 py-12 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${searchTerm ? 'bg-slate-100' : 'bg-green-100'}`}>
                  {searchTerm ? <Search className="w-8 h-8 text-slate-400" /> : <CheckCircle className="w-8 h-8 text-green-600" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                    {searchTerm ? "لا توجد نتائج مطابقة" : "السجل نظيف!"}
                </h3>
                <p className="text-slate-500">
                    {searchTerm ? "جرب البحث بكلمات مختلفة" : "لا توجد أخطاء مسجلة حالياً."}
                </p>
                {searchTerm && (
                    <Button variant="link" onClick={() => {setSearchTerm(""); setFilterContext("all");}}>
                        مسح الفلتر
                    </Button>
                )}
              </Card>
            ) : (
              filteredLogs.map((log) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 border-r-4 ${
                      expandedLog === log.id ? 'shadow-md ring-1 ring-primary/5' : 'hover:shadow-sm'
                    } ${
                      log.context.includes('Audio') ? 'border-r-blue-500' : 'border-r-red-500'
                    }`}
                    onClick={() => toggleLog(log.id)}
                  >
                    <CardContent className="p-0">
                      <div className="p-5 flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-lg shrink-0 ${log.context.includes('Audio') ? 'bg-blue-100' : 'bg-red-100'}`}>
                          <AlertTriangle className={`w-5 h-5 ${log.context.includes('Audio') ? 'text-blue-600' : 'text-red-600'}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 dir-ltr font-mono text-xs">
                              {log.context}
                            </Badge>
                            <span className="text-xs text-slate-400 flex items-center dir-ltr font-mono">
                              {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 leading-snug mb-1 dir-auto">
                            {log.error_message}
                          </h3>
                          <p className="text-sm text-slate-500 truncate dir-ltr font-mono">
                            {log.user_email}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleDelete(log.id, e)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {expandedLog === log.id ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedLog === log.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                          >
                            <div className="p-5 pt-2 space-y-4" dir="ltr">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Error Details</h4>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => copyToClipboard(log.error_details, e)}
                                  className="h-6 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Copy className="w-3 h-3" /> Copy JSON
                                </Button>
                              </div>
                              
                              {log.error_details && (
                                <div className="relative group/code">
                                  <ScrollArea className="h-full max-h-[300px] w-full rounded-lg border border-slate-200 bg-slate-950 shadow-inner">
                                    <pre className="p-4 text-xs font-mono leading-relaxed text-emerald-400 whitespace-pre-wrap break-all">
                                      {(() => {
                                        try {
                                          const parsed = JSON.parse(log.error_details);
                                          return JSON.stringify(parsed, null, 2);
                                        } catch {
                                          return log.error_details;
                                        }
                                      })()}
                                    </pre>
                                  </ScrollArea>
                                </div>
                              )}

                              {log.additional_data && (
                                <div>
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Additional Context</h4>
                                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-600">
                                    {JSON.stringify(log.additional_data, null, 2)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}