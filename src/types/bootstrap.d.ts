declare module '**/bootstrap/js/dist/tab.js' {
    export default class Tab {
        constructor(element: Element);
        show(): void;
    }
}

declare module '*.css' {
    const content: any;
    export default content;
}
