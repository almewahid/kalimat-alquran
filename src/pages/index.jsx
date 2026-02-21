import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import Learn from "./Learn";
import Quiz from "./Quiz";
import Progress from "./Progress";
import AppVersionTracking from './AppVersionTracking';
import Settings from "./Settings";
import Help from "./Help";
import Favorites from "./Favorites";
import Search from "./Search";
import GenerateWords from "./GenerateWords";
import ImportQuran from "./ImportQuran";
import QuranReader from "./QuranReader";
import Groups from "./Groups";
import GroupDetail from "./GroupDetail";
import ChallengeDetail from "./ChallengeDetail";
import Leaderboard from "./Leaderboard";
import AdminPanel from "./AdminPanel";
import Achievements from "./Achievements";
import Shop from "./Shop";
import LearningPaths from "./LearningPaths";
import DailyChallenges from "./DailyChallenges";
import Friends from "./Friends";
import Notifications from "./Notifications";
import Analytics from "./Analytics";
import NotificationManager from "./NotificationManager";
import WeeklyReports from "./WeeklyReports";
import QuizTypes from "./QuizTypes";
import KidsMode from "./KidsMode";
import ReferralSystem from "./ReferralSystem";
import LanguageSettings from "./LanguageSettings";
import PrivacySettings from "./PrivacySettings";
import RootQuiz from "./RootQuiz";
import ContextQuiz from "./ContextQuiz";
import ListeningQuiz from "./ListeningQuiz";
import SourceQuiz from "./SourceQuiz";
import TranslationHelper from "./TranslationHelper";
import ManageImages from "./ManageImages";
import ManageQuran from "./ManageQuran";
import UpdateWords from "./UpdateWords";
import ImportTafsir from "./ImportTafsir";
import AudioTest from "./AudioTest";
import ManageAudios from "./ManageAudios";
import SmartReview from "./SmartReview";
import ErrorLogs from "./ErrorLogs";
import Support from "./Support";
import Courses from "./Courses";
import CourseDetail from "./CourseDetail";
import CertificateView from "./CertificateView";
import ManageCertificates from "./ManageCertificates";
import UserProfile from "./UserProfile";
import Reports from "./Reports";
import CreateCustomChallenge from "./CreateCustomChallenge";
import ManageLandingPages from "./ManageLandingPages";
import ManageUsers from "./ManageUsers";
import ManageGroups from "./ManageGroups";
import ManageNotes from "./ManageNotes";
import StoreDetails from "./StoreDetails";
import PrivacyPolicy from "./PrivacyPolicy";
import CreateChallengeFromPath from "./CreateChallengeFromPath";
import CustomLearningPaths from "./CustomLearningPaths";
import CustomPathLearn from "./CustomPathLearn";
import KidsGames from "./KidsGames";
import Login from "./Login";

import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/components/api/supabaseClient';

function ProtectedRoute({ children }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'auth' | 'unauth'

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setStatus(user ? 'auth' : 'unauth');
        });
    }, []);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return status === 'auth' ? children : <Navigate to="/Login" replace />;
}

function AdminRoute({ children }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'admin' | 'unauth' | 'forbidden'

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) { setStatus('unauth'); return; }
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_id', user.id)
                .maybeSingle();
            setStatus(profile?.role === 'admin' ? 'admin' : 'forbidden');
        });
    }, []);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (status === 'unauth') return <Navigate to="/Login" replace />;
    if (status === 'forbidden') return <Navigate to="/Dashboard" replace />;
    return children;
}

function NotFound() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8" dir="rtl">
            <div className="text-8xl font-bold text-muted-foreground">٤٠٤</div>
            <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
            <p className="text-muted-foreground">الرابط الذي تبحث عنه غير موجود أو تم نقله</p>
            <button
                onClick={() => navigate('/Dashboard')}
                className="mt-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                العودة للرئيسية
            </button>
        </div>
    );
}

function PagesContent() {
    return (
        <Layout>
            <Routes>
                {/* مسارات مفتوحة */}
                <Route path="/" element={<Login />} />
                <Route path="/Login" element={<Login />} />
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />

                {/* مسارات المستخدم المسجّل */}
                <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/Learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
                <Route path="/Quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                <Route path="/Progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                <Route path="/Settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/Help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/Favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                <Route path="/Search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/QuranReader" element={<ProtectedRoute><QuranReader /></ProtectedRoute>} />
                <Route path="/Groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
                <Route path="/GroupDetail" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
                <Route path="/ChallengeDetail" element={<ProtectedRoute><ChallengeDetail /></ProtectedRoute>} />
                <Route path="/Leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                <Route path="/Achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                <Route path="/Shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                <Route path="/LearningPaths" element={<ProtectedRoute><LearningPaths /></ProtectedRoute>} />
                <Route path="/DailyChallenges" element={<ProtectedRoute><DailyChallenges /></ProtectedRoute>} />
                <Route path="/Friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                <Route path="/Notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/QuizTypes" element={<ProtectedRoute><QuizTypes /></ProtectedRoute>} />
                <Route path="/KidsMode" element={<ProtectedRoute><KidsMode /></ProtectedRoute>} />
                <Route path="/KidsGames" element={<ProtectedRoute><KidsGames /></ProtectedRoute>} />
                <Route path="/ReferralSystem" element={<ProtectedRoute><ReferralSystem /></ProtectedRoute>} />
                <Route path="/LanguageSettings" element={<ProtectedRoute><LanguageSettings /></ProtectedRoute>} />
                <Route path="/PrivacySettings" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
                <Route path="/RootQuiz" element={<ProtectedRoute><RootQuiz /></ProtectedRoute>} />
                <Route path="/ContextQuiz" element={<ProtectedRoute><ContextQuiz /></ProtectedRoute>} />
                <Route path="/ListeningQuiz" element={<ProtectedRoute><ListeningQuiz /></ProtectedRoute>} />
                <Route path="/SourceQuiz" element={<ProtectedRoute><SourceQuiz /></ProtectedRoute>} />
                <Route path="/SmartReview" element={<ProtectedRoute><SmartReview /></ProtectedRoute>} />
                <Route path="/Courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                <Route path="/CourseDetail" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                <Route path="/CertificateView" element={<ProtectedRoute><CertificateView /></ProtectedRoute>} />
                <Route path="/UserProfile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/ManageNotes" element={<ProtectedRoute><ManageNotes /></ProtectedRoute>} />
                <Route path="/Support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                <Route path="/StoreDetails" element={<ProtectedRoute><StoreDetails /></ProtectedRoute>} />
                <Route path="/CreateCustomChallenge" element={<ProtectedRoute><CreateCustomChallenge /></ProtectedRoute>} />
                <Route path="/CreateChallengeFromPath" element={<ProtectedRoute><CreateChallengeFromPath /></ProtectedRoute>} />
                <Route path="/CustomLearningPaths" element={<ProtectedRoute><CustomLearningPaths /></ProtectedRoute>} />
                <Route path="/CustomPathLearn" element={<ProtectedRoute><CustomPathLearn /></ProtectedRoute>} />
                <Route path="/TranslationHelper" element={<ProtectedRoute><TranslationHelper /></ProtectedRoute>} />

                {/* مسارات المدير فقط */}
                <Route path="/AdminPanel" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                <Route path="/Analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
                <Route path="/ManageUsers" element={<AdminRoute><ManageUsers /></AdminRoute>} />
                <Route path="/ManageGroups" element={<AdminRoute><ManageGroups /></AdminRoute>} />
                <Route path="/GenerateWords" element={<AdminRoute><GenerateWords /></AdminRoute>} />
                <Route path="/ImportQuran" element={<AdminRoute><ImportQuran /></AdminRoute>} />
                <Route path="/ManageQuran" element={<AdminRoute><ManageQuran /></AdminRoute>} />
                <Route path="/ManageImages" element={<AdminRoute><ManageImages /></AdminRoute>} />
                <Route path="/ManageAudios" element={<AdminRoute><ManageAudios /></AdminRoute>} />
                <Route path="/ManageCertificates" element={<AdminRoute><ManageCertificates /></AdminRoute>} />
                <Route path="/ManageLandingPages" element={<AdminRoute><ManageLandingPages /></AdminRoute>} />
                <Route path="/AppVersionTracking" element={<AdminRoute><AppVersionTracking /></AdminRoute>} />
                <Route path="/ErrorLogs" element={<AdminRoute><ErrorLogs /></AdminRoute>} />
                <Route path="/AudioTest" element={<AdminRoute><AudioTest /></AdminRoute>} />
                <Route path="/ImportTafsir" element={<AdminRoute><ImportTafsir /></AdminRoute>} />
                <Route path="/UpdateWords" element={<AdminRoute><UpdateWords /></AdminRoute>} />
                <Route path="/NotificationManager" element={<AdminRoute><NotificationManager /></AdminRoute>} />
                <Route path="/WeeklyReports" element={<AdminRoute><WeeklyReports /></AdminRoute>} />
                <Route path="/Reports" element={<AdminRoute><Reports /></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}