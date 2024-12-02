import Readability from "@mozilla/readability/Readability.js";
import TurndownService from "turndown";
import { backgroundLog } from "./log.js";

export class PageAnalysis {

    constructor(document, maxLength = 8000) {
        this.document = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html');
        this.maxLength = maxLength;
    }

    parse() {
        this.output = this.getOutput();
        this.meta = this.getMeta();
    }

    getMeta() {
        return {
            type: this.constructor.name,
            length: this.output.length,
            output: this.output
        }
    }

    cleanText(text) {
        let cleanedText = this.#removeExtreneousNewLines(text);
        cleanedText = this.#newLineToSpace(cleanedText);
        cleanedText = this.#replaceMultipleSpaces(cleanedText);
        return cleanedText;
    }

    #removeExtreneousNewLines(text) {
        return text
            .replace(/\n{2,}/g, '\n')
    }

    #newLineToSpace(text) {
        return text.replace(/(\r\n|\n|\r)/g, ' ');
    }

    #replaceMultipleSpaces(str) {
        return str.replace(/\s+/g, ' ');
    }

    cleanNode(node) {
        return this.stripAttributes(document)
    }

    removeUnnecessaryNodes() {
        // List of unnecessary tag names
        const unnecessaryTags = ['script', 'style', 'noscript', 'iframe', 'embed', 'object', 'param'];

        // Select all elements matching the unnecessary tags
        const elementsToRemove = document.querySelectorAll(unnecessaryTags.join(','));

        // Remove each unnecessary element
        elementsToRemove.forEach(element => {
            element.remove();
        });

        // Remove comments
        const removeComments = (node) => {
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

        removeComments(document.body);

        console.log('Unnecessary nodes removed.');
    }


    stripAttributes(node) {
        const ignoreAttributes = ["href"]

        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent.replace(/^\s+|\s+$/g, '').replace(/\n/g, '').trim();
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let i = node.attributes.length - 1; i >= 0; i--) {
                const attrName = node.attributes[i].name;
                if (!ignoreAttributes.includes(attrName)) {
                    node.removeAttribute(node.attributes[i].name);
                }
            }
            for (let child of node.childNodes) {
                this.stripAttributes(child);
            }
        }
    }

}

export class TurndownAnalysis extends PageAnalysis {

    constructor(document) {
        super(document);
        this.turndownService = new TurndownService();
    }

    getBody() {
        let body = this.document.body.cloneNode(true);
        return this.turndownService.turndown(body.outerHTML)
    }

    getOutput() {
        return this.getBody();
    }

}

export class HTMLAnalysis extends PageAnalysis {

    constructor(document) {
        super(document);
    }

    getBodyHTML() {
        let body = this.document.body.cloneNode(true);
        this.cleanNode(body);
        return body.innerHTML
    }

    getBodyText() {
        const body = this.document.body.cloneNode(true)
        let text = body.innerText;
        return this.cleanText(text)
    }

    getOutput() {
        return this.getBodyText();
    }

}

export class ReadabilityAnalysis extends PageAnalysis {

    constructor(document) {
        super(document);
        this.readability = new Readability(this.document).parse();
        console.log(this.readability);
    }

    getTextContent() {
        return this.readability.textContent;
    }

    getContent() {
        return this.readability.content;
    }

    getExcerpt() {
        return this.readability.excerpt;
    }

    // getContent() {
    //     const content = this.readability.content;
    //     let node = new DOMParser().parseFromString(content, 'text/html');
    //     this.stripAttributes(node);
    //     // let text = node.querySelector('body').innerHTML;
    //     // text = this.cleanText(this.readability.textContent);
    //     return node.documentElement.outerHTML;
    // }

    getOutput() {
        let content = this.cleanText(this.getTextContent());
        return content;
    }
}

// export class PageAnalysis {


//     constructor(document) {
//         this.clonedDocument = document.documentElement.cloneNode(true);
//         this.readability = new Readability(this.document.cloneNode(true)).parse();
//         this.ReaderLM = new ReaderLMSettings();
//     }

//     #cleanText(text) {
//         return text
//             // .replace(/\n{2,}/g, '\n')  // Replace multiple newlines with a single newline
//             // .replace(/\s+/g, ' ')  // Replace multiple whitespace characters with a single space
//             // .replace(/\n\s*/g, '\n')  // Remove whitespace after newlines
//             // .replace(/\s*\n/g, '\n')  // Remove whitespace before newlines
//             // .trim();  // Remove leading and trailing whitespace
//     }

//     get(charSize) {
//         let content = this.getHTML();
//         console.log(content)
//         console.log(content.length)
//         return content
//     }

//     

//     getBodyHTML() {
//         let body = this.clonedDocument.documentElement.querySelector('body').cloneNode(true);
//         this.#stripAttributes(body);
//         return body.innerHTML
//     }

//     getHTML() {
//         const html = this.clonedDocument
//         this.#stripAttributes(html.documentElement);
//         return html.documentElement.outerHTML;
//     }



//     #stripWhiteSpace(node) {
//         if (node.nodeType === Node.ELEMENT_NODE) {
//             let text = node.textContent.trim();
//             if (text !== '') {
//                 node.textContent = text;
//             }
//         }
//         for (let child of node.childNodes) {
//             this.#stripWhiteSpace(child);
//         }   
//     }

// }

// class OldPageAnalysis {

//     constructor() {
//         this.document = document.cloneNode(true);
//         this.readability = new Readability(this.document).parse();
//     }

//     getBreakdownWithoutTextContent() {
//         return {
//             "title": this.#parseTitle(),
//             "headings": this.#parseHeadings(),
//             "semantic elements": this.#parseSemanticElements(),
//             "images": this.#parseImages(),
//             "links": this.#parseLinks(),
//             "has forms": this.#parseForms().length > 0,
//         }
//     }

//     getBreakdown() {
//         return {
//             "title": this.#parseTitle(),
//             "text content": this.#parseTextContent(),
//             "headings": this.#parseHeadings(),
//             "semantic elements": this.#parseSemanticElements(),
//             "images": this.#parseImages(),
//             "links": this.#parseLinks(),
//             "has forms": this.#parseForms().length > 0,
//         }
//     }

//     getTextContent() {
//         return {
//             "title": this.#parseTitle(),
//             "text content": this.#parseTextContent()
//         }
//     }

//     getHtml() {
//         return this.#parseHtmlContent();
//     }

//     getTitleAndBodyHtml() {
//         return {
//             "title": this.#parseTitle(),
//             "body": this.getBodyHTML()
//         }
//     }

//     getExcerpt() {
//         return this.#parseExcerpt();
//     }

//     getBodyHTML() {
//         let body = this.document.querySelector('body').cloneNode(true);
//         this.#format(body)
//         return body.innerHTML
//     }

//     #parseHtmlContent() {
//         return this.#format(this.readability.content);
//     }

//     #parseTitle() {
//         return this.#format(this.readability.title);
//     }

//     #parseTextContent() {
//         return this.#format(this.readability.textContent);
//     }

//     #parseHeadings() {
//         let headings = {};
//         ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
//             headings[tag] = [...this.document.querySelectorAll(tag)].map(el => el.innerText);
//         });
//         return headings;
//     }

//     #parseSemanticElements() {
//         // semanticTags = ['article', 'aside', 'details', 'figcaption', 'figure', 'footer', 'header', 'main', 'mark', 'nav', 'section', 'summary', 'time'];
//         let semanticTags = ['article', 'section', 'nav', 'aside'];
//         let semanticElements = {};

//         semanticTags.forEach(tag => {
//             semanticElements[tag] = [...this.document.querySelectorAll(tag)].map(element => element.innerText);
//         });

//         return semanticElements;
//     }

//     #parseImages() {
//         let images = [...this.document.querySelectorAll('img')].map(img => ({
//             src: img.getAttribute('src'),
//             alt: img.getAttribute('alt')
//         }));
//         return images;
//     }

//     #parseLinks() {
//         const anchors = document.querySelectorAll('a');
//         const links = Array.from(anchors).map(anchor => ({
//             href: anchor.href,
//             text: anchor.textContent.trim()
//         }));
//         return links
//     }

//     #parseForms() {
//         return [...this.document.querySelectorAll('form')];
//     }

//     #removeLineBreaks(node = document.body) {
//         // If this is a text node, remove its line breaks
//         if (node.nodeType === Node.TEXT_NODE) {
//             node.textContent = node.textContent.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();
//         } else {
//             // If it's not a text node, recursively process its children
//             for (let i = 0; i < node.childNodes.length; i++) {
//                 this.#removeLineBreaks(node.childNodes[i]);
//             }
//         }
//     }

//     #stripAttributes(node) {
//         if (node.nodeType === Node.ELEMENT_NODE) {
//             // Remove all attributes from the element except text
//             for (let i = 0; i < node.attributes.length; i++) {
//                 if (node.attributes[i].nodeName !== 'text') {
//                     node.removeAttribute(node.attributes[i].name);
//                 }
//             }
//             for (let child of node.childNodes) {
//                 this.#stripAttributes(child);
//             }
//         }
//     }

//     #parseExcerpt() {
//         return this.#format(this.readability.excerpt);
//     }

//     #format(node) {
//         this.#stripAttributes(node);
//         this.#removeLineBreaks(node);
//     }

//     getPriorityBasedAnalysisContent() {
//         let analysisFunctionsByPriority = [this.getHtml, this.getTitleAndBodyHtml, this.getBreakdown, this.getBreakdownWithoutTextContent, this.getTextContent, this.getExcerpt]

//         const maxLength = 2000
//         for (let fn of analysisFunctionsByPriority) {
//             let result = fn.bind(this)();
//             // console.log(result);
//             let resultJson = JSON.stringify(result, (key, value) => {
//                 // console.log(value);
//                 if (value === undefined || value === "") {
//                     return undefined; // Exclude from the final string
//                 }
//                 else {
//                     return value;
//                 }
//             })
//             if (resultJson.length < maxLength) {
//                 backgroundLog(fn.name)
//                 return result;
//             }
//         }
//     }

// }




