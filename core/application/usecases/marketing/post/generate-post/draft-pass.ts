import { GenerationEvent, GenerationPass, PassContext, PassType } from "./stream-gen-multi-pass";
import { GenerationSession } from "@/core/application/interfaces/marketing/post-gen-service";

export class DraftStreamingPass implements GenerationPass {
    readonly name: PassType = 'draft';

    private buildPrompt(ctx: PassContext, session?: GenerationSession): string {
        const { title, body, brand, product: selectedProduct, contentInstruction } = ctx;
        const officialTitle = session?.outlinePass?.title || title;

        // Brand info
        const brandInfo = brand ? [
            brand.brandDescription && `Brand Overview: ${brand.brandDescription}`,
            brand.brandVoice && `Brand Voice: ${JSON.stringify(brand.brandVoice)}`,
            brand.contentStyle && `Content Style: ${brand.contentStyle}`,
            brand.language && `Language: ${brand.language}`,
            brand.keyPoints?.length ? `Key Points:\n- ${brand.keyPoints.join("\n- ")}` : '',
            brand.ctaLibrary?.length ? `CTA Library:\n- ${brand.ctaLibrary.join("\n- ")}` : '',
        ].filter(Boolean).join("\n") : '';

        // Product info
        const productInfo = selectedProduct?.url ? [
            "Product to include in content (if applicable):",
            selectedProduct.name ? `- Name: ${selectedProduct.name}` : '',
            selectedProduct.detail ? `- Details: ${selectedProduct.detail}` : '',
            selectedProduct.url ? `- URL: ${selectedProduct.url}` : ''
        ].filter(Boolean).join("\n") : '';

        return `
            Write the full content based on this outline.

            ${officialTitle ? `Title: ${officialTitle}` : ''}
            ${body ? `Initial content: ${body}` : ''}

            ${brandInfo}
            ${productInfo}
            ${session?.outlinePass?.outline ? `Outline: ${session.outlinePass.outline}` : ''}
            ${contentInstruction ? `User Instruction: ${contentInstruction}` : ''}

            Requirements:
            - Write engaging, natural content
            - Follow the brand voice and style
            - Include a clear call-to-action
            - Return ONLY plain text, no markdown or extra formatting
            `.trim();
    }

    async *execute(ctx: PassContext): AsyncGenerator<GenerationEvent> {
        const session = ctx.cache.get<GenerationSession>(ctx.sessionId);
        const canSkip = session?.draftPass;
        if (canSkip) {
            yield { type: 'pass:skip', pass: 'draft' }
            return
        }
        yield { type: 'pass:start', pass: this.name };

        const prompt = this.buildPrompt(ctx, session);

        let buffer = '';
        for await (const token of ctx.llm.generateStreamingCompletion({
            systemPrompt: "You are a professional content writer. Always respond with valid string only. Never use markdown code blocks.",
            prompt,
            temperature: 0.7,
            maxTokens: 1500,
        })) {
            buffer += token;
            yield { type: 'body:token', pass: "draft", content: token };
        }

        // Chỉ lưu content body vào session
        ctx.cache.updateSession(ctx.sessionId, {
            draftPass: {
                draft: buffer,
            },
        });

        yield { type: 'pass:complete', pass: this.name };
    }
}
