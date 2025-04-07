declare module '@transformers' {
    export interface TokenizerOptions {
        tokenize?: boolean;
        return_tensor?: boolean;
        add_generation_prompt?: boolean;
    }

    export interface AutoTokenizer {
        from_pretrained(model: string): Promise<AutoTokenizer>;
        apply_chat_template(
            messages: Array<{ role: string; content: string }>,
            options: TokenizerOptions
        ): Promise<number[]>;
        decode(tokens: number[]): string;
    }

    export const AutoTokenizer: {
        from_pretrained(model: string): Promise<AutoTokenizer>;
    };
}

declare module '@transformers/tokenizers' {
    export * from '@transformers';
}
