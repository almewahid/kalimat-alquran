import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Users, Search, Trophy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function CreateCustomChallenge() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [challengeData, setChallengeData] = useState({
    title: "",
    description: "",
    word_ids: [],
    participants: []
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [wordResults, setWordResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    const user = await supabaseClient.auth.me();
    const friendships = await supabaseClient.entities.Friendship.filter({
        user_email: user.email,
        status: "accepted"
    });
    setFriends(friendships);
  };

  const searchWords = async () => {
    if (!searchTerm) return;
    setIsLoading(true);
    try {
        const words = await supabaseClient.entities.QuranicWord.list(); // Ideally filter by search term on DB
        const filtered = words.filter(w => w.word.includes(searchTerm) || w.meaning.includes(searchTerm)).slice(0, 10);
        setWordResults(filtered);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const toggleWord = (wordId) => {
    setChallengeData(prev => {
        const current = prev.word_ids;
        if (current.includes(wordId)) {
            return { ...prev, word_ids: current.filter(id => id !== wordId) };
        }
        return { ...prev, word_ids: [...current, wordId] };
    });
  };

  const toggleParticipant = (email) => {
    setChallengeData(prev => {
        const current = prev.participants;
        if (current.includes(email)) {
            return { ...prev, participants: current.filter(e => e !== email) };
        }
        return { ...prev, participants: [...current, email] };
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
        const user = await supabaseClient.auth.me();
        await supabaseClient.entities.PersonalChallenge.create({
            creator_email: user.email,
            title: challengeData.title,
            description: challengeData.description,
            word_ids: challengeData.word_ids,
            participants: [...challengeData.participants, user.email], // Include creator
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true
        });

        // Notify participants
        for (const email of challengeData.participants) {
            await supabaseClient.entities.Notification.create({
                user_email: email,
                notification_type: "challenge_invite",
                title: `دعوة لتحدي: ${challengeData.title}`,
                message: `دعاك ${user.full_name} للمشاركة في تحدي حفظ كلمات.`,
                icon: "⚔️",
                is_read: false
            });
        }

        toast({ title: "✅ تم إنشاء التحدي بنجاح" });
        // Redirect logic here if needed, e.g. using window.location or router
        window.location.href = createPageUrl("Challenges");
    } catch (error) {
        console.error(error);
        toast({ title: "❌ فشل الإنشاء", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            إنشاء تحدي شخصي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
                <div>
                    <label className="block mb-2 font-medium">عنوان التحدي</label>
                    <Input value={challengeData.title} onChange={e => setChallengeData({...challengeData, title: e.target.value})} placeholder="مثال: تحدي سورة الكهف" />
                </div>
                <div>
                    <label className="block mb-2 font-medium">الوصف</label>
                    <Textarea value={challengeData.description} onChange={e => setChallengeData({...challengeData, description: e.target.value})} placeholder="وصف للتحدي..." />
                </div>
                <Button className="w-full" onClick={() => setStep(2)} disabled={!challengeData.title}>التالي</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ابحث عن كلمات لإضافتها..." />
                    <Button onClick={searchWords}><Search className="w-4 h-4" /></Button>
                </div>
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                    {wordResults.map(word => (
                        <div key={word.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox 
                                checked={challengeData.word_ids.includes(word.id)}
                                onCheckedChange={() => toggleWord(word.id)}
                            />
                            <div>
                                <p className="font-bold">{word.word}</p>
                                <p className="text-xs text-muted-foreground">{word.meaning}</p>
                            </div>
                        </div>
                    ))}
                    {wordResults.length === 0 && <p className="text-center text-muted-foreground p-4">ابحث لإضافة كلمات</p>}
                </div>
                <p className="text-sm text-muted-foreground">تم اختيار {challengeData.word_ids.length} كلمة</p>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>السابق</Button>
                    <Button className="flex-1" onClick={() => setStep(3)} disabled={challengeData.word_ids.length === 0}>التالي</Button>
                </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
                <h3 className="font-medium">دعو الأصدقاء (اختياري)</h3>
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                    {friends.map(friend => (
                        <div key={friend.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox 
                                checked={challengeData.participants.includes(friend.friend_email)}
                                onCheckedChange={() => toggleParticipant(friend.friend_email)}
                            />
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{friend.friend_email}</span>
                            </div>
                        </div>
                    ))}
                    {friends.length === 0 && <p className="text-center p-4">لا يوجد أصدقاء، <Link to={createPageUrl("Friends")} className="text-primary underline">أضف أصدقاء</Link></p>}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>السابق</Button>
                    <Button className="flex-1" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء التحدي"}
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}