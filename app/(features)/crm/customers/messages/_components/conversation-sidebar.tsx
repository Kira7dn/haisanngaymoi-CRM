"use client";

import { useState } from "react";
import { Search, MessageCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/core/domain/messaging/conversation";
import { Badge } from "@/@shared/ui/badge";
import { Input } from "@/@shared/ui/input";
import { ScrollArea } from "@/@shared/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/@shared/ui/avatar";

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.customerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "bg-blue-500";
      case "zalo":
        return "bg-sky-500";
      case "tiktok":
        return "bg-black";
      case "website":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Open</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="mb-3 text-lg font-semibold">Conversations</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageCircle className="mb-2 h-12 w-12 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-colors hover:bg-accent",
                  selectedConversationId === conversation.id && "bg-accent"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Platform Avatar */}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={getPlatformColor(conversation.platform)}>
                        {conversation.platform.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background",
                        conversation.status === "open" ? "bg-green-500" : "bg-gray-400"
                      )}
                    />
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">
                        Customer {conversation.customerId.slice(-6)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {conversation.platform}
                      </Badge>
                      {getStatusBadge(conversation.status)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
