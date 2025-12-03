/**
 * LLM Service using OpenAI API
 * Provides AI capabilities for chatbot and content generation
 */

import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";

/**
 * LLM Request configuration
 */
export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * LLM Response
 */
export interface LLMResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

/**
 * LLM Service class
 */
export class LLMService {
  private client: OpenAI;
  private readonly defaultModel = "gpt-4o-mini";
  private readonly defaultMaxTokens = 1024;
  private readonly defaultTemperature = 0.7;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    this.client = new OpenAI({ apiKey });
  }

  /**
   * Generate completion using OpenAI API
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const messages: ChatCompletionMessageParam[] = [];

      if (request.systemPrompt) {
        messages.push({
          role: "system",
          content: request.systemPrompt,
        } as const);
      }

      messages.push({
        role: "user",
        content: request.prompt,
      } as const);

      const response = await this.client.chat.completions.create({
        model: request.model || this.defaultModel,
        max_tokens: request.maxTokens || this.defaultMaxTokens,
        temperature: request.temperature ?? this.defaultTemperature,
        messages,
      });

      const textContent = response.choices[0]?.message?.content ?? "";

      return {
        content: textContent,
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
        },
        model: response.model ?? request.model ?? this.defaultModel,
      };
    } catch (error) {
      console.error("LLM Service Error:", error);
      throw new Error(
        `Failed to generate completion: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Generate streaming completion (OpenAI Streaming)
   */
  async *generateStreamingCompletion(
    request: LLMRequest
  ): AsyncGenerator<string, void, unknown> {
    try {
      const messages: ChatCompletionMessageParam[] = [];

      if (request.systemPrompt) {
        messages.push({
          role: "system",
          content: request.systemPrompt,
        } as const);
      }

      messages.push({
        role: "user",
        content: request.prompt,
      } as const);

      const stream = await this.client.chat.completions.create({
        model: request.model || this.defaultModel,
        max_tokens: request.maxTokens || this.defaultMaxTokens,
        temperature: request.temperature ?? this.defaultTemperature,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    } catch (error) {
      console.error("LLM Streaming Error:", error);
      throw new Error(
        `Failed to generate streaming completion: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check if API key is configured
   */
  static isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}

/**
 * Singleton instance
 */
let llmServiceInstance: LLMService | null = null;

/**
 * Get LLM Service instance
 */
export function getLLMService(): LLMService {
  if (!llmServiceInstance) {
    if (!LLMService.isConfigured()) {
      throw new Error(
        "LLM Service is not configured. Please set OPENAI_API_KEY environment variable."
      );
    }
    llmServiceInstance = new LLMService();
  }
  return llmServiceInstance;
}
