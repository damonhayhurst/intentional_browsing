declare module '@mozilla/readability/Readability.js' {
    export interface ReadabilityArticle {
        title: string;
        content: string;
        textContent: string;
        excerpt: string;
        length: number;
        siteName: string;
    }

    class Readability {
        constructor(document: Document);
        parse(): ReadabilityArticle;
    }

    export default Readability;
}

declare module 'turndown' {
    class TurndownService {
        turndown(html: string): string;
    }
    export default TurndownService;
}
