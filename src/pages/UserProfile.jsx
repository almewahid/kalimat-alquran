import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Award, BookOpen, Star, Trophy, Calendar, MapPin, Phone, Building2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ShareButton from "@/components/common/ShareButton";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const createPageUrl = (pageName) => `/${pageName}`;

export default function UserProfile() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: "",
    country: "",
    affiliation: "",
    affiliation_type: "individual"
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      
      // Initialize form with existing data (custom fields are flattened on user object by Base44 SDK usually, 
      // or we might need to check if they come from a separate call if they were just added to schema)
      setProfileForm({
        phone: currentUser.phone || "",
        country: currentUser.country || "",
        affiliation: currentUser.affiliation || "",
        affiliation_type: currentUser.affiliation_type || "individual"
      });

      const [progressData] = await supabaseClient.entities.UserProgress.filter({ 
        user_email: currentUser.email 
      });
      setUserProgress(progressData);

      const certs = await supabaseClient.entities.Certificate.filter({
        user_email: currentUser.email
      });
      setCertificates(certs);

    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await supabaseClient.auth.updateMe(profileForm);
      toast({ title: "✅ تم تحديث الملف الشخصي بنجاح" });
      setIsEditing(false);
      // Refresh user data locally
      setUser(prev => ({ ...prev, ...profileForm }));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "❌ حدث خطأ أثناء التحديث", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <div className="p-6 text-center">يرجى تسجيل الدخول</div>;

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-6 items-center bg-card p-8 rounded-xl shadow-sm border"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <User className="w-12 h-12" />
        </div>
        <div className="text-center md:text-right flex-1">
          <h1 className="text-3xl font-bold">{user.full_name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          
          {/* Info Badges */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            {user.country && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {user.country}
              </Badge>
            )}
            {user.affiliation && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {user.affiliation}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              المستوى {userProgress?.current_level || 1}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {userProgress?.total_xp || 0} XP
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
            <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "إلغاء التعديل" : "تعديل البيانات"}
            </Button>
            <ShareButton 
              title="إحصائياتي في كلمات القرآن" 
              text={`لقد تعلمت ${userProgress?.words_learned || 0} كلمة ووصلت للمستوى ${userProgress?.current_level || 1}!`} 
            />
        </div>
      </motion.div>

      {/* Edit Profile Form */}
      {isEditing && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
                <CardHeader><CardTitle>البيانات الشخصية</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>رقم الهاتف</Label>
                            <div className="relative">
                                <Phone className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input className="pr-9" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="رقم الهاتف" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>البلد</Label>
                            <div className="relative">
                                <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input className="pr-9" value={profileForm.country} onChange={e => setProfileForm({...profileForm, country: e.target.value})} placeholder="البلد" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>نوع الانتساب</Label>
                            <Select value={profileForm.affiliation_type} onValueChange={v => setProfileForm({...profileForm, affiliation_type: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر النوع" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">فردي (مستقل)</SelectItem>
                                    <SelectItem value="nursery">حضانة</SelectItem>
                                    <SelectItem value="school">مدرسة</SelectItem>
                                    <SelectItem value="association">جمعية تحفيظ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>اسم الجهة (إن وجد)</Label>
                            <div className="relative">
                                <Building2 className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input className="pr-9" value={profileForm.affiliation} onChange={e => setProfileForm({...profileForm, affiliation: e.target.value})} placeholder="اسم الحضانة أو الجمعية" disabled={profileForm.affiliation_type === 'individual'} />
                            </div>
                        </div>
                    </div>
                    <Button className="mt-4 w-full md:w-auto" onClick={handleUpdateProfile}>
                        <Save className="w-4 h-4 ml-2" /> حفظ التغييرات
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              التعلم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userProgress?.words_learned || 0}</div>
            <p className="text-muted-foreground">كلمة تم تعلمها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              سلسلة النجاح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userProgress?.quiz_streak || 0}</div>
            <p className="text-muted-foreground">اختبار متتالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              الاستمرارية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userProgress?.consecutive_login_days || 0}</div>
            <p className="text-muted-foreground">أيام متتالية</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          الشهادات والإنجازات
        </h2>
        
        {certificates.length === 0 ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لم تحصل على أي شهادات بعد. أكمل الدورات للحصول عليها!</p>
              <Button variant="link" asChild className="mt-2">
                <Link to={createPageUrl("Courses")}>تصفح الدورات</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map(cert => (
              <Card key={cert.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{cert.course_title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    تاريخ الإصدار: {new Date(cert.issue_date).toLocaleDateString('ar-SA')}
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/CertificateView?id=${cert.id}`} target="_blank">
                      عرض الشهادة
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}