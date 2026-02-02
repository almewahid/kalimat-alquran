import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Users, Search, Trash2, Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ManageGroups() {
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const groupsPerPage = 15;

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [searchTerm, groups]);

  const checkAdminAndLoad = async () => {
    try {
      const user = await supabaseClient.auth.me();
      setIsAdmin(user.role === "admin");
      
      if (user.role === "admin") {
        const allGroups = await supabaseClient.entities.Group.list("-created_date", 1000);
        setGroups(allGroups);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterGroups = () => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const filtered = groups.filter(g =>
        g.name?.toLowerCase().includes(term) ||
        g.leader_email?.toLowerCase().includes(term) ||
        g.join_code?.toLowerCase().includes(term)
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة؟")) return;
    
    try {
      await supabaseClient.entities.Group.delete(id);
      toast({ title: "✅ تم حذف المجموعة" });
      checkAdminAndLoad();
    } catch (error) {
      toast({ title: "❌ فشل الحذف", variant: "destructive" });
    }
  };

  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * groupsPerPage,
    currentPage * groupsPerPage
  );

  const totalPages = Math.ceil(filteredGroups.length / groupsPerPage);

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
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة المجموعات</h1>
            <p className="text-foreground/70">عرض وإدارة جميع المجموعات</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  placeholder="ابحث بالاسم، البريد، أو كود الانضمام..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Badge variant="outline">{filteredGroups.length} مجموعة</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-right">
                    <th className="p-4 font-medium">اسم المجموعة</th>
                    <th className="p-4 font-medium">الرئيس</th>
                    <th className="p-4 font-medium">الأعضاء</th>
                    <th className="p-4 font-medium">كود الانضمام</th>
                    <th className="p-4 font-medium">تاريخ الإنشاء</th>
                    <th className="p-4 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGroups.map((group) => (
                    <tr key={group.id} className="border-b hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-medium">{group.name}</td>
                      <td className="p-4 text-sm text-foreground/70">{group.leader_email}</td>
                      <td className="p-4">
                        <Badge variant="secondary">{group.members?.length || 0} عضو</Badge>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{group.join_code}</code>
                      </td>
                      <td className="p-4 text-sm text-foreground/70">
                        {new Date(group.created_date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link to={createPageUrl(`GroupDetail?id=${group.id}`)}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(group.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t">
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}