/**
 * SuperMemo-2 (SM-2) Algorithm implementation for Spaced Repetition
 * 
 * @param {Object} card - The current state of the flashcard
 * @param {number} quality - Response quality (0-5)
 *   5 - Perfect response
 *   4 - Correct response after hesitation
 *   3 - Correct response recalled with serious difficulty
 *   2 - Incorrect response; where the correct one seemed easy to recall
 *   1 - Incorrect response; the correct one remembered
 *   0 - Complete blackout
 */
export const calculateSRS = (card, quality) => {
    // Default values if card is new
    let repetitions = card?.repetitions || 0;
    let interval = card?.interval || 0;
    let efactor = card?.efactor || 2.5;

    // If quality is less than 3, start over
    if (quality < 3) {
        repetitions = 0;
        interval = 1;
    } else {
        // Update repetitions
        repetitions += 1;

        // Calculate interval
        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * efactor);
        }

        // Update E-Factor
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        // EF cannot go below 1.3
        if (efactor < 1.3) efactor = 1.3;
    }

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
        repetitions,
        interval,
        efactor,
        next_review: nextReview.toISOString(),
        last_review: new Date().toISOString(),
        last_quality: quality
    };
};

// Helper to determine status label
export const getStatusLabel = (interval) => {
    if (interval <= 1) return { label: "تعلم جديد", color: "bg-blue-100 text-blue-800" };
    if (interval < 21) return { label: "مراجعة قريبة", color: "bg-yellow-100 text-yellow-800" };
    return { label: "متقن", color: "bg-green-100 text-green-800" };
};