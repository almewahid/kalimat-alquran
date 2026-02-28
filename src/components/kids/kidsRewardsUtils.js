import { supabaseClient } from "@/components/api/supabaseClient";

/**
 * منح مكافأة للطفل. لا تعمل إلا إذا كان وضع الأطفال مفعّلاً (kids_mode_enabled).
 * @param {object} params
 * @param {number} [params.stars=0]
 * @param {number} [params.medals=0]
 * @param {number} [params.trophies=0]
 * @param {string} [params.source="عام"] - وصف مصدر المكافأة لسجل المكافآت
 */
export async function grantKidsReward({ stars = 0, medals = 0, trophies = 0, source = "عام" } = {}) {
  if (stars === 0 && medals === 0 && trophies === 0) return;

  try {
    const user = await supabaseClient.auth.me();
    if (!user?.preferences?.kids_mode_enabled) return;

    const [existing] = await supabaseClient.entities.KidsReward.filter({
      user_email: user.email
    });

    const icon = trophies > 0 ? "🏆" : medals > 0 ? "🥇" : "⭐";
    const type = trophies > 0 ? "trophy" : medals > 0 ? "medal" : "star";
    const rewardEntry = {
      type,
      icon,
      name: source,
      earned_date: new Date().toISOString()
    };

    if (existing) {
      const updatedCollected = [...(existing.collected_rewards || []), rewardEntry].slice(-5);
      await supabaseClient.entities.KidsReward.update(existing.id, {
        stars:    (existing.stars    || 0) + stars,
        medals:   (existing.medals   || 0) + medals,
        trophies: (existing.trophies || 0) + trophies,
        collected_rewards: updatedCollected
      });
    } else {
      // entity wrapper يضيف user_email و user_id تلقائياً
      await supabaseClient.entities.KidsReward.create({
        stars,
        medals,
        trophies,
        level: 1,
        avatar: "🌟",
        collected_rewards: [rewardEntry]
      });
    }
  } catch (err) {
    console.error("[kidsRewardsUtils] خطأ في منح المكافأة:", err);
  }
}
