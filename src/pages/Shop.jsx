import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Gem, Crown, Sparkles, Check, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

/**
 * 🛍️ صفحة المتجر (Shop)
 * 
 * 📍 أين تظهر: من القائمة الجانبية → "المتجر"
 * 🕐 متى تظهر: دائماً متاحة
 * 👥 لمن: جميع المستخدمين المسجلين
 * 💡 الفكرة: شراء ثيمات، خلفيات، إطارات، قوى خاصة بالجواهر المكتسبة
 */

const SHOP_ITEMS = {
  themes: [
    { id: "theme_ocean", name: "المحيط الأزرق", price: 100, icon: "🌊", preview: "bg-blue-500" },
    { id: "theme_sunset", name: "غروب الشمس", price: 120, icon: "🌅", preview: "bg-orange-500" },
    { id: "theme_forest", name: "الغابة الخضراء", price: 100, icon: "🌲", preview: "bg-green-600" },
    { id: "theme_galaxy", name: "المجرة البنفسجية", price: 150, icon: "🌌", preview: "bg-purple-600" },
  ],
  backgrounds: [
    { id: "bg_stars", name: "نجوم لامعة", price: 50, icon: "⭐", preview: "#1a1a2e" },
    { id: "bg_clouds", name: "سحب بيضاء", price: 40, icon: "☁️", preview: "#f0f8ff" },
    { id: "bg_gradient", name: "تدرج ملون", price: 60, icon: "🎨", preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  ],
  frames: [
    { id: "frame_gold", name: "إطار ذهبي", price: 200, icon: "👑", rarity: "legendary" },
    { id: "frame_silver", name: "إطار فضي", price: 150, icon: "🥈", rarity: "epic" },
    { id: "frame_bronze", name: "إطار برونزي", price: 100, icon: "🥉", rarity: "rare" },
  ],
  powerups: [
    { id: "powerup_double_xp", name: "مضاعفة XP - ساعة", price: 75, icon: "⚡", duration: "1 hour" },
    { id: "powerup_freeze_time", name: "تجميد الوقت - 10 أسئلة", price: 50, icon: "⏰", uses: 10 },
    { id: "powerup_hint", name: "تلميح ذكي - 5 استخدامات", price: 60, icon: "💡", uses: 5 },
  ]
};

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
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      let [gems] = await base44.entities.UserGems.filter({ user_email: currentUser.email });
      if (!gems) {
        gems = await base44.entities.UserGems.create({
          user_email: currentUser.email,
          total_gems: 0,
          current_gems: 0,
          gems_spent: 0
        });
      }
      setUserGems(gems);

      const userPurchases = await base44.entities.UserPurchase.filter({ user_email: currentUser.email });
      setPurchases(userPurchases);

    } catch (error) {
      console.error("Error loading shop data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPurchased = (itemId) => {
    return purchases.some(p => p.item_id === itemId);
  };

  const canAfford = (price) => {
    return userGems && userGems.current_gems >= price;
  };

  const handlePurchase = async (item, itemType) => {
    if (isPurchased(item.id)) {
      toast({
        title: "ℹ️ تملكه بالفعل",
        description: "لديك هذا العنصر بالفعل",
      });
      return;
    }

    if (!canAfford(item.price)) {
      toast({
        title: "❌ جواهر غير كافية",
        description: `تحتاج ${item.price} جوهرة، لديك ${userGems.current_gems}`,
        variant: "destructive"
      });
      return;
    }

    try {
      await base44.entities.UserPurchase.create({
        user_email: user.email,
        item_type: itemType,
        item_id: item.id,
        item_name: item.name,
        price_gems: item.price,
        is_active: true
      });

      const newGemsCount = userGems.current_gems - item.price;
      const newGemsSpent = userGems.gems_spent + item.price;
      
      await base44.entities.UserGems.update(userGems.id, {
        current_gems: newGemsCount,
        gems_spent: newGemsSpent
      });

      toast({
        title: "🎉 تم الشراء!",
        description: `اشتريت ${item.name} بنجاح!`,
        className: "bg-green-100 text-green-800"
      });

      loadShopData();

    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({
        title: "❌ فشل الشراء",
        description: "حدث خطأ، حاول مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "legendary": return "bg-amber-100 text-amber-700 border-amber-300";
      case "epic": return "bg-purple-100 text-purple-700 border-purple-300";
      case "rare": return "bg-blue-100 text-blue-700 border-blue-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">🛍️ المتجر</h1>
            <p className="text-foreground/70">اشترِ عناصر رائعة بالجواهر التي كسبتها</p>
          </div>
          <Card className="bg-gradient-to-r from-amber-100 to-amber-200 border-2 border-amber-300">
            <CardContent className="p-4 flex items-center gap-3">
              <Gem className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-sm text-amber-700">جواهرك</p>
                <p className="text-2xl font-bold text-amber-900">{userGems?.current_gems || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="themes">
              <Sparkles className="w-4 h-4 ml-2" />
              الثيمات
            </TabsTrigger>
            <TabsTrigger value="backgrounds">
              <ShoppingBag className="w-4 h-4 ml-2" />
              الخلفيات
            </TabsTrigger>
            <TabsTrigger value="frames">
              <Crown className="w-4 h-4 ml-2" />
              الإطارات
            </TabsTrigger>
            <TabsTrigger value="powerups">
              ⚡
              القوى
            </TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHOP_ITEMS.themes.map((item) => {
              const purchased = isPurchased(item.id);
              const affordable = canAfford(item.price);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`${purchased ? 'border-2 border-primary' : ''} hover:shadow-lg transition-all`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{item.icon}</span>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        {purchased && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`w-full h-20 rounded-lg mb-4 ${item.preview}`}></div>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Gem className="w-3 h-3" />
                          {item.price}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(item, 'theme')}
                          disabled={purchased || !affordable}
                          variant={purchased ? "outline" : "default"}
                        >
                          {purchased ? (
                            <>
                              <Check className="w-4 h-4 ml-2" />
                              مشترى
                            </>
                          ) : !affordable ? (
                            <>
                              <Lock className="w-4 h-4 ml-2" />
                              مقفل
                            </>
                          ) : (
                            "شراء"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>

          <TabsContent value="backgrounds" className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHOP_ITEMS.backgrounds.map((item) => {
              const purchased = isPurchased(item.id);
              const affordable = canAfford(item.price);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`${purchased ? 'border-2 border-primary' : ''} hover:shadow-lg transition-all`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{item.icon}</span>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        {purchased && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="w-full h-20 rounded-lg mb-4" 
                        style={{ background: item.preview }}
                      ></div>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Gem className="w-3 h-3" />
                          {item.price}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(item, 'background')}
                          disabled={purchased || !affordable}
                          variant={purchased ? "outline" : "default"}
                        >
                          {purchased ? (
                            <>
                              <Check className="w-4 h-4 ml-2" />
                              مشترى
                            </>
                          ) : !affordable ? (
                            <>
                              <Lock className="w-4 h-4 ml-2" />
                              مقفل
                            </>
                          ) : (
                            "شراء"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>

          <TabsContent value="frames" className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHOP_ITEMS.frames.map((item) => {
              const purchased = isPurchased(item.id);
              const affordable = canAfford(item.price);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`${purchased ? 'border-2 border-primary' : ''} hover:shadow-lg transition-all`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{item.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            {item.rarity && (
                              <Badge className={`text-xs mt-1 ${getRarityColor(item.rarity)}`}>
                                {item.rarity === 'legendary' && '🌟 أسطوري'}
                                {item.rarity === 'epic' && '⚡ ملحمي'}
                                {item.rarity === 'rare' && '💎 نادر'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {purchased && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Gem className="w-3 h-3" />
                          {item.price}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(item, 'frame')}
                          disabled={purchased || !affordable}
                          variant={purchased ? "outline" : "default"}
                        >
                          {purchased ? (
                            <>
                              <Check className="w-4 h-4 ml-2" />
                              مشترى
                            </>
                          ) : !affordable ? (
                            <>
                              <Lock className="w-4 h-4 ml-2" />
                              مقفل
                            </>
                          ) : (
                            "شراء"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>

          <TabsContent value="powerups" className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHOP_ITEMS.powerups.map((item) => {
              const purchased = isPurchased(item.id);
              const affordable = canAfford(item.price);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{item.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <p className="text-xs text-foreground/70 mt-1">
                            {item.duration || `${item.uses} استخدامات`}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Gem className="w-3 h-3" />
                          {item.price}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(item, 'powerup')}
                          disabled={!affordable}
                        >
                          {!affordable ? (
                            <>
                              <Lock className="w-4 h-4 ml-2" />
                              مقفل
                            </>
                          ) : (
                            "شراء"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}