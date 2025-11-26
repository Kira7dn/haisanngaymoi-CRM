"use client";

import { User, Mail, Phone, MapPin, Calendar, Tag } from "lucide-react";
import type { Customer } from "@/core/domain/customers/customer";
import type { Conversation } from "@/core/domain/messaging/conversation";
import { ScrollArea } from "@/@shared/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/@shared/ui/avatar";
import { Badge } from "@/@shared/ui/badge";
import { Separator } from "@/@shared/ui/separator";

interface CustomerProfilePanelProps {
  customer?: Customer;
  conversation?: Conversation;
}

export function CustomerProfilePanel({
  customer,
  conversation,
}: CustomerProfilePanelProps) {
  if (!customer) {
    return (
      <div className="flex h-full items-center justify-center border-l p-8 text-center text-muted-foreground">
        <p>Select a conversation to view customer details</p>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "vip":
        return "bg-yellow-500 text-yellow-50";
      case "premium":
        return "bg-purple-500 text-purple-50";
      case "regular":
        return "bg-blue-500 text-blue-50";
      default:
        return "bg-gray-500 text-gray-50";
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-full flex-col border-l bg-background">
      <ScrollArea className="flex-1">
        {/* Header */}
        <div className="p-6 text-center">
          <Avatar className="mx-auto h-20 w-20">
            <AvatarFallback className="text-2xl">
              {customer.name?.charAt(0).toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-4 text-lg font-semibold">{customer.name || "Unknown Customer"}</h3>
          <div className="mt-2 flex items-center justify-center gap-2">
            {conversation && (
              <Badge variant="outline">{conversation.platform}</Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div className="p-6">
          <h4 className="mb-4 text-sm font-semibold text-muted-foreground">
            CONTACT INFORMATION
          </h4>
          <div className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{customer.address}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Conversation Details */}
        {conversation && (
          <>
            <div className="p-6">
              <h4 className="mb-4 text-sm font-semibold text-muted-foreground">
                CONVERSATION DETAILS
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={conversation.status === "open" ? "default" : "secondary"}>
                    {conversation.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-medium">{conversation.platform}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(conversation.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Message</span>
                  <span>{formatDate(conversation.lastMessageAt)}</span>
                </div>
                {conversation.assignedTo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assigned To</span>
                    <span className="font-medium">Agent #{conversation.assignedTo}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Customer Stats */}
        <div className="p-6">
          <h4 className="mb-4 text-sm font-semibold text-muted-foreground">
            CUSTOMER STATS
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(customer.createdAt)}</p>
              </div>
            </div>
            {customer.primarySource && (
              <div className="flex items-center gap-3 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">Source</p>
                  <p className="font-medium capitalize">{customer.primarySource}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {customer.notes && (
          <>
            <Separator />
            <div className="p-6">
              <h4 className="mb-4 text-sm font-semibold text-muted-foreground">
                NOTES
              </h4>
              <p className="text-sm text-muted-foreground">{customer.notes}</p>
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
