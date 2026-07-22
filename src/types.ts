export type StyleType =
  | 'Profesional'
  | 'Santai'
  | 'Storytelling'
  | 'Edukatif'
  | 'Persuasif'
  | 'SEO Friendly'
  | 'Human Like'
  | 'Expert'
  | 'Formal'
  | 'Jurnalistik';

export interface GeneratorInput {
  focusKeyword: string;
  style: StyleType;
  referenceInfo: string;
  imageUrl?: string;
  internalLinks?: string; // Lines of "Title|URL"
}

export interface ImageMetadata {
  url: string;
  alt: string;
  caption: string;
  credit: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface OverusedWordCheck {
  word: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
}

export interface AuditReport {
  passed: boolean;
  score: number; // 0 - 100
  feedback: string[];
  overusedWords: OverusedWordCheck[];
  clichesFound: string[];
  sentenceLengthVariance: number;
  sentenceLengthFeedback: string;
  introductionFeedback: string;
  conclusionFeedback: string;
}

export interface ComplianceStep {
  id: string;
  name: string;
  timestamp: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  score?: number;
  log?: string;
  details?: string;
}

export interface GeneratedArticle {
  title: string;
  metaTitle: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  contentMarkdown: string;
  contentHtml: string;
  faq: FAQItem[];
  faqSchema: string; // JSON-LD schema markup
  featuredImage: ImageMetadata;
  keywordDensity: {
    keyword: string;
    count: number;
    percentage: number;
    evaluation: string;
  };
  semanticKeywords: string[];
  complianceHistory: {
    iteration: number;
    score: number;
    passed: boolean;
    timestamp: string;
    report: AuditReport;
    isOriginal: boolean;
    articleTitle: string;
  }[];
  helpfulContentLog?: HelpfulContentLog;
  semanticHtmlLog?: SemanticHtmlLog;
}

export interface SemanticHtmlLog {
  knowledgeVersion: string;
  evaluationResult: string;
  validationResult: string;
  revisionCount: number;
  issuesDetected: string[];
  revisionRecommendations: string[];
  finalStatus: string;
}

export interface HelpfulContentLog {
  knowledgeVersion: string;
  evaluationResult: string;
  validationResult: string;
  revisionCount: number;
  finalStatus: string;
}

export interface GoogleHelpfulMetadata {
  source: string;
  sourceUrl: string;
  version: string;
  lastSynced: string;
  totalRules: number;
  totalPrinciples: number;
  totalSelfAssessmentQuestions: number;
  generatedDate: string;
}

export interface StoredGoogleHelpfulKnowledge {
  metadata: GoogleHelpfulMetadata;
  helpfulContentPrinciples: string[];
  peopleFirstPrinciples: string[];
  reliabilityPrinciples: string[];
  userSatisfactionPrinciples: string[];
  experienceSignals: string[];
  qualityEvaluationQuestions: string[];
  contentReviewQuestions: string[];
  searchIntentGuidance: string[];
  readerValuePrinciples: string[];
}

export interface ApiSettings {
  visitorKeys: string[];
}

export interface KnowledgeMetadata {
  source: string;
  sourceUrl: string;
  version: string;
  lastSynced: string;
  rulesCount: number;
  patternsCount: number;
  recommendationsCount: number;
}

export interface StoredKnowledge {
  metadata: KnowledgeMetadata;
  forbiddenWords: {
    word: string;
    severity: 'high' | 'medium' | 'low';
    max: number;
    penalty: number;
    message: string;
  }[];
  clicheTransitions: string[];
  introCliches: string[];
  generalRecommendations: string[];
}

export interface EditorialKnowledgeMetadata {
  source: string;
  sourceUrl: string;
  version: string;
  lastSynced: string;
  editorialPrinciples: number;
  editorialChecks: number;
  revisionStrategies: number;
}

export interface StoredEditorialKnowledge {
  metadata: EditorialKnowledgeMetadata;
  principles: string[];
  editorialChecks: string[];
  revisionStrategies: string[];
}

export interface SemanticHtmlMetadata {
  source: string;
  sourceUrl: string;
  version: string;
  lastSynced: string;
  totalElements: number;
  generatedDate: string;
}

export interface ElementSemanticRule {
  tag: string;
  definition: string;
  purpose: string;
  semanticMeaning: string;
  usageCondition: string;
  relationships: string;
  commonPitfalls: string;
}

export interface StoredSemanticHtmlKnowledge {
  metadata: SemanticHtmlMetadata;
  supportedElements: string[];
  elementRules: ElementSemanticRule[];
  semanticRules: string[];
  formattingValidationRules: string[];
}


