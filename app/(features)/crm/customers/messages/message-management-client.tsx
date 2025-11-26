"use client";

import { useState, useEffect } from "react";
import { ConversationSidebar } from "./_components/conversation-sidebar";
import { MessageThread } from "./_components/message-thread";
import { MessageInput } from "./_components/message-input";
import { CustomerProfilePanel } from "./_components/customer-profile-panel";
import { MessageCircle } from "lucide-react";
import type { Conversation } from "@/core/domain/messaging/conversation";
import type { Message, Attachment } from "@/core/domain/messaging/message";
import type { Customer } from "@/core/domain/customers/customer";

export function MessageManagementClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Poll for new conversations every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Poll for new messages in selected conversation every 5 seconds
  useEffect(() => {
    if (!selectedConversationId) return;

    const interval = setInterval(() => {
      fetchMessages(selectedConversationId);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [selectedConversationId]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      fetchCustomer(selectedConversation?.customerId);
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
              <h2 className="text-lg font-semibold">
                {currentCustomer?.name || `Customer ${selectedConversation?.customerId.slice(-6)}`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedConversation?.platform} • {selectedConversation?.status}
              </p>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-hidden">
              <MessageThread messages={messages} />
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
