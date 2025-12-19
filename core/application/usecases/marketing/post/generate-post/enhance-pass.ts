import { GenerationSession } from "@/core/application/interfaces/marketing/post-gen-service";
import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass";

export class EnhanceStreamingPass implements GenerationPass {
    readonly name: PassType = 'enhance';

    private buildPrompt(ctx: PassContext, session?: GenerationSession): string {
        const { title, body, brand, contentInstruction, product: selectedProduct } = ctx;

        // Prepare brand info with defaults
        const brandInfo = brand ? [
            brand.brandVoice && `Brand Voice: ${JSON.stringify(brand.brandVoice)}`,
            brand.keyPoints?.length ? `Key Points:\n- ${brand.keyPoints.join("\n- ")}` : '',
        ].filter(Boolean).join("\n") : "";

        const initialContent = session?.draftPass?.draft || body || '';

        return `
            Enhance the following draft content. Do NOT rewrite from scratch. Improve clarity, engagement, and call-to-action.
            Initial Content: ${initialContent}
            ${brandInfo}

            Requirements:
            - Improve clarity and engagement
            - Strengthen call-to-action
            - Fix grammatical issues
            - Maintain core message from draft
            - Integrate product naturally if provided
            - Cover all key points and CTAs

            Return ONLY enhanced content as plain text, no markdown or extra formatting.
            `.trim();
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const session = ctx.cache.get<GenerationSession>(ctx.sessionId);
        const canSkip = session?.enhancePass;
        if (canSkip) {
            yield { type: 'pass:skip', pass: 'enhance' }
            return
        }
        yield { type: 'pass:start', pass: this.name };

        const prompt = this.buildPrompt(ctx, session);

        let buffer = '';
        for await (const token of ctx.llm.generateStreamingCompletion({
            systemPrompt: "You are an expert content editor. Always respond with valid string only. Never use markdown code blocks.",
            prompt,
            temperature: 0.6,
            maxTokens: 1500,
        })) {
            buffer += token;
            yield { type: 'body:token', pass: "enhance", content: token };
        }
        const enhancedData = {
            enhanced: buffer,
        }

        ctx.cache.updateSession(ctx.sessionId, { enhancePass: enhancedData });

        yield { type: 'pass:complete', pass: this.name };
    }
}
