import { HTMLAnalysis, ReadabilityAnalysis, TurndownAnalysis, PageAnalysis } from "./PageAnalysis.js";

type AnalysisConstructor = new (document: Document) => PageAnalysis;

export class PageAnalysisFactory {
    static ANALYSIS_MAP: Record<string, AnalysisConstructor[]> = {
        'default': [ReadabilityAnalysis, HTMLAnalysis],
        'youtube.com': [ReadabilityAnalysis],
    };

    static create(document: Document, lastAttempt: AnalysisConstructor | null = null): PageAnalysis {
        const domain = document.location.hostname.replace(/^www\./, '');
        let AnalysisType: AnalysisConstructor | null = null;
        let attempt = 0;
        
        while (lastAttempt !== null && !(AnalysisType && AnalysisType === lastAttempt)) {
            AnalysisType = PageAnalysisFactory.get(domain, attempt);
            attempt++;
        }
        
        AnalysisType = PageAnalysisFactory.get(domain, attempt);
        return new AnalysisType(document);
    }

    static get(domain: string, attemptIndex: number): AnalysisConstructor {
        const domainAnalyses = PageAnalysisFactory.ANALYSIS_MAP[domain] || PageAnalysisFactory.ANALYSIS_MAP['default'];
        
        if (attemptIndex >= domainAnalyses.length) {
            throw new Error(`No analysis type found for ${domain}`);
        }
        
        return domainAnalyses[attemptIndex];
    }
}