import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Smartphone, Info, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AppVersionTracking() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [versionStats, setVersionStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSettings();
    loadUsersCount();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await supabaseClient.entities.AppSettings.filter({
        key: 'track_app_version'
      });
      if (settings.length === 0) {
        await supabaseClient.entities.AppSettings.create({ 
          key: 'track_app_version', 
          value: false 
        });
        setTrackingEnabled(false);
      } else {
        setTrackingEnabled(settings[0].value);
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
      toast({ title: "خطأ", description: "فشل في تحميل الإعدادات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadUsersCount = async () => {
    try {
      const users = await supabaseClient.entities.AppUsersVersion.list();
      setUsersCount(users.length);
      setUsers(users);
      const stats = users.reduce((acc, user) => {
        const key = `${user.app_version}-${user.platform}`;
        if (!acc[key]) {
          acc[key] = { app_version: user.app_version, platform: user.platform, count: 0, users: [] };
        }
        acc[key].count++;
        acc[key].users.push({ email: user.email, full_name: user.full_name, updated_at: user.updated_at });
        return acc;
      }, {});
      setVersionStats(Object.values(stats));
    } catch (error) {
      console.error('Error loading users count:', error);
    }
  };

  const toggleTracking = async () => {
    setUpdating(true);
    try {
      const newValue = !trackingEnabled;
      const settings = await supabaseClient.entities.AppSettings.filter({ key: 'track_app_version' });
      if (settings.length > 0) {
        await supabaseClient.entities.AppSettings.update(settings[0].id, { value: newValue });
      }
      setTrackingEnabled(newValue);
      toast({
        title: newValue ? "✅ تم التفعيل" : "⏸️ تم الإيقاف",
        description: newValue ? "تم تفعيل تتبع نسخة التطبيق" : "تم إيقاف تتبع نسخة التطبيق",
        duration: 3000
      });
    } catch (error) {
      console.error('Error toggling tracking:', error);
      toast({ title: "خطأ", description: "فشل في تحديث الإعداد", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const filteredStats = versionStats
    .filter(s => selectedVersion === 'all' || s.app_version === selectedVersion)
    .map(s => ({
      ...s,
      users: s.users.filter(u =>
        !searchQuery ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(s => s.users.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Smartphone className="w-8 h-8 text-primary" />
          تتبع نسخة التطبيق
        </h1>
        <p className="text-muted-foreground">تحكم في تفعيل أو تعطيل تتبع نسخ التطبيق للمستخدمين</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">حالة التتبع</CardTitle>
              <CardDescription className="mt-2">
                {trackingEnabled 
                  ? "التتبع مُفعّل حالياً - سيتم تسجيل نسخ التطبيق للمستخدمين"
                  : "التتبع معطّل حالياً - لن يتم تسجيل أي بيانات"}
              </CardDescription>
            </div>
            <Badge variant={trackingEnabled ? "default" : "secondary"} className="text-lg px-4 py-2 flex items-center gap-2">
              {trackingEnabled ? (<><CheckCircle className="w-5 h-5" />مُفعّل</>) : (<><XCircle className="w-5 h-5" />معطّل</>)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${trackingEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {trackingEnabled ? "تتبع نسخة التطبيق نشط" : "تتبع نسخة التطبيق متوقف"}
                </h3>
                <p className="text-sm text-muted-foreground">انقر على المفتاح للتبديل</p>
              </div>
            </div>
            <Switch checked={trackingEnabled} onCheckedChange={toggleTracking} disabled={updating} className="scale-150" />
          </div>
          {updating && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              جارٍ التحديث...
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>الإحصائيات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد المستخدمين المسجلين</p>
                  <p className="text-2xl font-bold text-blue-600">{usersCount}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">حالة النظام</p>
                  <p className="text-2xl font-bold text-purple-600">{trackingEnabled ? "يعمل" : "متوقف"}</p>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => { loadSettings(); loadUsersCount(); }} variant="outline" className="w-full mt-4">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث البيانات
          </Button>
        </CardContent>
      </Card>

      {versionStats.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>تفاصيل الإصدارات</CardTitle>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="بحث بالاسم أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm bg-background flex-1"
                />
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="all">كل الإصدارات</option>
                  {[...new Set(versionStats.map(s => s.app_version))].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStats.map((stat, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-lg">{stat.app_version}</Badge>
                      <Badge variant="secondary">
                        {stat.platform === 'web' ? '🌐 ويب' : 
                         stat.platform === 'android' ? '📱 أندرويد' : 
                         stat.platform === 'ios' ? '🍎 iOS' : stat.platform}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{stat.count} مستخدم</span>
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-primary hover:underline">
                      عرض المستخدمين ({stat.users.length})
                    </summary>
                    <div className="mt-3 space-y-2 bg-muted p-3 rounded">
                      {stat.users.map((user, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{user.full_name}</span>
                            <span className="text-muted-foreground ml-2">({user.email})</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.updated_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>ملاحظة:</strong> عند تفعيل التتبع، سيتم تسجيل نسخة التطبيق تلقائياً لكل مستخدم يقوم بتسجيل الدخول.
          يتم حفظ البيانات في جدول <code className="bg-muted px-1 py-0.5 rounded">app_users_version</code>.
        </AlertDescription>
      </Alert>
    </div>
  );
}