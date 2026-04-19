import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const LOGO_URL = "/logo.webp";

const cards = [
  {
    title: "رحلتنا",
    img: "/images/kids/journey_card.webp",
    url: createPageUrl("LearningPaths"),
    titleColor: "#1d4ed8",
    titleBg: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    bg: "linear-gradient(160deg, #e0f2fe 0%, #bfdbfe 100%)",
  },
  {
    title: "تعلّم",
    img: "/images/kids/learn_card.webp",
    url: createPageUrl("Learn"),
    titleColor: "#065f46",
    titleBg: "linear-gradient(135deg, #d1fae5, #6ee7b7)",
    bg: "linear-gradient(160deg, #ecfdf5 0%, #a7f3d0 100%)",
  },
  {
    title: "مراجعة ممتعة",
    img: "/images/kids/review_card.webp",
    url: createPageUrl("SmartReview"),
    titleColor: "#92400e",
    titleBg: "linear-gradient(135deg, #fef3c7, #fcd34d)",
    bg: "linear-gradient(160deg, #fffbeb 0%, #fde68a 100%)",
  },
  {
    title: "مكافآتي",
    img: "/images/kids/rewards_card.webp",
    url: createPageUrl("KidsRewards"),
    titleColor: "#9d174d",
    titleBg: "linear-gradient(135deg, #fce7f3, #f9a8d4)",
    bg: "linear-gradient(160deg, #fff1f2 0%, #fbcfe8 100%)",
  },
];

export default function KidsHome() {
  const { preferences } = useAuth();
  const childName = preferences?.child_name || "صديقي";

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #fffbeb 0%, #fef9c3 50%, #e0f2fe 100%)",
        padding: "24px 16px",
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* الشعار في خلفية الشاشة */}
      <img
        src={LOGO_URL}
        alt=""
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: -60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 420,
          height: 420,
          objectFit: "contain",
          opacity: 0.07,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── الهيدر: شعار يسار + تحية يمين ── */}
        <motion.div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row-reverse", // الشعار على اليسار في RTL
            gap: 14,
            marginBottom: 28,
          }}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* الشعار على الشمال */}
          <motion.img
            src={LOGO_URL}
            alt="شعار"
            style={{ width: 70, height: 70, objectFit: "contain", flexShrink: 0 }}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
          />

          {/* التحية الملونة */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, fontSize: 26, fontWeight: 900, lineHeight: 1.3, flex: 1, justifyContent: "flex-start" }}>
            <span style={{ color: "#f59e0b" }}>السلام</span>
            <span style={{ color: "#10b981" }}>عليكم</span>
            <span style={{ color: "#3b82f6" }}>{childName}</span>
            <motion.span
              style={{ display: "inline-block", fontSize: 28 }}
              animate={{ rotate: [0, 20, -10, 20, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            >
              👋
            </motion.span>
          </div>
        </motion.div>

        {/* ── شبكة الكروت 2×2 ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}>
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.35 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              style={{ borderRadius: 20, overflow: "hidden" }}
            >
              <Link to={card.url} style={{ display: "block", textDecoration: "none" }}>
                <div style={{
                  background: card.bg,
                  borderRadius: 20,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  border: "3px solid rgba(255,255,255,0.85)",
                  overflow: "hidden",
                }}>

                  {/* منطقة الصورة */}
                  <div style={{ height: 195, overflow: "hidden" }}>
                    <img
                      src={card.img}
                      alt={card.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center top",
                        display: "block",
                      }}
                    />
                  </div>

                  {/* شريط العنوان */}
                  <div style={{
                    background: card.titleBg,
                    padding: "10px 16px",
                    textAlign: "center",
                  }}>
                    <span style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: card.titleColor,
                    }}>
                      {card.title}
                    </span>
                  </div>

                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}