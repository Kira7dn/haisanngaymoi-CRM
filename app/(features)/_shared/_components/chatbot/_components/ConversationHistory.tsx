"use client"

import { useState } from "react"
import { History, MessageSquare, Trash2, Clock, Plus } from "lucide-react"
import { Button } from "@shared/ui/button"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import type { CopilotConversation } from "@/core/domain/copilot-conversation"

interface ConversationHistoryProps {
  conversations: CopilotConversation[]
  currentConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  loading?: boolean
}

export function ConversationHistory({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  loading = false
}: ConversationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-6 bottom-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
        aria-label="Open conversation history"
        title="Lịch sử trò chuyện"
      >
        <History className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed left-6 bottom-6 z-40 w-80 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <h3 className="font-semibold">Lịch sử trò chuyện</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-indigo-600 rounded transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <Button
          onClick={onNewConversation}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Cuộc trò chuyện mới
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Đang tải...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
            <p className="text-xs mt-1">Bắt đầu trò chuyện mới với AI</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === currentConversationId
            const lastMessage = conversation.messages[conversation.messages.length - 1]
            const messageCount = conversation.messages.length

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
                    }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${isActive
                        ? "text-indigo-900 dark:text-indigo-100"
                        : "text-gray-900 dark:text-gray-100"
                      }`}>
                      {conversation.title || "Untitled conversation"}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {lastMessage?.content.substring(0, 50)}
                      {lastMessage && lastMessage.content.length > 50 ? "..." : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(conversation.updatedAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                      <span className="ml-auto">
                        {messageCount} tin nhắn
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {conversations.length} cuộc trò chuyện
        </p>
      </div>
    </div>
  )
}
