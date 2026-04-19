import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Volume2, CheckCircle, ChevronLeft, ChevronRight, Zap, Sparkles, Bell, Waves } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const KIDS_IMG   = "/images/kids/KIDS.webp";
const MEDIUM_IMG = "/images/kids/MEDIUM.webp";

export default function TutorialModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [userSettings, setUserSettings] = useState({
    daily_new_words_goal: 10,
    daily_review_words_goal: 20,
    sound_effects_enabled: true,
    animations_enabled: true,
    confetti_enabled: true,
  });

  const handleFinish = () => {
    onClose({ ...userSettings, learning_level: selectedLevel });
  };

  const levels = [
    {
      id: "مبتدئ",
      label: "مستوى الطفل",
      desc: "أنشطة ممتعة وألعاب تفاعلية مع شخصيات كرتونية",
      img: KIDS_IMG,
      accent: "#16a34a",
      accentGrad: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
      accentShadow: "#22c55e40",
      accentLight: "#f0fdf4",
      badge: "للأطفال",
      badgeBg: "#dcfce7",
      badgeColor: "#15803d",
      emoji: "🌟",
    },
    {
      id: "متوسط",
      label: "المستوى المتوسط",
      desc: "تمارين متقدمة ومتابعة مستمرة للتقدم والإنجازات",
      img: MEDIUM_IMG,
      accent: "#4f46e5",
      accentGrad: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      accentShadow: "#6366f140",
      accentLight: "#eef2ff",
      badge: "متقدم",
      badgeBg: "#e0e7ff",
      badgeColor: "#3730a3",
      emoji: "🏆",
    },
  ];

  // ===== SCREEN 1: LEVEL SELECTION =====
  const Screen1 = () => (
    <motion.div
      key="level"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.28 }}
      style={{ padding: "1.75rem 1.5rem 1.25rem" }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "linear-gradient(135deg,#fef9c3,#d1fae5)",
          borderRadius: 99, padding: "5px 16px",
          fontSize: 12, fontWeight: 600, color: "#15803d",
          marginBottom: 12,
        }}>
          <span style={{fontSize:14}}>🎯</span> خطوة ١ من ٢ <span style={{fontWeight:800, color:"var(--foreground)", marginInlineStart:8}}>اختر مستوى الطفل</span>
        </div>
      </div>

      {/* Cards — row on desktop, column on mobile via CSS class */}
      <style>{`
        .level-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 560px) {
          .level-cards-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
        }
        .level-img-wrap {
          width: 100%;
          aspect-ratio: 16/12;
          overflow: hidden;
          position: relative;
          background: #f3f4f6;
          border-radius: 12px 12px 0 0;
        }
        .level-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          display: block;
          transition: transform 0.3s;
        }
        .level-card-item:hover .level-img-wrap img {
          transform: scale(1.03);
        }
      `}</style>

      <div className="level-cards-grid">
        {levels.map((lv) => {
          const chosen = selectedLevel === lv.id;
          return (
            <div
              key={lv.id}
              className="level-card-item"
              onClick={() => setSelectedLevel(lv.id)}
              style={{
                border: chosen ? `2.5px solid ${lv.accent}` : "1.5px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
                cursor: "pointer",
                background: chosen ? lv.accentLight : "var(--card)",
                transition: "all 0.22s",
                boxShadow: chosen ? `0 6px 24px ${lv.accentShadow}` : "0 1px 4px rgba(0,0,0,0.06)",
                transform: chosen ? "translateY(-2px)" : "none",
              }}
            >
              {/* Screenshot — full, no crop */}
              <div className="level-img-wrap">
                <img src={lv.img} alt={lv.label} />
                {/* Subtle bottom fade */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 32,
                  background: `linear-gradient(transparent, ${chosen ? lv.accentLight : "var(--card)"})`
                }} />
              </div>

              {/* Card bottom info */}
              <div style={{ padding: "10px 14px 14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16 }}>{lv.emoji}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>{lv.label}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px",
                        borderRadius: 99, background: lv.badgeBg, color: lv.badgeColor
                      }}>{lv.badge}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.5 }}>{lv.desc}</p>
                  </div>
                  {/* Check */}
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: chosen ? lv.accent : "transparent",
                    border: chosen ? "none" : "2px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", marginTop: 2,
                  }}>
                    {chosen && <CheckCircle size={16} color="#fff" strokeWidth={2.5} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => selectedLevel && setStep(1)}
        disabled={!selectedLevel}
        style={{
          width: "100%", marginTop: "1.25rem", padding: "14px 0",
          borderRadius: 14, border: "none",
          background: selectedLevel
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : "var(--muted)",
          color: selectedLevel ? "#fff" : "var(--muted-foreground)",
          fontSize: 16, fontWeight: 700, cursor: selectedLevel ? "pointer" : "not-allowed",
          transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: selectedLevel ? "0 4px 16px #22c55e40" : "none",
          letterSpacing: "0.02em",
        }}
      >
        التالي <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
    </motion.div>
  );

  // ===== SCREEN 2: SETTINGS =====
  const settingsItems = [
    {
      key: "sound_effects_enabled",
      icon: <Volume2 size={18} />,
      label: "المؤثرات الصوتية",
      desc: "أصوات عند الإجابة الصحيحة والخاطئة",
      color: "#f59e0b", colorBg: "#fffbeb",
    },
    {
      key: "animations_enabled",
      icon: <Waves size={18} />,
      label: "تأثير الموجة",
      desc: "موجة جميلة عند الإجابة الصحيحة",
      color: "#06b6d4", colorBg: "#ecfeff",
    },
    {
      key: "confetti_enabled",
      icon: <Sparkles size={18} />,
      label: "احتفالات Confetti",
      desc: "احتفال عند رفع المستوى أو إنجاز",
      color: "#8b5cf6", colorBg: "#f5f3ff",
    },
  ];

  const Screen2 = () => (
    <motion.div
      key="settings"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.28 }}
      style={{ padding: "1.25rem 1.5rem 1rem" }}
    >
      {/* Back + header */}
      <button
        onClick={() => setStep(0)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--muted-foreground)", fontSize: 13,
          display: "flex", alignItems: "center", gap: 4,
          marginBottom: "0.9rem", padding: 0, fontWeight: 500,
        }}
      >
        <ChevronRight size={16} /> رجوع
      </button>

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg,#e0e7ff,#ede9fe)",
          borderRadius: 99, padding: "6px 16px",
          fontSize: 13, fontWeight: 700, color: "#4338ca", marginBottom: 0,
        }}>
          <span style={{fontSize:15}}>⚙️</span>
          <span>خطوة ٢ من ٢</span>
          <span style={{
            width: 1, height: 14, background: "#a5b4fc", margin: "0 2px",
            display: "inline-block", borderRadius: 2,
          }} />
          <span style={{ fontWeight: 800, color: "#3730a3", fontSize: 14 }}>الإعدادات</span>
        </div>
      </div>

      {/* Daily Goals Card */}
      <div style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        border: "1px solid #bbf7d0",
        borderRadius: 16, padding: "12px 14px", marginBottom: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, fontWeight: 700, color: "#15803d", marginBottom: 10,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={13} color="#fff" />
          </div>
          الأهداف اليومية
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { key: "daily_new_words_goal", emoji: "🆕", label: "كلمات جديدة", max: 50 },
            { key: "daily_review_words_goal", emoji: "🔁", label: "مراجعة يومية", max: 100 },
          ].map(item => (
            <div key={item.key} style={{
              background: "#fff", borderRadius: 12, padding: "10px 8px", textAlign: "center",
              border: "1px solid #dcfce7",
              boxShadow: "0 1px 4px #16a34a10",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{item.emoji}</div>
              <Label style={{ fontSize: 11, color: "#15803d", fontWeight: 600, display: "block", marginBottom: 6 }}>
                {item.label}
              </Label>
              <Input
                type="number" min="1" max={item.max}
                value={userSettings[item.key]}
                onChange={(e) => setUserSettings(p => ({ ...p, [item.key]: parseInt(e.target.value) || 10 }))}
                style={{
                  borderRadius: 8, textAlign: "center", fontSize: 18,
                  fontWeight: 800, color: "#16a34a", border: "1.5px solid #bbf7d0",
                  background: "#f0fdf4", padding: "4px",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, overflow: "hidden", marginBottom: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}>
        {settingsItems.map((item, i) => (
          <div
            key={item.key}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: i < settingsItems.length - 1 ? "1px solid var(--border)" : "none",
              transition: "background 0.15s",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: item.colorBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: item.color, flexShrink: 0,
                boxShadow: `0 2px 8px ${item.color}25`,
              }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 1 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{item.desc}</div>
              </div>
            </div>
            <Switch
              checked={userSettings[item.key]}
              onCheckedChange={(v) => setUserSettings(p => ({ ...p, [item.key]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Finish button */}
      <button
        onClick={handleFinish}
        style={{
          width: "100%", padding: "13px 0",
          borderRadius: 14, border: "none",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "#fff", fontSize: 15, fontWeight: 800,
          cursor: "pointer", letterSpacing: "0.02em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 6px 20px #6366f135",
          transition: "all 0.2s",
        }}
      >
        <CheckCircle size={17} strokeWidth={2.5} />
        ابدأ التعلم الآن!
      </button>


    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-2xl bg-card max-h-[92vh] overflow-y-auto p-0"
        dir="rtl"
        style={{ borderRadius: 22 }}
      >
        <AnimatePresence mode="wait">
          {step === 0 ? <Screen1 key="s1" /> : <Screen2 key="s2" />}
        </AnimatePresence>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 7, paddingBottom: "1rem" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              height: 6, borderRadius: 3,
              width: step === i ? 24 : 8,
              background: step === i ? "#22c55e" : "var(--border)",
              transition: "all 0.25s",
            }} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
