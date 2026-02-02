import { supabaseClient } from '@/components/api/supabaseClient';

export const QuranicWord = supabaseClient.entities.QuranicWord;
export const UserProgress = supabaseClient.entities.UserProgress;
export const QuizSession = supabaseClient.entities.QuizSession;
export const UserNote = supabaseClient.entities.UserNote;
export const FlashCard = supabaseClient.entities.FlashCard;
export const FavoriteWord = supabaseClient.entities.FavoriteWord;
export const QuranAyah = supabaseClient.entities.QuranAyah;
export const Group = supabaseClient.entities.Group;
export const GroupChallenge = supabaseClient.entities.GroupChallenge;
export const ChallengeProgress = supabaseClient.entities.ChallengeProgress;
export const UserBadge = supabaseClient.entities.UserBadge;
export const Achievement = supabaseClient.entities.Achievement;
export const UserGems = supabaseClient.entities.UserGems;
export const UserPurchase = supabaseClient.entities.UserPurchase;
export const LearningPath = supabaseClient.entities.LearningPath;
export const UserLearningPath = supabaseClient.entities.UserLearningPath;
export const DailyChallenge = supabaseClient.entities.DailyChallenge;
export const DailyChallengeProgress = supabaseClient.entities.DailyChallengeProgress;
export const Friendship = supabaseClient.entities.Friendship;
export const Notification = supabaseClient.entities.Notification;
export const WeeklyReport = supabaseClient.entities.WeeklyReport;
export const GroupMessage = supabaseClient.entities.GroupMessage;
export const SeasonalChallenge = supabaseClient.entities.SeasonalChallenge;
export const FlashChallenge = supabaseClient.entities.FlashChallenge;
export const TeamChallenge = supabaseClient.entities.TeamChallenge;
export const ReferralCode = supabaseClient.entities.ReferralCode;
export const ActivityLog = supabaseClient.entities.ActivityLog;
export const QuranTafsir = supabaseClient.entities.QuranTafsir;
export const ErrorLog = supabaseClient.entities.ErrorLog;
export const Course = supabaseClient.entities.Course;
export const UserCourseProgress = supabaseClient.entities.UserCourseProgress;
export const Certificate = supabaseClient.entities.Certificate;
export const PersonalChallenge = supabaseClient.entities.PersonalChallenge;
export const LandingPage = supabaseClient.entities.LandingPage;

// Images & Categories (استخدم أسماء مناسبة)
export const Image = supabaseClient.entities.Image;
export const Category = supabaseClient.entities.Category;
export const Audio = supabaseClient.entities.Audio;

// Auth
export const User = supabaseClient.auth;