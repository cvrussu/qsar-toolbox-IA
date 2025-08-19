// Simulador de QSAR Toolbox para el MVP
import { QSARResult, TOXICOLOGY_ENDPOINTS } from '../types/qsar';

export class QSARToolboxSimulator {
  // Base de datos simulada de sustancias conocidas con predicciones reales
  private substanceDatabase = new Map([
    ['benceno', {
      acute_oral: { value: 930, unit: 'mg/kg', confidence: 0.85, category: 'moderate' as const },
      acute_dermal: { value: 9400, unit: 'mg/kg', confidence: 0.78, category: 'low' as const },
      skin_irritation: { value: 'Irritante', unit: '', confidence: 0.82, category: 'moderate' as const },
      eye_irritation: { value: 'Irritante severo', unit: '', confidence: 0.88, category: 'high' as const },
      skin_sensitization: { value: 'No sensibilizante', unit: '', confidence: 0.75, category: 'low' as const },
      bioaccumulation: { value: 7.8, unit: 'log BCF', confidence: 0.72, category: 'low' as const },
      biodegradation: { value: 'Biodegradable', unit: '', confidence: 0.80, category: 'low' as const }
    }],
    
    ['tolueno', {
      acute_oral: { value: 636, unit: 'mg/kg', confidence: 0.89, category: 'moderate' as const },
      acute_dermal: { value: 14100, unit: 'mg/kg', confidence: 0.83, category: 'low' as const },
      acute_inhalation: { value: 49000, unit: 'mg/m³', confidence: 0.81, category: 'low' as const },
      skin_irritation: { value: 'Ligeramente irritante', unit: '', confidence: 0.77, category: 'low' as const },
      eye_irritation: { value: 'Irritante moderado', unit: '', confidence: 0.85, category: 'moderate' as const },
      skin_sensitization: { value: 'No sensibilizante', unit: '', confidence: 0.82, category: 'low' as const },
      bioaccumulation: { value: 242, unit: 'BCF', confidence: 0.76, category: 'moderate' as const },
      biodegradation: { value: 'Fácilmente biodegradable', unit: '', confidence: 0.87, category: 'low' as const }
    }],
    
    ['formaldehído', {
      acute_oral: { value: 100, unit: 'mg/kg', confidence: 0.92, category: 'high' as const },
      acute_dermal: { value: 270, unit: 'mg/kg', confidence: 0.88, category: 'high' as const },
      acute_inhalation: { value: 203, unit: 'mg/m³', confidence: 0.91, category: 'very_high' as const },
      skin_irritation: { value: 'Corrosivo', unit: '', confidence: 0.95, category: 'very_high' as const },
      eye_irritation: { value: 'Corrosivo severo', unit: '', confidence: 0.96, category: 'very_high' as const },
      skin_sensitization: { value: 'Sensibilizante fuerte', unit: '', confidence: 0.93, category: 'very_high' as const },
      bioaccumulation: { value: 0.35, unit: 'log BCF', confidence: 0.85, category: 'low' as const },
      biodegradation: { value: 'Fácilmente biodegradable', unit: '', confidence: 0.90, category: 'low' as const }
    }],
    
    ['acetona', {
      acute_oral: { value: 5800, unit: 'mg/kg', confidence: 0.87, category: 'low' as const },
      acute_dermal: { value: 20000, unit: 'mg/kg', confidence: 0.79, category: 'low' as const },
      acute_inhalation: { value: 50100, unit: 'mg/m³', confidence: 0.83, category: 'low' as const },
      skin_irritation: { value: 'No irritante', unit: '', confidence: 0.84, category: 'low' as const },
      eye_irritation: { value: 'Ligeramente irritante', unit: '', confidence: 0.81, category: 'low' as const },
      skin_sensitization: { value: 'No sensibilizante', unit: '', confidence: 0.89, category: 'low' as const },
      bioaccumulation: { value: 3.2, unit: 'BCF', confidence: 0.78, category: 'low' as const },
      biodegradation: { value: 'Fácilmente biodegradable', unit: '', confidence: 0.92, category: 'low' as const }
    }],
    
    ['cloroformo', {
      acute_oral: { value: 695, unit: 'mg/kg', confidence: 0.90, category: 'moderate' as const },
      acute_dermal: { value: 20000, unit: 'mg/kg', confidence: 0.74, category: 'low' as const },
      acute_inhalation: { value: 47702, unit: 'mg/m³', confidence: 0.86, category: 'low' as const },
      skin_irritation: { value: 'Ligeramente irritante', unit: '', confidence: 0.80, category: 'low' as const },
      eye_irritation: { value: 'Irritante moderado', unit: '', confidence: 0.82, category: 'moderate' as const },
      skin_sensitization: { value: 'No sensibilizante', unit: '', confidence: 0.77, category: 'low' as const },
      bioaccumulation: { value: 28, unit: 'BCF', confidence: 0.81, category: 'low' as const },
      biodegradation: { value: 'No biodegradable', unit: '', confidence: 0.88, category: 'high' as const }
    }],
    
    ['metanol', {
      acute_oral: { value: 5628, unit: 'mg/kg', confidence: 0.85, category: 'low' as const },
      acute_dermal: { value: 15800, unit: 'mg/kg', confidence: 0.77, category: 'low' as const },
      acute_inhalation: { value: 64000, unit: 'mg/m³', confidence: 0.80, category: 'low' as const },
      skin_irritation: { value: 'No irritante', unit: '', confidence: 0.83, category: 'low' as const },
      eye_irritation: { value: 'Irritante leve', unit: '', confidence: 0.79, category: 'low' as const },
      skin_sensitization: { value: 'No sensibilizante', unit: '', confidence: 0.86, category: 'low' as const },
      bioaccumulation: { value: 3.2, unit: 'BCF', confidence: 0.75, category: 'low' as const },
      biodegradation: { value: 'Fácilmente biodegradable', unit: '', confidence: 0.89, category: 'low' as const }
    }],
    
    ['etanol', {
      acute_oral: { value: 7060, unit: 'mg/kg', confidence: 0.92, category: 'low' as const },
      acute_dermal: { value: 20000, unit: 'mg/kg', confidence: 0.81, category: 'low' as const },
      skin_irritation: { value: 'No irritante', unit: '', confidence: 0.87, category: 'low' as const },
      eye_irritation: { value: 'Irritante moderado', unit: '', confidence: 0.84, category: 'moderate' as const },
      skin_sensitization: { value: 'No sensibilizante', unit: '', confidence: 0.90, category: 'low' as const },
      bioaccumulation: { value: 3.2, unit: 'BCF', confidence: 0.78, category: 'low' as const },
      biodegradation: { value: 'Fácilmente biodegradable', unit: '', confidence: 0.94, category: 'low' as const }
    }],
    
    ['fenol', {
      acute_oral: { value: 317, unit: 'mg/kg', confidence: 0.89, category: 'moderate' as const },
      acute_dermal: { value: 669, unit: 'mg/kg', confidence: 0.85, category: 'moderate' as const },
      skin_irritation: { value: 'Corrosivo', unit: '', confidence: 0.91, category: 'very_high' as const },
      eye_irritation: { value: 'Corrosivo severo', unit: '', confidence: 0.93, category: 'very_high' as const },
      skin_sensitization: { value: 'Sensibilizante débil', unit: '', confidence: 0.78, category: 'moderate' as const },
      bioaccumulation: { value: 29, unit: 'BCF', confidence: 0.83, category: 'low' as const },
      biodegradation: { value: 'Fácilmente biodegradable', unit: '', confidence: 0.87, category: 'low' as const }
    }]
  ]);

  public async predictToxicity(substance: string, endpoints: string[]): Promise<QSARResult[]> {
    // Simular delay de API real
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const substanceKey = substance.toLowerCase().trim();
    const substanceData = this.substanceDatabase.get(substanceKey);

    const results: QSARResult[] = [];

    for (const endpointCode of endpoints) {
      const endpoint = TOXICOLOGY_ENDPOINTS.find(ep => ep.code === endpointCode);
      if (!endpoint) continue;

      let prediction;
      let explanation_es;
      let regulatory_relevance_es;

      if (substanceData && (substanceData as any)[endpointCode]) {
        // Datos conocidos
        prediction = (substanceData as any)[endpointCode];
        explanation_es = this.getExplanation(endpointCode, prediction);
        regulatory_relevance_es = this.getRegulatoryRelevance(endpointCode, prediction);
      } else {
        // Generar predicción simulada para sustancia desconocida
        prediction = this.generateSimulatedPrediction(endpointCode, substance);
        explanation_es = `Predicción basada en modelos QSAR para sustancia no incluida en la base de datos de entrenamiento: ${substance}`;
        regulatory_relevance_es = this.getRegulatoryRelevance(endpointCode, prediction);
      }

      results.push({
        endpoint: endpoint.name_es,
        substance: substance,
        prediction,
        explanation_es,
        regulatory_relevance_es,
        similar_substances: this.getSimilarSubstances(substance),
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  private generateSimulatedPrediction(endpointCode: string, substance: string) {
    // Generar predicciones simuladas basadas en el tipo de endpoint
    const randomFactor = Math.random();
    
    switch (endpointCode) {
      case 'acute_oral':
        return {
          value: Math.round(300 + randomFactor * 5000),
          unit: 'mg/kg',
          confidence: 0.60 + randomFactor * 0.30,
          category: randomFactor > 0.7 ? 'low' : randomFactor > 0.4 ? 'moderate' : 'high' as const
        };
      
      case 'acute_dermal':
        return {
          value: Math.round(2000 + randomFactor * 18000),
          unit: 'mg/kg',
          confidence: 0.55 + randomFactor * 0.35,
          category: randomFactor > 0.8 ? 'low' : randomFactor > 0.5 ? 'moderate' : 'high' as const
        };
      
      case 'acute_inhalation':
        return {
          value: Math.round(1000 + randomFactor * 60000),
          unit: 'mg/m³',
          confidence: 0.58 + randomFactor * 0.32,
          category: randomFactor > 0.7 ? 'low' : randomFactor > 0.4 ? 'moderate' : 'high' as const
        };
      
      case 'skin_irritation':
        const irritationValues = ['No irritante', 'Ligeramente irritante', 'Irritante', 'Corrosivo'];
        return {
          value: irritationValues[Math.floor(randomFactor * irritationValues.length)],
          unit: '',
          confidence: 0.50 + randomFactor * 0.40,
          category: randomFactor > 0.75 ? 'low' : randomFactor > 0.5 ? 'moderate' : randomFactor > 0.25 ? 'high' : 'very_high' as const
        };
      
      case 'eye_irritation':
        const eyeValues = ['No irritante', 'Irritante leve', 'Irritante moderado', 'Irritante severo'];
        return {
          value: eyeValues[Math.floor(randomFactor * eyeValues.length)],
          unit: '',
          confidence: 0.52 + randomFactor * 0.38,
          category: randomFactor > 0.75 ? 'low' : randomFactor > 0.5 ? 'moderate' : 'high' as const
        };
      
      case 'skin_sensitization':
        const sensValues = ['No sensibilizante', 'Sensibilizante débil', 'Sensibilizante', 'Sensibilizante fuerte'];
        return {
          value: sensValues[Math.floor(randomFactor * sensValues.length)],
          unit: '',
          confidence: 0.48 + randomFactor * 0.42,
          category: randomFactor > 0.7 ? 'low' : randomFactor > 0.4 ? 'moderate' : 'high' as const
        };
      
      case 'bioaccumulation':
        return {
          value: parseFloat((1 + randomFactor * 1000).toFixed(1)),
          unit: 'BCF',
          confidence: 0.45 + randomFactor * 0.45,
          category: randomFactor > 0.8 ? 'low' : randomFactor > 0.6 ? 'moderate' : 'high' as const
        };
      
      case 'biodegradation':
        const biodegValues = ['Fácilmente biodegradable', 'Biodegradable', 'Lentamente biodegradable', 'No biodegradable'];
        return {
          value: biodegValues[Math.floor(randomFactor * biodegValues.length)],
          unit: '',
          confidence: 0.50 + randomFactor * 0.35,
          category: randomFactor > 0.75 ? 'low' : randomFactor > 0.5 ? 'moderate' : 'high' as const
        };
      
      default:
        return {
          value: 'No disponible',
          unit: '',
          confidence: 0.30,
          category: 'low' as const
        };
    }
  }

  private getExplanation(endpointCode: string, prediction: any): string {
    const confidence = (prediction.confidence * 100).toFixed(0);
    
    switch (endpointCode) {
      case 'acute_oral':
        return `Predicción de LD50 oral: ${prediction.value} ${prediction.unit}. Confianza: ${confidence}%. Basado en modelos QSAR de toxicidad aguda oral.`;
      
      case 'acute_dermal':
        return `Predicción de LD50 dérmica: ${prediction.value} ${prediction.unit}. Confianza: ${confidence}%. Basado en modelos de penetración dérmica y toxicidad sistémica.`;
      
      case 'acute_inhalation':
        return `Predicción de LC50 inhalatoria: ${prediction.value} ${prediction.unit}. Confianza: ${confidence}%. Basado en modelos de toxicocinética pulmonar.`;
      
      case 'skin_irritation':
        return `Predicción de irritación dérmica: ${prediction.value}. Confianza: ${confidence}%. Basado en descriptores fisicoquímicos y modelos de irritación local.`;
      
      case 'eye_irritation':
        return `Predicción de irritación ocular: ${prediction.value}. Confianza: ${confidence}%. Basado en modelos de irritación mucosa y penetración ocular.`;
      
      case 'skin_sensitization':
        return `Predicción de sensibilización dérmica: ${prediction.value}. Confianza: ${confidence}%. Basado en modelos de activación del sistema inmune.`;
      
      case 'bioaccumulation':
        return `Predicción de factor de bioconcentración: ${prediction.value} ${prediction.unit}. Confianza: ${confidence}%. Basado en lipofilicidad y peso molecular.`;
      
      case 'biodegradation':
        return `Predicción de biodegradación: ${prediction.value}. Confianza: ${confidence}%. Basado en modelos de biodisponibilidad y metabolismo microbiano.`;
      
      default:
        return `Predicción: ${prediction.value}. Confianza: ${confidence}%.`;
    }
  }

  private getRegulatoryRelevance(endpointCode: string, prediction: any): string {
    const endpoint = TOXICOLOGY_ENDPOINTS.find(ep => ep.code === endpointCode);
    const guideline = endpoint?.oecd_guideline || 'OECD';

    switch (endpointCode) {
      case 'acute_oral':
        if (prediction.value < 300) return `⚠️ ALTA TOXICIDAD - Requiere clasificación GHS Categoría 1-2. Relevante para ${guideline}`;
        if (prediction.value < 2000) return `⚠️ TOXICIDAD MODERADA - Posible clasificación GHS Categoría 3. Relevante para ${guideline}`;
        return `✅ BAJA TOXICIDAD - No requiere clasificación especial. Conforme a ${guideline}`;
      
      case 'skin_irritation':
        if (prediction.value.includes('Corrosivo')) return `🚨 CORROSIVO - Clasificación GHS Categoría 1A/1B/1C obligatoria. Crítico para ${guideline}`;
        if (prediction.value.includes('Irritante')) return `⚠️ IRRITANTE - Clasificación GHS Categoría 2 requerida. Relevante para ${guideline}`;
        return `✅ NO IRRITANTE - Sin clasificación requerida. Conforme a ${guideline}`;
      
      case 'skin_sensitization':
        if (prediction.value.includes('Sensibilizante')) return `⚠️ SENSIBILIZANTE - Clasificación GHS Categoría 1 requerida. Crítico para ${guideline}`;
        return `✅ NO SENSIBILIZANTE - Sin clasificación requerida. Conforme a ${guideline}`;
      
      case 'bioaccumulation':
        if (prediction.value > 2000) return `🚨 ALTO POTENCIAL DE BIOACUMULACIÓN - Relevante para REACH Anexo XIII. Crítico para ${guideline}`;
        if (prediction.value > 100) return `⚠️ POTENCIAL BIOACUMULACIÓN MODERADA - Considerar estudios adicionales. Relevante para ${guideline}`;
        return `✅ BAJO POTENCIAL DE BIOACUMULACIÓN - Conforme a ${guideline}`;
      
      default:
        return `Relevante para evaluación regulatoria según ${guideline}`;
    }
  }

  private getSimilarSubstances(substance: string): string[] {
    // Retornar sustancias similares conocidas
    const allSubstances = Array.from(this.substanceDatabase.keys());
    return allSubstances.filter(s => s !== substance.toLowerCase()).slice(0, 3);
  }

  // Método para obtener estadísticas del simulador
  public getAvailableSubstances(): string[] {
    return Array.from(this.substanceDatabase.keys());
  }

  public getSimulatorStats(): { knownSubstances: number; supportedEndpoints: number; version: string } {
    return {
      knownSubstances: this.substanceDatabase.size,
      supportedEndpoints: TOXICOLOGY_ENDPOINTS.length,
      version: '1.0.0-MVP'
    };
  }
}