"use client";

import { ChatbotWidget } from "../../chatbot/_components/ChatbotWidget";

interface DashboardWithChatbotProps {
  userId: string;
  userName?: string;
  children: React.ReactNode;
}

export function DashboardWithChatbot({ userId, userName, children }: DashboardWithChatbotProps) {
  return (
    <>
      {children}
      <ChatbotWidget userId={userId} userName={userName} />
    </>
  );
}
