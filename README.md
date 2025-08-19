# QSAR Toolbox Integrator - Regulator.IA

## Descripción del Proyecto
Módulo integrador que permite a un chatbot en español comunicarse de forma amigable con el sistema QSAR Toolbox de la OECD. Simplifica las búsquedas complejas en toxicología y seguridad química para usuarios sin experiencia técnica.

## URLs del Proyecto
- **Aplicación Demo**: https://3000-i5bw7ht8cku37l5jwd8ne-6532622b.e2b.dev
- **API Health Check**: https://3000-i5bw7ht8cku37l5jwd8ne-6532622b.e2b.dev/api/examples
- **GitHub**: [Pendiente de deployment]

## Características Principales

### ✅ Funcionalidades Implementadas
- 🤖 **Chatbot en español** para consultas toxicológicas naturales
- 🧠 **Parser de lenguaje natural** que convierte consultas español → queries QSAR estructuradas
- 🧪 **Simulador QSAR Toolbox** con base de datos de sustancias conocidas
- 📊 **8 endpoints toxicológicos** soportados:
  - Toxicidad Aguda (Oral, Dérmica, Inhalación)
  - Irritación/Corrosión Dérmica y Ocular
  - Sensibilización Dérmica
  - Bioacumulación y Biodegradación
- 📄 **Generación de reportes PDF** con resultados interpretados
- 🎨 **Interfaz web amigable** con tarjetas de resultados y indicadores visuales
- 🔍 **Validación de consultas** con sugerencias automáticas

### 🚧 Funcionalidades Pendientes
- Conexión real con QSAR Toolbox OECD API
- Base de datos ampliada de sustancias químicas
- Análisis de sustancias análogas automático
- Integración con sistemas regulatorios (REACH, EPA)
- Autenticación y gestión de usuarios
- Histórico de consultas y reportes

## Arquitectura Técnica

### Stack Tecnológico
- **Backend**: Hono + TypeScript (Cloudflare Workers)
- **Frontend**: Vanilla JS + TailwindCSS + FontAwesome
- **Parseo NLP**: Parser personalizado en español
- **Base de datos**: Simulador in-memory (futuro: D1 Database)
- **Despliegue**: Cloudflare Pages + PM2 (desarrollo)

### Estructura de Datos
```typescript
interface QSARResult {
  endpoint: string;           // Endpoint toxicológico evaluado
  substance: string;         // Sustancia química analizada
  prediction: {
    value: string | number;  // Valor predicho (LD50, categoría, etc.)
    category: 'low' | 'moderate' | 'high' | 'very_high';
    confidence: number;      // Confianza del modelo (0-1)
    unit?: string;          // Unidad de medida
  };
  explanation_es: string;    // Explicación en español
  regulatory_relevance_es: string; // Relevancia regulatoria
  similar_substances?: string[];   // Sustancias análogas
  timestamp: string;
}
```

### Endpoints Soportados
1. **Toxicidad Aguda Oral** (OECD TG 401/423/425)
2. **Toxicidad Aguda Dérmica** (OECD TG 402)
3. **Toxicidad Aguda Inhalación** (OECD TG 403/436)
4. **Irritación/Corrosión Dérmica** (OECD TG 404)
5. **Irritación Ocular** (OECD TG 405)
6. **Sensibilización Dérmica** (OECD TG 406/429/442A/442B)
7. **Bioacumulación** (OECD TG 305)
8. **Biodegradación** (OECD TG 301)

### Base de Datos Simulada
Sustancias químicas incluidas con datos toxicológicos reales:
- Benceno
- Tolueno
- Formaldehído
- Acetona
- Cloroformo
- Metanol
- Etanol
- Fenol

## Guía de Uso

### Ejemplos de Consultas Válidas
```
¿El benceno es irritante dérmico según QSAR?
Dame predicciones de toxicidad aguda oral para el tolueno
Genera un reporte completo de endpoints toxicológicos para formaldehído
¿La sustancia acetona es sensibilizante dérmico?
Consulta bioacumulación y biodegradación para cloroformo
Toxicidad aguda por inhalación del metanol según OECD 403
Análisis completo de seguridad química para etanol
Irritación ocular y dérmica del fenol
```

### API Endpoints
- `GET /` - Interfaz del chatbot
- `POST /api/chat` - Procesar consulta en español
- `GET /api/examples` - Obtener ejemplos y estadísticas
- `POST /api/generate-report` - Generar reporte PDF
- `GET /api/download-report/:substance` - Descargar reporte

### Respuestas del Sistema
El chatbot proporciona:
1. **Validación de consultas** con sugerencias si falta información
2. **Resultados estructurados** con valores, confianza y relevancia regulatoria
3. **Tarjetas visuales** con códigos de color según nivel de riesgo
4. **Explicaciones técnicas** expandibles
5. **Opción de reporte PDF** para documentación oficial

## Deployment

### Desarrollo Local
```bash
npm install
npm run build
npm run dev:sandbox  # Para sandbox environment
# o
npm run dev         # Para desarrollo local
```

### Producción Cloudflare Pages
```bash
npm run build
wrangler pages deploy dist --project-name qsar-toolbox-integrator
```

### PM2 Management
```bash
pm2 start ecosystem.config.cjs    # Iniciar servicio
pm2 logs --nostream              # Ver logs
pm2 restart qsar-toolbox-integrator  # Reiniciar
pm2 stop qsar-toolbox-integrator     # Detener
```

## Estado del Proyecto
- **Status**: ✅ MVP Funcional
- **Versión**: 1.0.0-MVP
- **Sustancias conocidas**: 8 químicos con datos reales
- **Endpoints soportados**: 8 análisis toxicológicos
- **Lenguaje**: 100% Español
- **Tech Stack**: Cloudflare Workers + Hono + TypeScript
- **Última actualización**: 2025-08-19

## Próximos Pasos Recomendados
1. **Integración API Real**: Conectar con QSAR Toolbox OECD oficial
2. **Expansión Base Datos**: Agregar >1000 sustancias químicas conocidas
3. **Mejoras NLP**: Parser más robusto con análisis sintáctico avanzado
4. **Funciones Regulatorias**: Integración directa con REACH y EPA
5. **Autenticación**: Sistema de usuarios y permisos
6. **Analytics**: Métricas de uso y feedback de usuarios
7. **Mobile App**: Aplicación móvil nativa
8. **API Pública**: Documentación OpenAPI y acceso para terceros

## Contribución
Este es un proyecto MVP demostrativo. Para implementación en producción, se requiere:
- Licencia oficial de QSAR Toolbox
- Validación científica de modelos
- Cumplimiento regulatorio GDPR/REACH
- Testing exhaustivo con casos reales
- Revisión por expertos en toxicología

---
**Desarrollado por**: Regulator.IA Team
**Contacto**: [Por definir]
**Licencia**: MIT (MVP Demo)