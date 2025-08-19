// Parser de lenguaje natural en español para consultas QSAR
import { QSARQuery, TOXICOLOGY_ENDPOINTS } from '../types/qsar';

export class SpanishQSARParser {
  private substancePatterns = [
    /(?:sustancia|compuesto|químico|producto)\s+([A-Za-z0-9\-\s]+)/i,
    /(?:para|de)\s+(?:el|la)?\s*([A-Za-z0-9\-]+)/i,
    /(?:del|al)\s+([A-Za-z0-9\-]+)/i,
    /"([^"]+)"/g,
    /'([^']+)'/g
  ];

  private endpointKeywords = new Map([
    // Toxicidad aguda
    ['toxicidad aguda', ['acute_oral', 'acute_dermal', 'acute_inhalation']],
    ['toxicidad oral', ['acute_oral']],
    ['toxicidad dérmica', ['acute_dermal']],
    ['toxicidad inhalación', ['acute_inhalation']],
    ['ld50', ['acute_oral', 'acute_dermal']],
    ['lc50', ['acute_inhalation']],
    
    // Irritación
    ['irritación', ['skin_irritation', 'eye_irritation']],
    ['irritante', ['skin_irritation', 'eye_irritation']],
    ['corrosión', ['skin_irritation']],
    ['corrosivo', ['skin_irritation']],
    ['irritación piel', ['skin_irritation']],
    ['irritación dérmica', ['skin_irritation']],
    ['irritación ocular', ['eye_irritation']],
    ['irritación ojos', ['eye_irritation']],
    
    // Sensibilización
    ['sensibilización', ['skin_sensitization']],
    ['sensibilizante', ['skin_sensitization']],
    ['alergia', ['skin_sensitization']],
    ['alérgico', ['skin_sensitization']],
    
    // Ambiental
    ['bioacumulación', ['bioaccumulation']],
    ['bioconcentración', ['bioaccumulation']],
    ['biodegradación', ['biodegradation']],
    ['persistencia', ['biodegradation']],
    ['ambiental', ['bioaccumulation', 'biodegradation']],
    
    // General
    ['todas', ['acute_oral', 'acute_dermal', 'acute_inhalation', 'skin_irritation', 'eye_irritation', 'skin_sensitization']],
    ['completo', ['acute_oral', 'acute_dermal', 'acute_inhalation', 'skin_irritation', 'eye_irritation', 'skin_sensitization']],
    ['endpoints', ['acute_oral', 'acute_dermal', 'acute_inhalation', 'skin_irritation', 'eye_irritation', 'skin_sensitization']]
  ]);

  public parseQuery(userInput: string): QSARQuery {
    const cleanInput = userInput.toLowerCase().trim();
    
    // Extraer sustancia
    const substance = this.extractSubstance(cleanInput);
    
    // Extraer endpoints solicitados
    const endpoints = this.extractEndpoints(cleanInput);
    
    return {
      substance,
      endpoints: endpoints.length > 0 ? endpoints : ['acute_oral'], // Default endpoint
      language: 'es',
      queryType: 'natural'
    };
  }

  private extractSubstance(input: string): string {
    // Buscar patrones de sustancia específicos
    for (const pattern of this.substancePatterns) {
      const match = input.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        return match[1].trim();
      }
    }

    // Si no encuentra patrones específicos, buscar palabras que podrían ser sustancias
    const words = input.split(/\s+/);
    const commonWords = [
      'es', 'la', 'el', 'una', 'un', 'de', 'para', 'con', 'por', 'en', 'que', 'qué',
      'dame', 'genera', 'muestra', 'busca', 'encuentra', 'consulta', 'predicción',
      'toxicidad', 'irritación', 'sensibilización', 'reporte', 'informe', 'pdf',
      'según', 'qsar', 'toolbox', 'oecd', '¿el', '¿la', 'del', 'al'
    ];

    // Buscar sustancias químicas conocidas primero
    const knownSubstances = [
      'benceno', 'tolueno', 'formaldehído', 'acetona', 'cloroformo', 'metanol', 'etanol', 'fenol'
    ];
    
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[¿?.,;:!]/g, '');
      if (knownSubstances.includes(cleanWord)) {
        return cleanWord;
      }
    }

    // Buscar cualquier palabra que parezca una sustancia química
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[¿?.,;:!]/g, '');
      if (cleanWord.length > 3 && 
          !commonWords.includes(cleanWord) && 
          !this.isEndpointKeyword(cleanWord) &&
          !cleanWord.includes('¿') &&
          !cleanWord.includes('?')) {
        return cleanWord;
      }
    }

    return 'sustancia_desconocida';
  }

  private extractEndpoints(input: string): string[] {
    const endpoints = new Set<string>();

    // Buscar keywords de endpoints
    for (const [keyword, endpointCodes] of this.endpointKeywords) {
      if (input.includes(keyword)) {
        endpointCodes.forEach(code => endpoints.add(code));
      }
    }

    // Si menciona OECD seguido de números, intentar mapear
    const oecdMatch = input.match(/oecd\s+(?:tg\s+)?(\d+)/i);
    if (oecdMatch) {
      const testGuideline = oecdMatch[1];
      const relatedEndpoints = this.getEndpointsByOECDGuideline(testGuideline);
      relatedEndpoints.forEach(code => endpoints.add(code));
    }

    return Array.from(endpoints);
  }

  private isEndpointKeyword(word: string): boolean {
    const lowerWord = word.toLowerCase();
    for (const keyword of this.endpointKeywords.keys()) {
      if (keyword.includes(lowerWord)) {
        return true;
      }
    }
    return false;
  }

  private getEndpointsByOECDGuideline(guideline: string): string[] {
    const mappings: { [key: string]: string[] } = {
      '401': ['acute_oral'],
      '423': ['acute_oral'],
      '425': ['acute_oral'],
      '402': ['acute_dermal'],
      '403': ['acute_inhalation'],
      '436': ['acute_inhalation'],
      '404': ['skin_irritation'],
      '405': ['eye_irritation'],
      '406': ['skin_sensitization'],
      '429': ['skin_sensitization'],
      '442': ['skin_sensitization'],
      '305': ['bioaccumulation'],
      '301': ['biodegradation']
    };

    return mappings[guideline] || [];
  }

  // Generar ejemplos de consultas válidas
  public getExampleQueries(): string[] {
    return [
      '¿El benceno es irritante dérmico según QSAR?',
      'Dame predicciones de toxicidad aguda oral para el tolueno',
      'Genera un reporte completo de endpoints toxicológicos para formaldehído',
      '¿La sustancia acetona es sensibilizante dérmico?',
      'Consulta bioacumulación y biodegradación para cloroformo',
      'Toxicidad aguda por inhalación del metanol según OECD 403',
      'Análisis completo de seguridad química para etanol',
      'Irritación ocular y dérmica del fenol'
    ];
  }

  // Validar si una consulta es comprensible
  public validateQuery(query: string): { valid: boolean; suggestions?: string[] } {
    const parsed = this.parseQuery(query);
    
    if (parsed.substance === 'sustancia_desconocida') {
      return {
        valid: false,
        suggestions: [
          'Por favor, especifica claramente el nombre de la sustancia química',
          'Ejemplo: "¿El benceno es irritante dérmico?"',
          'Puedes usar comillas: "¿La sustancia \'acetona\' es tóxica?"'
        ]
      };
    }

    if (parsed.endpoints.length === 0) {
      return {
        valid: false,
        suggestions: [
          'Por favor, especifica qué tipo de análisis toxicológico necesitas',
          'Opciones: toxicidad aguda, irritación, sensibilización, ambiental',
          'Ejemplo: "Toxicidad aguda oral del tolueno"'
        ]
      };
    }

    return { valid: true };
  }
}