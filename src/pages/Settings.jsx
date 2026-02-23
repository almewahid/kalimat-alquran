import React, { useState, useEffect } from "react";
import { supabaseClient, supabase } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { User as UserIcon, Palette, Bell, Shield, HelpCircle, Globe, Volume2, Sparkles, Eye, EyeOff, GripVertical, BookMarked, BookOpen, Download, Zap } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SURAHS = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

export default function Settings() {
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [preferences, setPreferences] = useState({
        sound_effects_enabled: true,
        animations_enabled: true,
        confetti_enabled: true,
        theme: 'light',
        color_scheme: 'default',
        background_style: 'soft',
        learning_level: 'مبتدئ', // ✅ الافتراضي مبتدئ
        learning_categories: [],
        daily_new_words_goal: 10,
        daily_review_words_goal: 20,
        quiz_time_limit: 30, // Added quiz_time_limit
        source_type: 'all',
        selected_juz: [],
        selected_surahs: [],
        language: 'ar',
        word_card_elements: [
          {id: "meaning", label: "المعنى", visible: true, order: 0},
          {id: "alternative_meanings", label: "معانٍ بديلة", visible: true, order: 1},
          {id: "root", label: "الجذر", visible: true, order: 2},
          {id: "context", label: "السياق القرآني", visible: true, order: 3},
          {id: "example", label: "مثال الاستخدام", visible: true, order: 4},
          {id: "reflection", label: "سؤال للتفكير", visible: true, order: 5},
          {id: "similar_words", label: "كلمات مشابهة", visible: true, order: 6},
          {id: "learning_history", label: "تاريخ التعلم", visible: false, order: 7},
          {id: "image", label: "صورة توضيحية", visible: true, order: 8},
          {id: "note", label: "ملاحظتك", visible: true, order: 9}
        ]
    });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('account');
    const [smartAnalysis, setSmartAnalysis] = useState(null);

    useEffect(() => {
        if (activeTab !== 'notifications') return;

        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const [
                    { data: progress },
                    { data: sessions },
                ] = await Promise.all([
                    supabase
                        .from("user_progress")
                        .select("words_learned, consecutive_login_days, total_xp, last_quiz_date")
                        .eq("user_id", user.id)
                        .maybeSingle(),
                    supabase
                        .from("quiz_sessions")
                        .select("score, created_date")
                        .eq("user_id", user.id)
                        .order("created_date", { ascending: false })
                        .limit(30),
                ]);

                const alerts = [];

                // تحليل الاستمرارية
                const streak = progress?.consecutive_login_days || 0;
                if (streak >= 7) {
                    alerts.push(`🔥 رائع! حافظت على ${streak} يوماً متتالياً. فعّل الإشعار اليومي للحفاظ على هذا الإنجاز.`);
                } else if (streak === 0) {
                    alerts.push("⚠️ لم تدرس منذ فترة. فعّل تذكير يومي لمساعدتك على الاستمرار.");
                } else {
                    alerts.push(`📅 تتابعك الحالي ${streak} أيام. فعّل الإشعارات للوصول إلى 7 أيام متتالية.`);
                }

                // تحليل وقت آخر كويز
                const lastQuizDate = progress?.last_quiz_date;
                if (lastQuizDate) {
                    const daysSince = Math.floor((Date.now() - new Date(lastQuizDate)) / 86400000);
                    if (daysSince >= 3) {
                        alerts.push(`📚 مضى ${daysSince} أيام على آخر اختبار. نوصي بتفعيل إشعار المراجعة الدورية.`);
                    }
                }

                // تحليل دقة الكويز
                const sessionList = sessions || [];
                if (sessionList.length > 0) {
                    const avgScore = Math.round(sessionList.reduce((s, q) => s + (q.score || 0), 0) / sessionList.length);
                    if (avgScore < 60) {
                        alerts.push(`💡 متوسط دقتك ${avgScore}%. فعّل إشعارات المراجعة الذكية لتحسين أدائك.`);
                    } else if (avgScore >= 85) {
                        alerts.push(`✅ دقتك ${avgScore}% ممتازة! يمكنك تقليل تكرار الإشعارات والاكتفاء بتذكير يومي واحد.`);
                    }

                    // تحليل أوقات النشاط
                    const hours = sessionList.map(s => new Date(s.created_date).getHours());
                    const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
                    const period = avgHour < 12 ? "الصباح" : avgHour < 17 ? "بعد الظهر" : "المساء";
                    alerts.push(`🕐 معظم جلساتك في ${period}. نوصي بضبط إشعاراتك حول الساعة ${avgHour}:00.`);
                } else {
                    alerts.push("🚀 لم تبدأ أي اختبار بعد. فعّل الإشعارات لتذكيرك ببدء رحلة التعلم.");
                }

                if (alerts.length > 0) {
                    setSmartAnalysis({ smartAlerts: alerts });
                }
            } catch (e) {
                console.error("analyzeUserBehavior error:", e);
            }
        })();
    }, [activeTab]);

    // Get current language
    const lang = preferences.language || 'ar';
    const isArabic = lang === 'ar';

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabaseClient.auth.me();
                setUser(currentUser);
                if (currentUser.preferences) {
                    const fetchedPreferences = currentUser.preferences;
                    const defaultWordCardElements = preferences.word_card_elements;
                    
                    const mergedWordCardElements = defaultWordCardElements.map(defaultEl => {
                        const existingEl = fetchedPreferences.word_card_elements?.find(el => el.id === defaultEl.id);
                        return existingEl ? { ...defaultEl, ...existingEl } : defaultEl;
                    });

                    const newElements = fetchedPreferences.word_card_elements
                        ?.filter(el => !defaultWordCardElements.some(defaultEl => defaultEl.id === el.id)) || [];

                    const finalWordCardElements = [...mergedWordCardElements, ...newElements].sort((a, b) => a.order - b.order);

                    setPreferences(prev => ({
                        ...prev,
                        ...fetchedPreferences,
                        word_card_elements: finalWordCardElements
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handlePreferenceChange = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const handleJuzSelection = (juz) => {
        const juzNumber = parseInt(juz);
        setPreferences(prev => ({
            ...prev,
            selected_juz: prev.selected_juz.includes(juzNumber)
                ? prev.selected_juz.filter(j => j !== juzNumber)
                : [...prev.selected_juz, juzNumber]
        }));
    };

    const handleSurahSelection = (surah) => {
        setPreferences(prev => ({
            ...prev,
            selected_surahs: prev.selected_surahs.includes(surah)
                ? prev.selected_surahs.filter(s => s !== surah)
                : [...prev.selected_surahs, surah]
        }));
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        try {
            // تحديث بيانات المستخدم الأساسية
            await supabaseClient.auth.updateMe({ 
                phone_number: user.phone_number,
                country: user.country,
                affiliation_type: user.affiliation_type,
                affiliation: user.affiliation,
                preferences: preferences
            });

            // حفظ المستوى في جدول user_profiles
            const authUser = await supabaseClient.auth.me();
            if (authUser) {
                await supabaseClient.supabase
                    .from('user_profiles')
                    .update({ preferences: preferences })
                    .eq('user_id', authUser.id);
            }

            toast({
                title: isArabic ? "✅ تم الحفظ!" : "✅ Saved!",
                description: isArabic ? "تم حفظ تفضيلاتك بنجاح." : "Your preferences have been saved successfully.",
                className: "bg-green-100 text-green-800"
            });

            // تحديث الحالة المحلية
            setUser(prev => ({ ...prev, preferences }));
            
            setTimeout(() => window.location.reload(), 800);
        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast({
                title: isArabic ? "❌ خطأ" : "❌ Error",
                description: isArabic ? "لم يتم حفظ التفضيلات. حاول مرة أخرى." : "Failed to save preferences. Try again.",
                variant: "destructive"
            });
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(preferences.word_card_elements);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index
        }));

        handlePreferenceChange('word_card_elements', updatedItems);
    };

    const toggleElementVisibility = (id) => {
        const updatedElements = preferences.word_card_elements.map(el =>
            el.id === id ? { ...el, visible: !el.visible } : el
        );
        handlePreferenceChange('word_card_elements', updatedElements);
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="fullName">{isArabic ? "الاسم الكامل" : "Full Name"}</Label>
                            <Input id="fullName" value={user?.full_name || ''} disabled />
                        </div>
                        <div>
                            <Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email"}</Label>
                            <Input id="email" type="email" value={user?.email || ''} disabled />
                        </div>
                        <div>
                            <Label htmlFor="phone">{isArabic ? "رقم الهاتف" : "Phone Number"}</Label>
                            <Input 
                                id="phone" 
                                type="tel" 
                                value={user?.phone_number || ''} 
                                onChange={(e) => setUser({...user, phone_number: e.target.value})}
                                placeholder={isArabic ? "أدخل رقم الهاتف" : "Enter phone number"}
                            />
                        </div>
                        <div>
                            <Label htmlFor="country">{isArabic ? "البلد" : "Country"}</Label>
                            <Input 
                                id="country" 
                                value={user?.country || ''} 
                                onChange={(e) => setUser({...user, country: e.target.value})}
                                placeholder={isArabic ? "أدخل البلد" : "Enter country"}
                            />
                        </div>
                        <div>
                            <Label htmlFor="affiliation_type">{isArabic ? "نوع الانتماء" : "Affiliation Type"}</Label>
                            <Select
                                value={user?.affiliation_type || ""}
                                onValueChange={(value) => setUser({...user, affiliation_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isArabic ? "اختر النوع" : "Select Type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nursery">{isArabic ? "حضانة" : "Nursery"}</SelectItem>
                                    <SelectItem value="school">{isArabic ? "مدرسة" : "School"}</SelectItem>
                                    <SelectItem value="institute">{isArabic ? "معهد" : "Institute"}</SelectItem>
                                    <SelectItem value="organization">{isArabic ? "مؤسسة" : "Organization"}</SelectItem>
                                    <SelectItem value="association">{isArabic ? "جمعية" : "Association"}</SelectItem>
                                    <SelectItem value="individual">{isArabic ? "فردي" : "Individual"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="affiliation">{isArabic ? "اسم الانتماء" : "Affiliation Name"}</Label>
                            <Input 
                                id="affiliation" 
                                value={user?.affiliation || ''} 
                                onChange={(e) => setUser({...user, affiliation: e.target.value})}
                                placeholder={isArabic ? "اسم المدرسة/الجامعة/المؤسسة" : "Name of school/university/organization"}
                            />
                        </div>
                        <CardDescription>
                            {isArabic 
                                ? "معلومات الحساب الأساسية (الاسم والبريد) لا يمكن تعديلها. البيانات الأخرى يمكن تحديثها وسيتم حفظها عند الضغط على زر الحفظ في الأسفل."
                                : "Basic account info (name and email) cannot be edited. Other data can be updated and will be saved when you click Save Changes below."
                            }
                        </CardDescription>
                    </CardContent>
                );
            
            case 'appearance':
                return (
                    <CardContent className="space-y-6">
                        {/* Language Selection */}
                        <div>
                            <Label className="flex items-center gap-2 text-lg font-semibold">
                                <Globe className="w-5 h-5" />
                                {isArabic ? "🌍 اللغة" : "🌍 Language"}
                            </Label>
                            <p className="text-xs text-foreground/70 mb-3">
                                {isArabic ? "اختر لغة التطبيق (سيتم إعادة تحميل الصفحة)" : "Choose app language (page will reload)"}
                            </p>
                            <Select
                                value={preferences.language}
                                onValueChange={(value) => handlePreferenceChange('language', value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ar">
                                        <span className="flex items-center gap-2">
                                            🇸🇦 العربية
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="en">
                                        <span className="flex items-center gap-2">
                                            🇺🇸 English
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="border-t pt-6"></div>

                        {/* Font Size */}
                        <div>
                            <Label className="mb-2 block">{isArabic ? "حجم الخط" : "Font Size"}</Label>
                            <div className="flex items-center gap-4">
                                <span className="text-sm">A</span>
                                <input 
                                    type="range" 
                                    min="12" 
                                    max="24" 
                                    step="1" 
                                    className="w-full"
                                    value={preferences.fontSize || 16}
                                    onChange={(e) => handlePreferenceChange('fontSize', parseInt(e.target.value))}
                                />
                                <span className="text-xl">A</span>
                            </div>
                        </div>

                        <div className="border-t pt-6"></div>

                        {/* Dark Mode */}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                                <span>{isArabic ? "الوضع الليلي" : "Dark Mode"}</span>
                                <span className="text-xs font-normal leading-snug text-muted-foreground">
                                    {isArabic 
                                        ? "لتغيير مظهر التطبيق إلى داكن أو فاتح."
                                        : "Switch between dark and light theme."
                                    }
                                </span>
                            </Label>
                            <Switch
                                id="dark-mode"
                                checked={preferences.theme === 'dark'}
                                onCheckedChange={(checked) => handlePreferenceChange('theme', checked ? 'dark' : 'light')}
                            />
                        </div>

                        {/* Color Scheme */}
                        <div>
                            <Label>{isArabic ? "نظام الألوان" : "Color Scheme"}</Label>
                            <p className="text-xs text-foreground/70 mb-3">
                                {isArabic ? "اختر اللون الرئيسي للتطبيق" : "Choose the primary color for the app"}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'default', label: 'زمردي', labelEn: 'Emerald', preview: 'bg-emerald-600' },
                                    { value: 'blue', label: 'أزرق', labelEn: 'Blue', preview: 'bg-blue-500' },
                                    { value: 'purple', label: 'بنفسجي', labelEn: 'Purple', preview: 'bg-purple-600' },
                                    { value: 'orange', label: 'برتقالي', labelEn: 'Orange', preview: 'bg-orange-500' }
                                ].map(option => (
                                    <div
                                        key={option.value}
                                        onClick={() => handlePreferenceChange('color_scheme', option.value)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            preferences.color_scheme === option.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full ${option.preview} mb-2`}></div>
                                        <p className="font-medium text-sm">{isArabic ? option.label : option.labelEn}</p>
                                        {preferences.color_scheme === option.value && (
                                            <p className="text-xs text-primary mt-1">
                                                ✓ {isArabic ? "محدد" : "Selected"}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Effects & Animations */}
                        <div className="border-t pt-6">
                            <Label className="flex items-center gap-2 text-lg font-semibold mb-4">
                                <Sparkles className="w-5 h-5" />
                                {isArabic ? "✨ التأثيرات والرسوم المتحركة" : "✨ Effects & Animations"}
                            </Label>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-background-soft rounded-lg">
                                    <Label htmlFor="sound-effects" className="flex flex-col gap-1">
                                        <span className="flex items-center gap-2">
                                            <Volume2 className="w-4 h-4" />
                                            {isArabic ? "المؤثرات الصوتية" : "Sound Effects"}
                                        </span>
                                        <span className="text-xs font-normal text-muted-foreground">
                                            {isArabic 
                                                ? "تشغيل الأصوات عند الإجابة الصحيحة/الخاطئة"
                                                : "Play sounds on correct/wrong answers"
                                            }
                                        </span>
                                    </Label>
                                    <Switch
                                        id="sound-effects"
                                        checked={preferences.sound_effects_enabled}
                                        onCheckedChange={(checked) => handlePreferenceChange('sound_effects_enabled', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-background-soft rounded-lg">
                                    <Label htmlFor="confetti" className="flex flex-col gap-1">
                                        <span>🎉 {isArabic ? "احتفالات Confetti" : "Confetti Celebrations"}</span>
                                        <span className="text-xs font-normal text-muted-foreground">
                                            {isArabic 
                                                ? "إظهار احتفال عند رفع المستوى أو إنجاز"
                                                : "Show celebration on level up or achievement"
                                            }
                                        </span>
                                    </Label>
                                    <Switch
                                        id="confetti"
                                        checked={preferences.confetti_enabled}
                                        onCheckedChange={(checked) => handlePreferenceChange('confetti_enabled', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-background-soft rounded-lg">
                                    <Label htmlFor="animations" className="flex flex-col gap-1">
                                        <span>🌊 {isArabic ? "تأثير الموجة" : "Wave Effect"}</span>
                                        <span className="text-xs font-normal text-muted-foreground">
                                            {isArabic 
                                                ? "إظهار موجة عند الإجابة الصحيحة"
                                                : "Show wave on correct answer"
                                            }
                                        </span>
                                    </Label>
                                    <Switch
                                        id="animations"
                                        checked={preferences.animations_enabled}
                                        onCheckedChange={(checked) => handlePreferenceChange('animations_enabled', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                                💡 {isArabic 
                                    ? "سيتم تطبيق التغييرات بعد حفظها وإعادة تحميل الصفحة."
                                    : "Changes will be applied after saving and reloading the page."
                                }
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                );
            
            case 'notifications':
                return (
                    <CardContent className="space-y-6">
                        <Label className="text-lg font-semibold mb-4 block">
                            {isArabic ? "🔔 إعدادات الإشعارات" : "🔔 Notification Settings"}
                        </Label>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-background-soft rounded-lg">
                                <Label>{isArabic ? "تذكير المراجعة اليومي" : "Daily Review Reminder"}</Label>
                                <Switch 
                                    checked={preferences.notifications?.daily_review ?? true}
                                    onCheckedChange={(c) => handlePreferenceChange('notifications', { ...preferences.notifications, daily_review: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background-soft rounded-lg">
                                <Label>{isArabic ? "تحديثات المجموعات" : "Group Updates"}</Label>
                                <Switch 
                                    checked={preferences.notifications?.group_updates ?? true}
                                    onCheckedChange={(c) => handlePreferenceChange('notifications', { ...preferences.notifications, group_updates: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background-soft rounded-lg">
                                <Label>{isArabic ? "إنجازات جديدة" : "New Achievements"}</Label>
                                <Switch 
                                    checked={preferences.notifications?.achievements ?? true}
                                    onCheckedChange={(c) => handlePreferenceChange('notifications', { ...preferences.notifications, achievements: c })}
                                />
                            </div>

                            {/* Smart Notifications Section */}
                            <div className="mt-8 border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-yellow-500" />
                                            {isArabic ? "الإشعارات الذكية" : "Smart Notifications"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic ? "تحليلات وتوصيات مخصصة بناءً على نشاطك" : "Personalized insights based on your activity"}
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={preferences.notifications?.smart_enabled ?? true}
                                        onCheckedChange={(c) => handlePreferenceChange('notifications', { ...preferences.notifications, smart_enabled: c })}
                                    />
                                </div>

                                {preferences.notifications?.smart_enabled !== false && smartAnalysis && (
                                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl space-y-3">
                                        {smartAnalysis.smartAlerts?.map((alert, idx) => (
                                            <div key={idx} className="flex gap-3 text-sm">
                                                <span className="text-xl">🤖</span>
                                                <p className="leading-relaxed">{alert}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                );

            case 'learning':
                return (
                    <CardContent className="space-y-6">
                        <div>
                            <Label>{isArabic ? "مستوى الصعوبة" : "Difficulty Level"}</Label>
                            <Select
                                value={preferences.learning_level}
                                onValueChange={(value) => handlePreferenceChange('learning_level', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isArabic ? "اختر المستوى" : "Select Level"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="مبتدئ">
                                        {isArabic ? "مبتدئ (مبسط جدًا ومناسب للأطفال)" : "Beginner (Very simple and suitable for children)"}
                                    </SelectItem>
                                    <SelectItem value="متوسط">
                                        {isArabic ? "متوسط (معاني واضحة ومختصرة)" : "Intermediate (Clear and concise meanings)"}
                                    </SelectItem>
                                    <SelectItem value="متقدم">
                                        {isArabic ? "متقدم (معاني عميقة وتحليل لغوي)" : "Advanced (Deep meanings and linguistic analysis)"}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Label>{isArabic ? "هدف الكلمات الجديدة اليومي" : "Daily New Words Goal"}</Label>
                            <Input 
                                type="number" 
                                value={preferences.daily_new_words_goal} 
                                onChange={e => handlePreferenceChange('daily_new_words_goal', parseInt(e.target.value) || 0)} 
                                min="0" 
                            />
                        </div>
                        
                        <div>
                            <Label>{isArabic ? "هدف المراجعة اليومي" : "Daily Review Goal"}</Label>
                            <Input 
                                type="number" 
                                value={preferences.daily_review_words_goal} 
                                onChange={e => handlePreferenceChange('daily_review_words_goal', parseInt(e.target.value) || 0)} 
                                min="0" 
                            />
                        </div>

                        <div className="border-t pt-6">
                            <Label className="text-lg font-semibold mb-3 block">
                                ⏱️ {isArabic ? "إعدادات الاختبار" : "Quiz Settings"}
                            </Label>
                            
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="quiz-time" className="flex flex-col gap-1 mb-2">
                                        <span>{isArabic ? "مدة السؤال (بالثواني)" : "Question Time Limit (seconds)"}</span>
                                        <span className="text-xs font-normal text-muted-foreground">
                                            {isArabic 
                                                ? "اضبط 0 للاختبار بدون حد زمني"
                                                : "Set to 0 for unlimited time"
                                            }
                                        </span>
                                    </Label>
                                    <Input 
                                        id="quiz-time"
                                        type="number" 
                                        value={preferences.quiz_time_limit !== undefined ? preferences.quiz_time_limit : 60} 
                                        onChange={e => handlePreferenceChange('quiz_time_limit', parseInt(e.target.value) || 0)} 
                                        min="0"
                                        max="180"
                                        placeholder="60"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {(preferences.quiz_time_limit === 0 || preferences.quiz_time_limit === undefined)
                                            ? (isArabic ? "⏳ اختبار بدون حد زمني" : "⏳ Unlimited time quiz")
                                            : (isArabic ? `⏰ ${preferences.quiz_time_limit} ثانية لكل سؤال` : `⏰ ${preferences.quiz_time_limit} seconds per question`)
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                );
            
            case 'source':
                return (
                    <CardContent className="space-y-6">
                        <div>
                            <Label>{isArabic ? "مصدر الكلمات" : "Word Source"}</Label>
                            <Select
                                value={preferences.source_type}
                                onValueChange={(value) => handlePreferenceChange('source_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isArabic ? "اختر المصدر" : "Select Source"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? "جميع القرآن" : "Entire Quran"}</SelectItem>
                                    <SelectItem value="juz">{isArabic ? "حسب الأجزاء" : "By Juz"}</SelectItem>
                                    <SelectItem value="surah">{isArabic ? "حسب السور" : "By Surah"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {preferences.source_type === 'juz' && (
                            <div>
                                <Label>{isArabic ? "اختر الأجزاء" : "Select Juz"}</Label>
                                <div className="grid grid-cols-5 gap-2 mt-2">
                                    {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => (
                                        <Button
                                            key={juz}
                                            variant={preferences.selected_juz.includes(juz) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleJuzSelection(juz)}
                                            className="h-10"
                                        >
                                            {juz}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {preferences.source_type === 'surah' && (
                            <div>
                                <Label>{isArabic ? "اختر السور" : "Select Surahs"}</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                                    {SURAHS.map((surah, index) => (
                                        <Button
                                            key={surah}
                                            variant={preferences.selected_surahs.includes(surah) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleSurahSelection(surah)}
                                            className="justify-start text-sm"
                                        >
                                            {index + 1}. {surah}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                );

            case 'card-elements':
                return (
                    <CardContent className="space-y-6">
                        <div>
                            <Label className="text-lg font-semibold mb-2 block">
                                {isArabic ? "📝 عناصر بطاقة التعلم" : "📝 Learning Card Elements"}
                            </Label>
                            <p className="text-sm text-foreground/70 mb-4">
                                {isArabic 
                                    ? "اسحب لإعادة الترتيب، واضغط على العين لإخفاء/إظهار العنصر"
                                    : "Drag to reorder, click eye icon to show/hide element"
                                }
                            </p>
                        </div>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="word-card-elements">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2"
                                    >
                                        {preferences.word_card_elements
                                            .slice()
                                            .sort((a, b) => a.order - b.order)
                                            .map((element, index) => (
                                            <Draggable
                                                key={element.id}
                                                draggableId={element.id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`
                                                            flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                                                            ${snapshot.isDragging ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-background-soft'}
                                                            ${!element.visible ? 'opacity-50' : ''}
                                                            ${isArabic ? 'text-right' : 'text-left'}
                                                        `}
                                                    >
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="cursor-grab active:cursor-grabbing p-1"
                                                        >
                                                            <GripVertical className="w-5 h-5 text-foreground/40" />
                                                        </div>
                                                        
                                                        <div className="flex-1">
                                                            <p className="font-medium">{element.label}</p>
                                                            <p className="text-xs text-foreground/60">
                                                                {isArabic ? `الترتيب: ${index + 1}` : `Order: ${index + 1}`}
                                                            </p>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleElementVisibility(element.id)}
                                                            className={element.visible ? 'text-primary' : 'text-foreground/40'}
                                                        >
                                                            {element.visible ? (
                                                                <Eye className="w-5 h-5" />
                                                            ) : (
                                                                <EyeOff className="w-5 h-5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                                💡 {isArabic 
                                    ? "العناصر المخفية لن تظهر في بطاقات التعلم. يمكنك إعادة ترتيبها وإظهارها في أي وقت."
                                    : "Hidden elements won't appear in learning cards. You can reorder and show them anytime."
                                }
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                );

            case 'tafsir':
                return (
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <BookMarked className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-semibold text-primary">
                                {isArabic ? "إدارة التفاسير" : "Tafsir Management"}
                            </h3>
                        </div>

                        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 mb-4">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <AlertDescription className="text-blue-800 dark:text-blue-200">
                                <div className="font-bold mb-2">
                                    {isArabic ? "📥 تحميل التفاسير" : "📥 Download Tafsirs"}
                                </div>
                                <p className="text-sm mb-3">
                                    {isArabic
                                        ? "لاستخدام التفاسير في قارئ القرآن، يجب تحميلها أولاً من صفحة الاستيراد."
                                        : "To use Tafsirs in the Quran reader, you must first download them from the import page."}
                                </p>
                                <Link to={createPageUrl("ImportTafsir")}>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                                        <Download className="w-4 h-4" />
                                        {isArabic ? "انتقل لصفحة استيراد التفاسير" : "Go to Tafsir Import Page"}
                                    </Button>
                                </Link>
                            </AlertDescription>
                        </Alert>

                        <div className="p-4 bg-background-soft rounded-lg">
                            <h4 className="font-semibold mb-3 text-foreground">
                                {isArabic ? "التفاسير المتاحة للتحميل:" : "Available Tafsirs for Download:"}
                            </h4>
                            <ul className="space-y-2 text-sm text-foreground/80">
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {isArabic ? "تفسير القرطبي" : "Tafsir al-Qurtubi"}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {isArabic ? "تفسير ابن كثير" : "Tafsir Ibn Kathir"}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {isArabic ? "تفسير السعدي" : "Tafsir al-Sa'di"}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {isArabic ? "تفسير الجلالين" : "Tafsir al-Jalalayn"}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {isArabic ? "التفسير الميسر" : "Tafsir al-Muyassar"}
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                );
            
            default:
                return null;
        }
    }

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-primary">جارٍ تحميل الإعدادات...</p>
                </div>
            </div>
        );
    }

    const tabs = [
      { id: 'account', label: 'الحساب', icon: UserIcon },
      { id: 'appearance', label: 'المظهر', icon: Palette },
      { id: 'learning', label: 'التعلم', icon: Bell },
      { id: 'notifications', label: 'الإشعارات', icon: Bell },
      { id: 'source', label: 'مصدر الكلمات', icon: Shield },
      { id: 'card-elements', label: 'عناصر البطاقة', icon: HelpCircle },
      { id: 'tafsir', label: 'إدارة التفاسير', icon: BookMarked },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold gradient-text mb-8">
                    {isArabic ? "الإعدادات" : "Settings"}
                </h1>

                <div className="grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <div className="flex flex-col space-y-2">
                           {tabs.map(tab => (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="justify-start gap-2"
                                >
                                    <tab.icon className="w-4 h-4"/>
                                    {tab.label}
                                </Button>
                           ))}
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>{tabs.find(t => t.id === activeTab)?.label}</CardTitle>
                            </CardHeader>
                            {renderContent()}
                        </Card>
                         <div className="mt-6 flex justify-end">
                            <Button onClick={handleSaveChanges}>
                                {isArabic ? "💾 حفظ التغييرات" : "💾 Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}