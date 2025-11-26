"use client";

import { useRef, useEffect } from "react";
import { FileText, Image, Video, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/core/domain/messaging/message";
import { ScrollArea } from "@/@shared/ui/scroll-area";
import { Badge } from "@/@shared/ui/badge";
import { Avatar, AvatarFallback } from "@/@shared/ui/avatar";

interface MessageThreadProps {
  messages: Message[];
  currentUserId?: number;
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      case "file":
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-muted-foreground">
        <div>
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Start the conversation by sending a message</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isAgent = message.sender === "agent";
          const isSystem = message.sender === "system";
          const showDateDivider =
            index === 0 ||
            new Date(message.sentAt).toDateString() !==
            new Date(messages[index - 1].sentAt).toDateString();

          return (
            <div key={message.id}>
              {/* Date Divider */}
              {showDateDivider && (
                <div className="mb-4 flex items-center justify-center">
                  <Badge variant="outline" className="text-xs">
                    {new Date(message.sentAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Badge>
                </div>
              )}

              {/* System Message */}
              {isSystem ? (
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-xs">
                    {message.content}
                  </Badge>
                </div>
              ) : (
                /* Regular Message */
                <div
                  className={cn(
                    "flex gap-3",
                    isAgent ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={isAgent ? "bg-primary text-primary-foreground" : "bg-muted"}
                    >
                      {isAgent ? "A" : "C"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Content */}
                  <div
                    className={cn(
                      "flex max-w-[70%] flex-col gap-1",
                      isAgent ? "items-end" : "items-start"
                    )}
                  >
                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2",
                        isAgent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.content && <p className="text-sm">{message.content}</p>}

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment, idx) => (
                            <div key={idx}>
                              {attachment.type === "image" ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name || "Image"}
                                  className="max-h-64 rounded-md"
                                />
                              ) : (
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "flex items-center gap-2 rounded-md border p-2 hover:bg-accent",
                                    isAgent
                                      ? "border-primary-foreground/20"
                                      : "border-border"
                                  )}
                                >
                                  {getAttachmentIcon(attachment.type)}
                                  <span className="text-xs truncate">
                                    {attachment.name || `${attachment.type} file`}
                                  </span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.sentAt)}
                      {message.isRead && isAgent && (
                        <span className="ml-1">• Read</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
