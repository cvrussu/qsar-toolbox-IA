// Tipos de datos para el módulo QSAR Toolbox
export interface QSARQuery {
  substance: string;
  endpoints: string[];
  language: 'es' | 'en';
  queryType: 'natural' | 'structured';
}

export interface ToxicologyEndpoint {
  code: string;
  name_es: string;
  name_en: string;
  description_es: string;
  oecd_guideline?: string;
  category: 'acute' | 'irritation' | 'sensitization' | 'environmental' | 'physicochemical';
}

export interface QSARResult {
  endpoint: string;
  substance: string;
  prediction: {
    value: string | number;
    category: 'low' | 'moderate' | 'high' | 'very_high';
    confidence: number; // 0-1
    unit?: string;
  };
  explanation_es: string;
  regulatory_relevance_es: string;
  similar_substances?: string[];
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  results?: QSARResult[];
  timestamp: string;
}

export interface PDFReportData {
  substance: string;
  results: QSARResult[];
  generated_at: string;
  user_query: string;
}

// Endpoints toxicológicos soportados
export const TOXICOLOGY_ENDPOINTS: ToxicologyEndpoint[] = [
  {
    code: 'acute_oral',
    name_es: 'Toxicidad Aguda Oral',
    name_en: 'Acute Oral Toxicity',
    description_es: 'Evaluación de toxicidad tras administración oral única',
    oecd_guideline: 'OECD TG 401/423/425',
    category: 'acute'
  },
  {
    code: 'acute_dermal',
    name_es: 'Toxicidad Aguda Dérmica',
    name_en: 'Acute Dermal Toxicity',
    description_es: 'Evaluación de toxicidad tras aplicación dérmica única',
    oecd_guideline: 'OECD TG 402',
    category: 'acute'
  },
  {
    code: 'acute_inhalation',
    name_es: 'Toxicidad Aguda por Inhalación',
    name_en: 'Acute Inhalation Toxicity',
    description_es: 'Evaluación de toxicidad tras exposición inhalatoria',
    oecd_guideline: 'OECD TG 403/436',
    category: 'acute'
  },
  {
    code: 'skin_irritation',
    name_es: 'Irritación/Corrosión Dérmica',
    name_en: 'Skin Irritation/Corrosion',
    description_es: 'Potencial irritante o corrosivo para la piel',
    oecd_guideline: 'OECD TG 404',
    category: 'irritation'
  },
  {
    code: 'eye_irritation',
    name_es: 'Irritación Ocular',
    name_en: 'Eye Irritation',
    description_es: 'Potencial irritante para los ojos',
    oecd_guideline: 'OECD TG 405',
    category: 'irritation'
  },
  {
    code: 'skin_sensitization',
    name_es: 'Sensibilización Dérmica',
    name_en: 'Skin Sensitization',
    description_es: 'Potencial sensibilizante para la piel',
    oecd_guideline: 'OECD TG 406/429/442A/442B',
    category: 'sensitization'
  },
  {
    code: 'bioaccumulation',
    name_es: 'Bioacumulación',
    name_en: 'Bioaccumulation',
    description_es: 'Factor de bioacumulación en organismos acuáticos',
    oecd_guideline: 'OECD TG 305',
    category: 'environmental'
  },
  {
    code: 'biodegradation',
    name_es: 'Biodegradación',
    name_en: 'Biodegradation',
    description_es: 'Capacidad de degradación biológica en el ambiente',
    oecd_guideline: 'OECD TG 301',
    category: 'environmental'
  }
];