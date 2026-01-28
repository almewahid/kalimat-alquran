import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

/**
 * 💬 مكون دردشة المجموعة (Group Chat)
 * 
 * يعرض رسائل المجموعة ويسمح بإرسال رسائل جديدة
 */

export default function GroupChat({ groupId, currentUserEmail }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessages();
    
    // Refresh messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [groupId]);

  const loadMessages = async () => {
    try {
      const groupMessages = await base44.entities.GroupMessage.filter({
        group_id: groupId
      });

      groupMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      setMessages(groupMessages);

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
      await base44.entities.GroupMessage.create({
        group_id: groupId,
        message_text: newMessage,
        sender_email: currentUserEmail
      });

      setNewMessage("");
      loadMessages();

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">💬 دردشة المجموعة</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] mb-4 p-4 bg-background-soft rounded-lg">
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isOwn = msg.sender_email === currentUserEmail;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`mb-3 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white border border-border'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-bold mb-1 text-primary">
                        {msg.sender_email.split('@')[0]}
                      </p>
                    )}
                    <p className="text-sm">{msg.message_text}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-foreground/60'}`}>
                      {formatDistanceToNow(new Date(msg.created_date), {
                        addSuffix: true,
                        locale: ar
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="text-center py-8 text-foreground/70">
              <p>لا توجد رسائل بعد</p>
              <p className="text-sm mt-2">كن أول من يبدأ المحادثة!</p>
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="اكتب رسالة..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isSending}
          />
          <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
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