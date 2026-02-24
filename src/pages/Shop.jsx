import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Gem, Crown, Sparkles, Check, Lock, Loader2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const SHOP_ITEMS = {
  themes: [
    { id: "theme_ocean",  name: "المحيط الأزرق",      price: 100, icon: "🌊", preview: "from-blue-400 to-cyan-500"    },
    { id: "theme_sunset", name: "غروب الشمس",          price: 120, icon: "🌅", preview: "from-orange-400 to-pink-500"  },
    { id: "theme_forest", name: "الغابة الخضراء",      price: 100, icon: "🌲", preview: "from-green-500 to-emerald-600"},
    { id: "theme_galaxy", name: "المجرة البنفسجية",    price: 150, icon: "🌌", preview: "from-purple-600 to-indigo-700"},
  ],
  backgrounds: [
    { id: "bg_stars",    name: "نجوم لامعة",   price: 50,  icon: "⭐", preview: "from-slate-800 to-indigo-900" },
    { id: "bg_clouds",   name: "سحب بيضاء",    price: 40,  icon: "☁️", preview: "from-sky-200 to-blue-100"    },
    { id: "bg_gradient", name: "تدرج ملون",     price: 60,  icon: "🎨", preview: "from-violet-500 to-purple-700"},
  ],
  frames: [
    { id: "frame_gold",   name: "إطار ذهبي",   price: 200, icon: "👑", rarity: "legendary" },
    { id: "frame_silver", name: "إطار فضي",    price: 150, icon: "🥈", rarity: "epic"      },
    { id: "frame_bronze", name: "إطار برونزي", price: 100, icon: "🥉", rarity: "rare"      },
  ],
  powerups: [
    { id: "powerup_double_xp",    name: "مضاعفة النقاط",        price: 75, icon: "⚡", detail: "لمدة ساعة كاملة"         },
    { id: "powerup_freeze_time",  name: "تجميد الوقت",          price: 50, icon: "⏰", detail: "10 أسئلة"                },
    { id: "powerup_hint",         name: "تلميح ذكي",            price: 60, icon: "💡", detail: "5 استخدامات"             },
  ],
};

const CATEGORY_CONFIG = {
  themes:      { bar: "from-blue-500 to-cyan-500",    icon: "from-blue-500 to-cyan-500",    label: "🎨 الثيمات"   },
  backgrounds: { bar: "from-orange-500 to-amber-500", icon: "from-orange-500 to-amber-500", label: "🌅 الخلفيات"  },
  frames:      { bar: "from-amber-500 to-yellow-500", icon: "from-amber-500 to-yellow-500", label: "👑 الإطارات"  },
  powerups:    { bar: "from-red-500 to-pink-500",     icon: "from-red-500 to-pink-500",     label: "⚡ القوى"     },
};

const RARITY_CONFIG = {
  legendary: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", label: "🌟 أسطوري" },
  epic:      { bg: "bg-purple-50 dark:bg-purple-950/20",text: "text-purple-700 dark:text-purple-400",label: "💎 ملحمي" },
  rare:      { bg: "bg-blue-50 dark:bg-blue-950/20",   text: "text-blue-700 dark:text-blue-400",   label: "⭐ نادر"   },
};

// ── مكوّن بطاقة العنصر ──────────────────────────────────────────────────────
function ShopItemCard({ item, category, purchased, affordable, userGems, onPurchase, index }) {
  const cfg = CATEGORY_CONFIG[category];
  const rarityConf = item.rarity ? RARITY_CONFIG[item.rarity] : null;
  const needed = item.price - (userGems?.current_gems || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`overflow-hidden shadow-md hover:shadow-xl transition-all min-h-[200px] ${purchased ? "border-2 border-green-400" : ""}`}>
        <div className={`h-4 bg-gradient-to-r ${purchased ? "from-green-500 to-emerald-500" : cfg.bar}`} />

        <CardContent className="p-5">
          {/* الأيقونة + الاسم */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${purchased ? "from-green-500 to-emerald-500" : cfg.icon} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-2xl">{purchased ? "✅" : item.icon}</span>
            </div>
            <div>
              <h3 className="font-bold text-base">{item.name}</h3>
              {rarityConf && (
                <Badge className={`text-xs border-0 mt-1 ${rarityConf.bg} ${rarityConf.text}`}>
                  {rarityConf.label}
                </Badge>
              )}
              {item.detail && (
                <p className="text-xs text-foreground/60 mt-0.5">{item.detail}</p>
              )}
            </div>
          </div>

          {/* معاينة الثيم / الخلفية */}
          {item.preview && (
            <div className={`w-full h-12 rounded-xl mb-4 bg-gradient-to-r ${item.preview}`} />
          )}

          {/* السعر + زر الشراء */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5">
              <Gem className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-700 dark:text-amber-400">{item.price}</span>
            </div>

            {purchased ? (
              <Button size="sm" variant="outline" disabled className="rounded-xl gap-1 border-green-400 text-green-600">
                <Check className="w-4 h-4" /> مشترى
              </Button>
            ) : affordable ? (
              <Button
                size="sm"
                onClick={() => onPurchase(item, category.replace(/s$/, ""))}
                className={`bg-gradient-to-r ${cfg.bar} hover:opacity-90 text-white border-0 rounded-xl`}
              >
                شراء 🛍️
              </Button>
            ) : (
              <div className="text-right">
                <p className="text-xs text-red-500 font-medium">
                  💎 تحتاج {needed} أكثر
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── الصفحة الرئيسية ────────────────────────────────────────────────────────
export default function Shop() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [userGems, setUserGems] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);

      let [gems] = await supabaseClient.entities.UserGems.filter({
        user_email: currentUser.email,
      });
      if (!gems) {
        gems = await supabaseClient.entities.UserGems.create({
          user_email: currentUser.email,
          total_gems: 0,
          current_gems: 0,
          gems_spent: 0,
        });
      }
      setUserGems(gems);

      const userPurchases = await supabaseClient.entities.UserPurchase.filter({
        user_email: currentUser.email,
      });
      setPurchases(userPurchases);
    } catch (error) {
      console.error("Error loading shop data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPurchased = (itemId) => purchases.some((p) => p.item_id === itemId);
  const canAfford = (price) => userGems && userGems.current_gems >= price;

  const handlePurchase = async (item, itemType) => {
    if (isPurchased(item.id)) {
      toast({ title: "ℹ️ تملكه بالفعل" });
      return;
    }
    if (!canAfford(item.price)) {
      toast({
        title: "💎 جواهر غير كافية",
        description: `تحتاج ${item.price - userGems.current_gems} جوهرة إضافية`,
        variant: "destructive",
      });
      return;
    }
    try {
      await supabaseClient.entities.UserPurchase.create({
        user_email: user.email,
        item_type: itemType,
        item_id: item.id,
        item_name: item.name,
        price_gems: item.price,
        is_active: true,
      });
      await supabaseClient.entities.UserGems.update(userGems.id, {
        current_gems: userGems.current_gems - item.price,
        gems_spent: (userGems.gems_spent || 0) + item.price,
      });
      toast({
        title: "🎉 تم الشراء!",
        description: `اشتريت ${item.name} بنجاح!`,
        className: "bg-green-100 text-green-800",
      });
      loadShopData();
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({ title: "❌ فشل الشراء", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="text-foreground/60">جارٍ تحميل المتجر...</p>
      </div>
    );
  }

  const tabCategories = ["themes", "backgrounds", "frames", "powerups"];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── الهيدر ── */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">المتجر</h1>
          <p className="text-foreground/70">اشترِ عناصر رائعة بالجواهر التي كسبتها</p>
        </div>

        {/* ── رصيد الجواهر ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="overflow-hidden shadow-md max-w-xs mx-auto">
            <div className="h-4 bg-gradient-to-r from-amber-500 to-yellow-500" />
            <CardContent className="p-4 flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {userGems?.current_gems || 0}
                </p>
                <p className="text-sm text-foreground/60">جواهرك الحالية 💎</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── التبويبات ── */}
        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {tabCategories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabCategories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SHOP_ITEMS[category].map((item, index) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    category={category}
                    purchased={isPurchased(item.id)}
                    affordable={canAfford(item.price)}
                    userGems={userGems}
                    onPurchase={handlePurchase}
                    index={index}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
}
