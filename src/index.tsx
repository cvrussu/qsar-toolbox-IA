import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { SpanishQSARParser } from './nlp/spanishParser'
import { QSARToolboxSimulator } from './qsar/qsarSimulator'
import { ChatMessage, QSARQuery, PDFReportData } from './types/qsar'

const app = new Hono()

// Inicializar servicios
const parser = new SpanishQSARParser()
const qsarSimulator = new QSARToolboxSimulator()

// Middleware
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.post('/api/chat', async (c) => {
  try {
    const { message } = await c.req.json()
    
    if (!message || typeof message !== 'string') {
      return c.json({ error: 'Mensaje requerido' }, 400)
    }

    // Validar consulta
    const validation = parser.validateQuery(message)
    if (!validation.valid) {
      return c.json({
        type: 'validation_error',
        suggestions: validation.suggestions,
        examples: parser.getExampleQueries().slice(0, 3)
      })
    }

    // Parsear consulta en español
    const query: QSARQuery = parser.parseQuery(message)
    
    // Obtener predicciones QSAR
    const results = await qsarSimulator.predictToxicity(query.substance, query.endpoints)
    
    // Generar respuesta en español
    const response = generateSpanishResponse(query, results)
    
    return c.json({
      type: 'success',
      query,
      results,
      response_es: response,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error en /api/chat:', error)
    return c.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, 500)
  }
})

// Endpoint para obtener ejemplos de consultas
app.get('/api/examples', (c) => {
  return c.json({
    examples: parser.getExampleQueries(),
    available_substances: qsarSimulator.getAvailableSubstances(),
    simulator_stats: qsarSimulator.getSimulatorStats()
  })
})

// Endpoint para generar reporte PDF (simulado)
app.post('/api/generate-report', async (c) => {
  try {
    const { substance, results, user_query } = await c.req.json()
    
    if (!substance || !results) {
      return c.json({ error: 'Datos de reporte incompletos' }, 400)
    }

    const reportData: PDFReportData = {
      substance,
      results,
      generated_at: new Date().toISOString(),
      user_query: user_query || 'Consulta QSAR'
    }

    // Simular generación de PDF
    const pdfContent = generatePDFContent(reportData)
    
    return c.json({
      success: true,
      pdf_url: `/api/download-report/${encodeURIComponent(substance)}`,
      content_preview: pdfContent.substring(0, 500) + '...',
      generated_at: reportData.generated_at
    })
    
  } catch (error) {
    console.error('Error generando reporte:', error)
    return c.json({ error: 'Error generando reporte PDF' }, 500)
  }
})

// Endpoint simulado para descargar PDF
app.get('/api/download-report/:substance', (c) => {
  const substance = c.req.param('substance')
  const pdfContent = `
REPORTE QSAR - ${substance.toUpperCase()}
================================

Generado: ${new Date().toLocaleString('es-ES')}
Sistema: QSAR Toolbox Integrator - Regulator.IA

[Contenido del PDF simulado para ${substance}]
Aquí estarían los resultados toxicológicos detallados...
  `
  
  return c.text(pdfContent, 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="reporte_qsar_${substance}.txt"`
  })
})

// Función auxiliar para generar respuesta en español
function generateSpanishResponse(query: QSARQuery, results: any[]): string {
  if (results.length === 0) {
    return `No se encontraron predicciones para la sustancia "${query.substance}".`
  }

  let response = `Análisis QSAR completado para **${query.substance}**:\n\n`
  
  results.forEach((result, index) => {
    const confidence = (result.prediction.confidence * 100).toFixed(0)
    const riskIcon = getRiskIcon(result.prediction.category)
    
    response += `${riskIcon} **${result.endpoint}**\n`
    response += `   Predicción: ${result.prediction.value} ${result.prediction.unit || ''}\n`
    response += `   Confianza: ${confidence}%\n`
    response += `   ${result.regulatory_relevance_es}\n\n`
  })

  if (results.length > 1) {
    response += `✅ **Análisis completo**: Se evaluaron ${results.length} endpoints toxicológicos.\n`
    response += `📊 **Reporte PDF disponible** - Solicita "genera reporte PDF" para obtener documentación completa.`
  }

  return response
}

function getRiskIcon(category: string): string {
  switch (category) {
    case 'very_high': return '🚨'
    case 'high': return '⚠️'
    case 'moderate': return '🔶'
    case 'low': return '✅'
    default: return '🔍'
  }
}

function generatePDFContent(data: PDFReportData): string {
  return `
REPORTE DE ANÁLISIS QSAR
========================

Sustancia analizada: ${data.substance}
Consulta original: "${data.user_query}"
Fecha de generación: ${new Date(data.generated_at).toLocaleString('es-ES')}

RESULTADOS TOXICOLÓGICOS:
${data.results.map(result => `
- ${result.endpoint}
  Valor: ${result.prediction.value} ${result.prediction.unit || ''}
  Confianza: ${(result.prediction.confidence * 100).toFixed(0)}%
  Relevancia regulatoria: ${result.regulatory_relevance_es}
  Explicación: ${result.explanation_es}
`).join('\n')}

CONCLUSIONES:
Este reporte ha sido generado mediante modelos QSAR (Quantitative Structure-Activity Relationship) 
para evaluación de riesgo químico según directrices OECD.

---
Generado por: Regulator.IA - QSAR Toolbox Integrator
Sistema de evaluación toxicológica automatizada
  `
}

// Ruta principal - Interfaz del chatbot
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QSAR Toolbox Integrator - Regulator.IA</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-6 max-w-4xl">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-robot text-blue-600 mr-2"></i>
                            QSAR Toolbox Integrator
                        </h1>
                        <p class="text-gray-600">
                            <i class="fas fa-flask mr-2"></i>
                            Consultas toxicológicas en español - Powered by Regulator.IA
                        </p>
                    </div>
                    <div class="text-right">
                        <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            <i class="fas fa-circle text-green-500 mr-1"></i>
                            Sistema Activo
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chat Interface -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <!-- Chat Header -->
                <div class="bg-blue-600 text-white p-4">
                    <h2 class="text-lg font-semibold">
                        <i class="fas fa-comments mr-2"></i>
                        Chatbot QSAR - Consultas en Español
                    </h2>
                    <p class="text-blue-100 text-sm">Pregunta sobre toxicidad, irritación, sensibilización y endpoints ambientales</p>
                </div>

                <!-- Chat Messages -->
                <div id="chat-messages" class="h-96 overflow-y-auto p-4 space-y-4">
                    <!-- Welcome Message -->
                    <div class="flex items-start space-x-3">
                        <div class="bg-blue-100 text-blue-600 rounded-full p-2 w-8 h-8 flex items-center justify-center text-sm">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="bg-blue-50 rounded-lg p-3 max-w-md">
                            <p class="text-gray-800"><strong>¡Hola!</strong> Soy tu asistente QSAR. Puedo ayudarte con:</p>
                            <ul class="mt-2 text-sm text-gray-700 list-disc list-inside">
                                <li>Predicciones de toxicidad aguda</li>
                                <li>Evaluación de irritación y sensibilización</li>
                                <li>Análisis de destino ambiental</li>
                                <li>Generación de reportes PDF</li>
                            </ul>
                            <p class="mt-2 text-xs text-gray-600">
                                <strong>Ejemplo:</strong> "¿El benceno es irritante dérmico según QSAR?"
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="border-t p-4">
                    <div class="flex space-x-3">
                        <input 
                            type="text" 
                            id="chat-input" 
                            placeholder="Pregunta sobre toxicología QSAR en español..."
                            class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onkeypress="handleKeyPress(event)"
                        >
                        <button 
                            onclick="sendMessage()"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                            id="send-button"
                        >
                            <i class="fas fa-paper-plane mr-1"></i>
                            Enviar
                        </button>
                    </div>
                    
                    <!-- Quick Examples -->
                    <div class="mt-3">
                        <p class="text-xs text-gray-500 mb-2">Ejemplos rápidos:</p>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="setExample('¿El tolueno es tóxico por vía oral?')" 
                                    class="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors">
                                Toxicidad oral
                            </button>
                            <button onclick="setExample('Irritación dérmica del formaldehído')" 
                                    class="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors">
                                Irritación
                            </button>
                            <button onclick="setExample('Genera reporte completo para acetona')" 
                                    class="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors">
                                Reporte completo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-6 text-center text-gray-500 text-sm">
                <i class="fas fa-shield-alt mr-1"></i>
                Sistema de evaluación toxicológica automatizada - 
                <a href="https://github.com" class="text-blue-600 hover:underline">Regulator.IA</a>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
