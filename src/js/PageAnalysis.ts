import Readability, {ReadabilityArticle} from "@mozilla/readability";
import TurndownService from "turndown";
import { backgroundLog } from "./log";

interface PageMeta {
    type: string;
    length: number;
    output: string;
}

export class PageAnalysis {
    protected document: Document;
    protected maxLength: number;
    public output: string = '';
    public meta: PageMeta = { type: '', length: 0, output: '' };

    constructor(document: Document, maxLength: number = 8000) {
        this.document = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html');
        this.maxLength = maxLength;
        this.parse();
    }

    parse(): void {
        this.output = this.getOutput();
        this.meta = this.getMeta();
    }

    protected getMeta(): PageMeta {
        return {
            type: this.constructor.name,
            length: this.output.length,
            output: this.output
        };
    }

    protected cleanText(text: string): string {
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

    protected cleanNode(node: Node): void {
        this.stripAttributes(node);
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
                if (child.nodeType === 8) {
                    node.removeChild(child);
                    i--;
                } else if (child.nodeType === 1) {
                    removeComments(child);
                }
            }
        };

        if (this.document.body) {
            removeComments(this.document.body);
        }

        console.log('Unnecessary nodes removed.');
    }

    protected stripAttributes(node: Node): void {
        const ignoreAttributes = ["href"];

        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = (node.textContent || '').replace(/^\s+|\s+$/g, '').replace(/\n/g, '').trim();
        } else if (node.nodeType === Node.ELEMENT_NODE && node instanceof Element) {
            for (let i = node.attributes.length - 1; i >= 0; i--) {
                const attrName = node.attributes[i].name;
                if (!ignoreAttributes.includes(attrName)) {
                    node.removeAttribute(attrName);
                }
            }
            for (let child of node.childNodes) {
                this.stripAttributes(child);
            }
        }
    }

    protected getOutput(): string {
        throw new Error("getOutput must be implemented by derived classes");
    }
}

export class TurndownAnalysis extends PageAnalysis {
    private turndownService: TurndownService;

    constructor(document: Document) {
        super(document);
        this.turndownService = new TurndownService();
    }

    protected getBody(): string {
        const body = this.document.body?.cloneNode(true);
        return body ? this.turndownService.turndown(body instanceof HTMLElement ? body.outerHTML : '') : '';
    }

    protected getOutput(): string {
        return this.getBody();
    }
}

export class HTMLAnalysis extends PageAnalysis {
    constructor(document: Document) {
        super(document);
    }

    protected getBodyHTML(): string {
        const body = this.document.body?.cloneNode(true);
        if (body) {
            this.cleanNode(body);
            return body instanceof HTMLElement ? body.innerHTML : '';
        }
        return '';
    }

    protected getBodyText(): string {
        const body = this.document.body?.cloneNode(true);
        if (body instanceof HTMLElement) {
            const text = body.innerText;
            return this.cleanText(text);
        }
        return '';
    }

    protected getOutput(): string {
        return this.getBodyText();
    }
}

export class ReadabilityAnalysis extends PageAnalysis {
    private readability: ReadabilityArticle;

    constructor(document: Document) {
        super(document);
        this.readability = new Readability(this.document).parse();
        console.log(this.readability);
    }

    getTextContent(): string {
        return this.readability.textContent;
    }

    getContent(): string {
        return this.readability.content;
    }

    getExcerpt(): string {
        return this.readability.excerpt;
    }

    protected getOutput(): string {
        const content = this.cleanText(this.getTextContent());
        return content;
    }
}
