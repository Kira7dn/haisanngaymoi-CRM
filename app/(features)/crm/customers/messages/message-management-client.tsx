"use client";

import { useState, useEffect, useRef } from "react";
import { ConversationSidebar } from "./_components/conversation-sidebar";
import { MessageThread } from "./_components/message-thread";
import { MessageInput } from "./_components/message-input";
import { CustomerProfilePanel } from "./_components/customer-profile-panel";
import { MessageCircle } from "lucide-react";
import { useSSEConnection } from "@/app/hooks/useSSEConnection";
import type { Conversation } from "@/core/domain/messaging/conversation";
import type { Message, Attachment } from "@/core/domain/messaging/message";
import type { Customer } from "@/core/domain/customers/customer";

export function MessageManagementClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Use ref to track current selected conversation ID for SSE handlers
  const selectedConversationIdRef = useRef<string | undefined>(selectedConversationId);

  // Update ref when selectedConversationId changes
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  // Setup SSE connection for real-time updates
  const { isConnected } = useSSEConnection({
    autoConnect: true,
    autoReconnect: true,
    onEvent: {
      new_message: (data) => {
        console.log("[SSE] New message event received:", data);
        const { message } = data;

        if (!message) {
          console.error("[SSE] Invalid message data:", data);
          return;
        }

        console.log("[SSE] Processing new message:", {
          messageId: message.id,
          conversationId: message.conversationId,
          currentConversationId: selectedConversationIdRef.current,
        });

        // Always update conversation list
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === message.conversationId
              ? { ...c, lastMessageAt: message.sentAt }
              : c
          );
          console.log("[SSE] Updated conversations:", updated.length);
          return updated;
        });

        // Update messages only if it's for the currently selected conversation
        setMessages((prev) => {
          // Check if this message is for current conversation (use ref for latest value)
          if (message.conversationId !== selectedConversationIdRef.current) {
            console.log("[SSE] Message not for current conversation, skipping UI update");
            return prev;
          }

          // Avoid duplicates
          const exists = prev.some(
            (m) => m.id === message.id || (message.platformMessageId && m.platformMessageId === message.platformMessageId)
          );

          if (exists) {
            console.log("[SSE] Duplicate message detected, skipping");
            return prev;
          }

          console.log("[SSE] Adding new message to UI, total:", prev.length + 1);
          return [...prev, message];
        });
      },

      new_conversation: (data) => {
        console.log("[SSE] New conversation event received:", data);
        fetchConversations();
      },

      message_delivered: (data) => {
        console.log("[SSE] Message delivered event:", data);
        const { platformMessageIds } = data;

        if (!platformMessageIds || !Array.isArray(platformMessageIds)) {
          console.error("[SSE] Invalid platformMessageIds:", data);
          return;
        }

        setMessages((prev) =>
          prev.map((msg) =>
            platformMessageIds.includes(msg.platformMessageId)
              ? { ...msg, deliveryStatus: "delivered" as const }
              : msg
          )
        );
      },

      message_read: (data) => {
        console.log("[SSE] Message read event:", data);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === "customer" ? { ...msg, isRead: true } : msg
          )
        );
      },
    },
    onConnect: () => {
      console.log("[SSE] ✅ Connected to real-time messaging");
    },
    onError: (error) => {
      console.error("[SSE] ❌ Connection error:", error);
    },
  });

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      // Use contactId if available, fallback to customerId for backward compatibility
      const customerIdToFetch = selectedConversation?.contactId || selectedConversation?.customerId;
      fetchCustomer(customerIdToFetch);
    } else {
      setMessages([]);
      setCurrentCustomer(undefined);
    }
  }, [selectedConversationId]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/messaging/conversations");

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`);

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    }
  };

  const fetchCustomer = async (customerId?: string) => {
    if (!customerId) return;

    try {
      const response = await fetch(`/api/customers/${customerId}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Customer ${customerId} not found`);
          setCurrentCustomer(undefined);
          return;
        }
        throw new Error("Failed to fetch customer");
      }

      const data = await response.json();
      setCurrentCustomer(data.customer);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      setCurrentCustomer(undefined);
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedConversationId || !selectedConversation) {
      console.error("No conversation selected");
      return;
    }

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;

    // TODO: Upload attachments if any and get URLs
    // For now, we'll handle text messages only
    // File upload will be implemented in a future iteration
    const attachmentData: Attachment[] | undefined =
      attachments && attachments.length > 0
        ? attachments.map(
          (file): Attachment => ({
            type: file.type.startsWith("image/") ? "image" : "file",
            url: URL.createObjectURL(file), // Temporary - needs proper upload
            name: file.name,
          })
        )
        : undefined;

    // Optimistically add message to UI before API call
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: selectedConversationId,
      sender: "agent",
      content,
      sentAt: new Date(),
      isRead: false,
      attachments: attachmentData,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch("/api/messaging/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          platform: selectedConversation.platform,
          platformUserId: selectedConversation.customerId,
          content,
          attachments: attachmentData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      // Replace optimistic message with actual message from server
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? data.message : msg))
      );
    } catch (error) {
      console.error("Failed to send message:", error);

      // Rollback: Remove optimistic message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - 320px */}
      <div className="w-80 shrink-0">
        <ConversationSidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>

      {/* Main Chat Area - Flexible */}
      <div className="flex flex-1 flex-col">
        {selectedConversationId ? (
          <>
            {/* Header */}
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {currentCustomer?.name || `Customer ${selectedConversation?.customerId.slice(-6)}`}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation?.platform} • {selectedConversation?.status}
                  </p>
                </div>
                {/* SSE Connection Status */}
                <div className="flex items-center gap-2 text-xs">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-muted-foreground">
                    {isConnected ? "Real-time" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-hidden">
              <MessageThread messages={messages} customer={currentCustomer} />
            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={selectedConversation?.status === "closed"}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No conversation selected</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Select a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Profile Panel - 320px */}
      <div className="w-80 shrink-0">
        <CustomerProfilePanel
          customer={currentCustomer}
          conversation={selectedConversation}
        />
      </div>
    </div>
  );
}
