import { PageObserver } from "./PageObserver.js";

interface PageObserverOptions {
    timeoutDuration: number;
    debounceWait: number;
    debounceMaxWait: number;
}

type DomainOptionsMap = {
    [key: string]: PageObserverOptions;
};

export class PageObserverFactory {
    static readonly OPTIONS_MAP: DomainOptionsMap = {
        'default': {
            timeoutDuration: 5000,
            debounceWait: 1000,
            debounceMaxWait: 2000
        },
        'youtube.com': {
            timeoutDuration: 8000,  // YouTube tends to load content dynamically
            debounceWait: 2000,     // More wait time for dynamic content
            debounceMaxWait: 3000
        },
        'reddit.com': {
            timeoutDuration: 7000,  // Reddit has infinite scroll and dynamic loading
            debounceWait: 1500,     // Balance between responsiveness and performance
            debounceMaxWait: 2500   // Cap for heavy content loads
        },
        'twitter.com': {
            timeoutDuration: 6000,  // Twitter's dynamic timeline
            debounceWait: 1200,     // Quick updates for real-time content
            debounceMaxWait: 2000
        },
        'x.com': {                 // Alternative domain for Twitter
            timeoutDuration: 6000,
            debounceWait: 1200,
            debounceMaxWait: 2000
        },
        'facebook.com': {
            timeoutDuration: 7000,  // Facebook's complex dynamic content
            debounceWait: 1500,     // Handle frequent feed updates
            debounceMaxWait: 2500
        },
        'linkedin.com': {
            timeoutDuration: 6000,  // LinkedIn's professional feed
            debounceWait: 1200,     // Professional content loads more predictably
            debounceMaxWait: 2000
        },
        'instagram.com': {
            timeoutDuration: 6500,  // Instagram's image-heavy content
            debounceWait: 1300,     // Balance for media loading
            debounceMaxWait: 2200
        }
    };

    static create(target: Node, domain: string | null = null): PageObserver {
        if (!domain && target.ownerDocument) {
            domain = target.ownerDocument.location.hostname.replace(/^www\./, '');
        }
        const options = PageObserverFactory.getOptions(domain);
        return new PageObserver(target, options);
    }

    static getOptions(domain: string | null): PageObserverOptions {
        if (!domain) {
            return PageObserverFactory.OPTIONS_MAP['default'];
        }
        return PageObserverFactory.OPTIONS_MAP[domain] || PageObserverFactory.OPTIONS_MAP['default'];
    }
}
