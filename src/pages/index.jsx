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

import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';

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
                <Route path="/" element={<Login />} />
                <Route path="/Login" element={<Login />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/Learn" element={<Learn />} />
                <Route path="/Quiz" element={<Quiz />} />
                <Route path="/Progress" element={<Progress />} />
                <Route path="/AppVersionTracking" element={<AppVersionTracking />} />
                <Route path="/Settings" element={<Settings />} />
                <Route path="/Help" element={<Help />} />
                <Route path="/Favorites" element={<Favorites />} />
                <Route path="/Search" element={<Search />} />
                <Route path="/GenerateWords" element={<GenerateWords />} />
                <Route path="/ImportQuran" element={<ImportQuran />} />
                <Route path="/QuranReader" element={<QuranReader />} />
                <Route path="/Groups" element={<Groups />} />
                <Route path="/GroupDetail" element={<GroupDetail />} />
                <Route path="/ChallengeDetail" element={<ChallengeDetail />} />
                <Route path="/Leaderboard" element={<Leaderboard />} />
                <Route path="/AdminPanel" element={<AdminPanel />} />
                <Route path="/Achievements" element={<Achievements />} />
                <Route path="/Shop" element={<Shop />} />
                <Route path="/LearningPaths" element={<LearningPaths />} />
                <Route path="/DailyChallenges" element={<DailyChallenges />} />
                <Route path="/Friends" element={<Friends />} />
                <Route path="/Notifications" element={<Notifications />} />
                <Route path="/Analytics" element={<Analytics />} />
                <Route path="/NotificationManager" element={<NotificationManager />} />
                <Route path="/WeeklyReports" element={<WeeklyReports />} />
                <Route path="/QuizTypes" element={<QuizTypes />} />
                <Route path="/KidsMode" element={<KidsMode />} />
                <Route path="/ReferralSystem" element={<ReferralSystem />} />
                <Route path="/LanguageSettings" element={<LanguageSettings />} />
                <Route path="/PrivacySettings" element={<PrivacySettings />} />
                <Route path="/RootQuiz" element={<RootQuiz />} />
                <Route path="/ContextQuiz" element={<ContextQuiz />} />
                <Route path="/ListeningQuiz" element={<ListeningQuiz />} />
                <Route path="/SourceQuiz" element={<SourceQuiz />} />
                <Route path="/TranslationHelper" element={<TranslationHelper />} />
                <Route path="/ManageImages" element={<ManageImages />} />
                <Route path="/ManageQuran" element={<ManageQuran />} />
                <Route path="/UpdateWords" element={<UpdateWords />} />
                <Route path="/ImportTafsir" element={<ImportTafsir />} />
                <Route path="/AudioTest" element={<AudioTest />} />
                <Route path="/ManageAudios" element={<ManageAudios />} />
                <Route path="/SmartReview" element={<SmartReview />} />
                <Route path="/ErrorLogs" element={<ErrorLogs />} />
                <Route path="/Support" element={<Support />} />
                <Route path="/Courses" element={<Courses />} />
                <Route path="/CourseDetail" element={<CourseDetail />} />
                <Route path="/CertificateView" element={<CertificateView />} />
                <Route path="/ManageCertificates" element={<ManageCertificates />} />
                <Route path="/UserProfile" element={<UserProfile />} />
                <Route path="/Reports" element={<Reports />} />
                <Route path="/CreateCustomChallenge" element={<CreateCustomChallenge />} />
                <Route path="/ManageLandingPages" element={<ManageLandingPages />} />
                <Route path="/ManageUsers" element={<ManageUsers />} />
                <Route path="/ManageGroups" element={<ManageGroups />} />
                <Route path="/ManageNotes" element={<ManageNotes />} />
                <Route path="/StoreDetails" element={<StoreDetails />} />
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                <Route path="/CreateChallengeFromPath" element={<CreateChallengeFromPath />} />
                <Route path="/CustomLearningPaths" element={<CustomLearningPaths />} />
                <Route path="/KidsGames" element={<KidsGames />} />
                <Route path="/CustomPathLearn" element={<CustomPathLearn />} />
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