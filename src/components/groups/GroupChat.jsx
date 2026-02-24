import React, { useState, useEffect, useRef } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
const supabase = supabaseClient.supabase;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

const TYPE_CONFIG = {
  general:   { color: "from-blue-500 to-indigo-500",  lightBg: "bg-blue-50 dark:bg-blue-950/20"   },
  study:     { color: "from-green-500 to-emerald-500", lightBg: "bg-green-50 dark:bg-green-950/20"  },
  challenge: { color: "from-amber-500 to-orange-500",  lightBg: "bg-amber-50 dark:bg-amber-950/20" },
};

const getType = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.general;

const getInitial = (email) => {
  if (!email) return "؟";
  return email.charAt(0).toUpperCase();
};

const getSenderEmail = (msg) => msg.sender_email || msg.user_email || "";

export default function GroupChat({ groupId, currentUserEmail, groupType = "general" }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const { toast } = useToast();

  const cfg = getType(groupType);

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [groupId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_date", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("group_messages")
        .insert({
          group_id: groupId,
          message_text: newMessage,
          sender_email: user?.email || currentUserEmail,
          created_date: new Date().toISOString(),
        });

      if (error) throw error;
      setNewMessage("");
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "خطأ في الإرسال",
        description: error?.message || "حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className={`h-4 bg-gradient-to-r ${cfg.color}`} />
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className={`h-4 bg-gradient-to-r ${cfg.color}`} />

      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow-lg flex-shrink-0`}
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          دردشة المجموعة
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className={`h-[400px] mb-4 p-4 rounded-xl ${cfg.lightBg}`}>
          <AnimatePresence>
            {messages.map((msg, index) => {
              const senderEmail = getSenderEmail(msg);
              const isOwn = senderEmail === currentUserEmail;
              const senderName = senderEmail ? senderEmail.split("@")[0] : "؟";
              const initial = getInitial(senderEmail);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  className={`mb-4 flex items-end gap-2 ${
                    isOwn ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar for other users */}
                  {!isOwn && (
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md`}
                    >
                      {initial}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
                      isOwn
                        ? `bg-gradient-to-br ${cfg.color} text-white`
                        : "bg-white dark:bg-gray-800 border border-border"
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-bold mb-1 text-primary">
                        {senderName}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message_text}</p>
                    <p
                      className={`text-xs mt-1.5 ${
                        isOwn ? "text-white/70" : "text-foreground/50"
                      }`}
                    >
                      {formatDistanceToNow(new Date(msg.created_date), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-foreground/70 font-medium">لا توجد رسائل بعد</p>
              <p className="text-sm text-foreground/50 mt-1">
                كن أول من يبدأ المحادثة!
              </p>
            </div>
          )}

          {/* Anchor for auto-scroll */}
          <div ref={bottomRef} />
        </ScrollArea>

        {/* Input row */}
        <div className="flex gap-2">
          <Input
            placeholder="اكتب رسالة..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && sendMessage()
            }
            disabled={isSending}
            className="rounded-xl"
          />
          <Button
            onClick={sendMessage}
            disabled={isSending || !newMessage.trim()}
            className={`bg-gradient-to-r ${cfg.color} hover:opacity-90 text-white border-0 rounded-xl px-4`}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
