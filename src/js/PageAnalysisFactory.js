import {HTMLAnalysis, ReadabilityAnalysis, TurndownAnalysis, ReadabilityTurndownAnalysis} from "./PageAnalysis.js";

export class PageAnalysisFactory {

  static ANALYSIS_MAP = {
    'default': ReadabilityAnalysis,
    'youtube.com': ReadabilityAnalysis,
  };

  static create(document) {  
    this.domain = document.location.hostname.replace(/^www\./, '');
    const AnalysisType = PageAnalysisFactory.ANALYSIS_MAP[this.domain] || PageAnalysisFactory.ANALYSIS_MAP['default'];
    return new AnalysisType(document);
  }

}
