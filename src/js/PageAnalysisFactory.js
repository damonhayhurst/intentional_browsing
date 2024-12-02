import {HTMLAnalysis, ReadabilityAnalysis, TurndownAnalysis, ReadabilityTurndownAnalysis} from "./PageAnalysis.js";

export class PageAnalysisFactory {

  static ANALYSIS_MAP = {
    'default': [ ReadabilityAnalysis, HTMLAnalysis ],
    'youtube.com': [ ReadabilityAnalysis ],
  };

  static create(document, lastAttempt = null) {  
    const domain = document.location.hostname.replace(/^www\./, '');
    let AnalysisType = null, attempt = 0
    while (lastAttempt !== null && !(AnalysisType instanceof lastAttempt)) {
      AnalysisType = PageAnalysisFactory.get(domain, attempt)
      attempt++
    }
    AnalysisType = PageAnalysisFactory.get(domain, attempt)
    return new AnalysisType(document);
  }

  static get(domain, attemptIndex) {
    const domainAnalyses = PageAnalysisFactory.ANALYSIS_MAP[domain] || PageAnalysisFactory.ANALYSIS_MAP['default'];
    if (attemptIndex == domainAnalyses.length) {
      throw new Error(`No analysis type found for ${domain}`);
    }
    return domainAnalyses[attemptIndex];
  }

}
