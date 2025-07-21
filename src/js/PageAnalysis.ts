import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { backgroundLog } from "./log";
import { AnalysisMeta } from "../types/index";

export abstract class PageAnalysis {
    protected document: Document;
    protected maxLength: number;
    public output?: string;
    public meta?: AnalysisMeta;

    constructor(document: Document, maxLength: number = 8000) {
        this.document = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html');
        this.maxLength = maxLength;
    }

    parse(): void {
        this.output = this.getOutput();
        this.meta = this.getMeta();
    }

    getMeta(): AnalysisMeta {
        return {
            type: this.constructor.name,
            length: this.output?.length || 0,
            output: this.output || ''
        };
    }

    abstract getOutput(): string;

    cleanText(text: string): string {
        let cleanedText = this.#removeExtreneousNewLines(text);
        cleanedText = this.#newLineToSpace(cleanedText);
        cleanedText = this.#replaceMultipleSpaces(cleanedText);
        return cleanedText;
    }

    #removeExtreneousNewLines(text: string): string {
        return text.replace(/\n{2,}/g, '\n');
    }

    #newLineToSpace(text: string): string {
        return text.replace(/(\r\n|\n|\r)/g, ' ');
    }

    #replaceMultipleSpaces(str: string): string {
        return str.replace(/\s+/g, ' ');
    }

    cleanNode(node: Document): Document {
        return this.stripAttributes(node);
    }

    removeUnnecessaryNodes(): void {
        const unnecessaryTags = ['script', 'style', 'noscript', 'iframe', 'embed', 'object', 'param'];
        const elementsToRemove = this.document.querySelectorAll(unnecessaryTags.join(','));

        elementsToRemove.forEach(element => {
            element.remove();
        });

        const removeComments = (node: Node): void => {
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (child.nodeType === 8) { // Comment node
                    node.removeChild(child);
                    i--;
                } else if (child.nodeType === 1) { // Element node
                    removeComments(child);
                }
            }
        };

        if (this.document.body) {
            removeComments(this.document.body);
        }

        console.log('Unnecessary nodes removed.');
    }

    stripAttributes(node: Node): Document {
        const ignoreAttributes = ["href"];

        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent?.replace(/^\s+|\s+$/g, '').replace(/\n/g, '').trim() || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            for (let i = element.attributes.length - 1; i >= 0; i--) {
                const attrName = element.attributes[i].name;
                if (!ignoreAttributes.includes(attrName)) {
                    element.removeAttribute(element.attributes[i].name);
                }
            }
            for (let i = 0; i < node.childNodes.length; i++) {
                this.stripAttributes(node.childNodes[i]);
            }
        }
        return this.document;
    }
}

export class TurndownAnalysis extends PageAnalysis {
    private turndownService: TurndownService;

    constructor(document: Document) {
        super(document);
        this.turndownService = new TurndownService();
    }

    getBody(): string {
        const body = this.document.body?.cloneNode(true) as HTMLElement;
        return this.turndownService.turndown(body?.outerHTML || '');
    }

    getOutput(): string {
        return this.getBody();
    }
}

export class HTMLAnalysis extends PageAnalysis {
    constructor(document: Document) {
        super(document);
    }

    getBodyHTML(): string {
        const body = this.document.body?.cloneNode(true) as HTMLElement;
        if (body) {
            this.cleanNode(this.document);
            return body.innerHTML;
        }
        return '';
    }

    getBodyText(): string {
        const body = this.document.body?.cloneNode(true) as HTMLElement;
        const text = body?.innerText || '';
        return this.cleanText(text);
    }

    getOutput(): string {
        return this.getBodyText();
    }
}

export class ReadabilityAnalysis extends PageAnalysis {
    private readability: any;

    constructor(document: Document) {
        super(document);
        this.readability = new Readability(this.document).parse();
        console.log(this.readability);
    }

    getTextContent(): string {
        return this.readability?.textContent || '';
    }

    getContent(): string {
        return this.readability?.content || '';
    }

    getExcerpt(): string {
        return this.readability?.excerpt || '';
    }

    getOutput(): string {
        const content = this.cleanText(this.getTextContent());
        return content;
    }
}