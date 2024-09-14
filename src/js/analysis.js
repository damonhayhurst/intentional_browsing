import Readability from "@mozilla/readability/Readability.js";
import { backgroundLog } from "./log.js";
import { fetchChatCompletion } from "./completion.js";
import { ReaderLMSettings } from "./settings.js";

export class PageAnalysis {

    constructor() {
        this.document = document.cloneNode(true);
        this.readability = new Readability(this.document).parse();
    }

    getBreakdownWithoutTextContent() {
        return {
            "title": this.#parseTitle(),
            "headings": this.#parseHeadings(),
            "semantic elements": this.#parseSemanticElements(),
            "images": this.#parseImages(),
            "links": this.#parseLinks(),
            "has forms": this.#parseForms().length > 0,
        }
    }

    getBreakdown() {
        return {
            "title": this.#parseTitle(),
            "text content": this.#parseTextContent(),
            "headings": this.#parseHeadings(),
            "semantic elements": this.#parseSemanticElements(),
            "images": this.#parseImages(),
            "links": this.#parseLinks(),
            "has forms": this.#parseForms().length > 0,
        }
    }

    getTextContent() {
        return {
            "title": this.#parseTitle(),
            "text content": this.#parseTextContent()
        }
    }

    getHtml() {
        return this.#parseHtmlContent();
    }

    getTitleAndBodyHtml() {
        return {
            "title": this.#parseTitle(),
            "body": this.#parseBodyHTML()
        }
    }

    getExcerpt() {
        return this.#parseExcerpt();
    }

    #parseBodyHTML() {
        let body = this.document.querySelector('body').cloneNode(true);
        return this.#format(body.innerHTML)
    }

    #parseHtmlContent() {
        return this.#format(this.readability.content);
    }

    #parseTitle() {
        return this.#format(this.readability.title);
    }

    #parseTextContent() {
        return this.#format(this.readability.textContent);
    }

    #parseHeadings() {
        let headings = {};
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            headings[tag] = [...this.document.querySelectorAll(tag)].map(el => el.innerText);
        });
        return headings;
    }

    #parseSemanticElements() {
        // semanticTags = ['article', 'aside', 'details', 'figcaption', 'figure', 'footer', 'header', 'main', 'mark', 'nav', 'section', 'summary', 'time'];
        let semanticTags = ['article', 'section', 'nav', 'aside'];
        let semanticElements = {};

        semanticTags.forEach(tag => {
            semanticElements[tag] = [...this.document.querySelectorAll(tag)].map(element => element.innerText);
        });

        return semanticElements;
    }

    #parseImages() {
        let images = [...this.document.querySelectorAll('img')].map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt')
        }));
        return images;
    }

    #parseLinks() {
        const anchors = document.querySelectorAll('a');
        const links = Array.from(anchors).map(anchor => ({
            href: anchor.href,
            text: anchor.textContent.trim()
        }));
        return links
    }

    #parseForms() {
        return [...this.document.querySelectorAll('form')];
    }

    #removeLineBreaks(content) {
        const re = /\n(\s*){2,}/g;
        if (content) {
            content.replace(re, "\n ");
        }
        return content;
    }

    #parseExcerpt() {
        return this.#format(this.readability.excerpt);
    }

    #format(content) {
        content = this.#removeLineBreaks(content);
        return content;
    }

    getPriorityBasedAnalysisContent() {
        let analysisFunctionsByPriority = [this.getHtml, this.getTitleAndBodyHtml, this.getBreakdown, this.getBreakdownWithoutTextContent, this.getTextContent, this.getExcerpt]

        const maxLength = 2000
        for (let fn of analysisFunctionsByPriority) {
            let result = fn.bind(this)();
            // console.log(result);
            let resultJson = JSON.stringify(result, (key, value) => {
                // console.log(value);
                if (value === undefined || value === "") {
                    return undefined; // Exclude from the final string
                }
                else {
                    return value;
                }
            })
            if (resultJson.length < maxLength) {
                backgroundLog(fn.name)
                return result;
            }
        }
    }

}




