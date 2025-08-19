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
        <title>QSAR Toolbox AI - Regulator.IA | Toxicología Inteligente</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
        <meta name="description" content="Sistema de IA avanzado para análisis toxicológico QSAR OECD en español">
        <meta name="theme-color" content="#667eea">
    </head>
    <body>
        <!-- Partículas flotantes -->
        <div class="particles-container">
            <div class="particle" style="left: 10%; animation-delay: 0s;"></div>
            <div class="particle" style="left: 20%; animation-delay: 2s;"></div>
            <div class="particle" style="left: 30%; animation-delay: 4s;"></div>
            <div class="particle" style="left: 40%; animation-delay: 1s;"></div>
            <div class="particle" style="left: 50%; animation-delay: 3s;"></div>
            <div class="particle" style="left: 60%; animation-delay: 5s;"></div>
            <div class="particle" style="left: 70%; animation-delay: 1.5s;"></div>
            <div class="particle" style="left: 80%; animation-delay: 3.5s;"></div>
            <div class="particle" style="left: 90%; animation-delay: 0.5s;"></div>
        </div>

        <div class="min-h-screen p-4 md:p-6">
            <div class="max-w-6xl mx-auto space-y-6">
                <!-- Header Principal -->
                <header class="main-header ai-container p-8 text-center">
                    <div class="relative z-10">
                        <div class="flex items-center justify-center mb-6">
                            <div class="avatar avatar-assistant w-20 h-20 flex items-center justify-center text-3xl text-white mr-4">
                                <i class="fas fa-brain"></i>
                            </div>
                            <div>
                                <h1 class="main-title">
                                    QSAR Toolbox AI
                                </h1>
                                <p class="text-white/80 text-lg font-medium">
                                    <i class="fas fa-microscope mr-2"></i>
                                    Inteligencia Artificial para Toxicología OECD
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap justify-center gap-4 mb-6">
                            <div class="status-badge status-active">
                                <span class="relative z-10">Sistema Neural Activo</span>
                            </div>
                            <div class="glass-panel px-4 py-2 rounded-full text-white/90 text-sm">
                                <i class="fas fa-database mr-2"></i>
                                8 Endpoints Toxicológicos
                            </div>
                            <div class="glass-panel px-4 py-2 rounded-full text-white/90 text-sm">
                                <i class="fas fa-language mr-2"></i>
                                NLP Español Avanzado
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Interface Principal del Chat -->
                <main class="chat-container">
                    <!-- Header del Chat -->
                    <div class="chat-header p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="text-xl font-bold text-white flex items-center">
                                    <i class="fas fa-comments-alt mr-3"></i>
                                    Asistente QSAR Inteligente
                                </h2>
                                <p class="text-white/80 mt-1">
                                    Consultas toxicológicas en lenguaje natural • Powered by Regulator.IA
                                </p>
                            </div>
                            <div class="hidden md:flex items-center space-x-3">
                                <div class="tooltip-scientific text-white/60 hover:text-white/90" data-tooltip="Análisis en tiempo real">
                                    <i class="fas fa-bolt"></i>
                                </div>
                                <div class="tooltip-scientific text-white/60 hover:text-white/90" data-tooltip="Modelos QSAR OECD">
                                    <i class="fas fa-atom"></i>
                                </div>
                                <div class="tooltip-scientific text-white/60 hover:text-white/90" data-tooltip="Reportes automáticos">
                                    <i class="fas fa-file-contract"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Área de Mensajes -->
                    <div id="chat-messages" class="h-96 md:h-[500px] overflow-y-auto p-6 space-y-6 molecular-bg">
                        <!-- Mensaje de Bienvenida -->
                        <div class="flex items-start space-x-4">
                            <div class="avatar avatar-assistant w-12 h-12 flex items-center justify-center text-lg text-white flex-shrink-0">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-bubble message-assistant p-6 max-w-2xl">
                                <div class="mb-4">
                                    <h3 class="text-lg font-bold text-gray-800 mb-2">
                                        🧠 ¡Bienvenido al futuro de la toxicología!
                                    </h3>
                                    <p class="text-gray-700 mb-4">
                                        Soy tu asistente de IA especializado en <strong>QSAR Toolbox OECD</strong>. 
                                        Utilizo modelos de aprendizaje automático para predecir propiedades toxicológicas.
                                    </p>
                                </div>
                                
                                <div class="grid md:grid-cols-2 gap-4 mb-4">
                                    <div class="endpoint-card">
                                        <h4 class="font-semibold text-gray-800 mb-2">🧪 Toxicidad Aguda</h4>
                                        <p class="text-sm text-gray-600">LD50 oral, dérmica e inhalatoria</p>
                                    </div>
                                    <div class="endpoint-card">
                                        <h4 class="font-semibold text-gray-800 mb-2">🔥 Irritación & Corrosión</h4>
                                        <p class="text-sm text-gray-600">Piel y ojos según OECD TG</p>
                                    </div>
                                    <div class="endpoint-card">
                                        <h4 class="font-semibold text-gray-800 mb-2">⚡ Sensibilización</h4>
                                        <p class="text-sm text-gray-600">Potencial alergénico dérmico</p>
                                    </div>
                                    <div class="endpoint-card">
                                        <h4 class="font-semibold text-gray-800 mb-2">🌱 Destino Ambiental</h4>
                                        <p class="text-sm text-gray-600">Biodegradación y bioacumulación</p>
                                    </div>
                                </div>
                                
                                <div class="glass-panel p-4 rounded-lg">
                                    <p class="text-sm text-gray-700">
                                        <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                        <strong>Ejemplo:</strong> 
                                        <em class="chemical-formula">¿El benceno es carcinógeno según QSAR?</em>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Panel de Entrada -->
                    <div class="p-6 border-t border-white/20">
                        <div class="flex space-x-4 mb-4">
                            <input 
                                type="text" 
                                id="chat-input" 
                                placeholder="Pregúntame sobre toxicología: ej. '¿El formaldehído es irritante ocular según OECD?'"
                                class="input-modern flex-1 px-6 py-4 text-lg"
                                onkeypress="handleKeyPress(event)"
                            >
                            <button 
                                onclick="sendMessage()"
                                class="btn-primary px-8 py-4 text-lg font-semibold"
                                id="send-button"
                            >
                                <i class="fas fa-paper-plane mr-2"></i>
                                Analizar
                            </button>
                        </div>
                        
                        <!-- Ejemplos Rápidos -->
                        <div class="space-y-3">
                            <p class="text-sm font-medium text-gray-600">Consultas de ejemplo:</p>
                            <div class="flex flex-wrap gap-3">
                                <button onclick="setExample('Toxicidad aguda oral del tolueno')" 
                                        class="btn-secondary px-4 py-2 text-sm">
                                    <i class="fas fa-skull mr-2"></i>Toxicidad Aguda
                                </button>
                                <button onclick="setExample('¿El formaldehído es irritante dérmico según OECD 404?')" 
                                        class="btn-secondary px-4 py-2 text-sm">
                                    <i class="fas fa-fire mr-2"></i>Irritación Dérmica
                                </button>
                                <button onclick="setExample('Sensibilización del fenol según QSAR')" 
                                        class="btn-secondary px-4 py-2 text-sm">
                                    <i class="fas fa-exclamation-triangle mr-2"></i>Sensibilización
                                </button>
                                <button onclick="setExample('Genera reporte toxicológico completo para acetona')" 
                                        class="btn-secondary px-4 py-2 text-sm">
                                    <i class="fas fa-file-alt mr-2"></i>Reporte Completo
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <!-- Footer Científico -->
                <footer class="glass-panel p-6 text-center">
                    <div class="flex flex-wrap items-center justify-center gap-6 text-sm">
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-shield-virus mr-2 text-blue-500"></i>
                            Cumplimiento OECD Guidelines
                        </div>
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-brain mr-2 text-purple-500"></i>
                            Modelos de IA Validados
                        </div>
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-certificate mr-2 text-green-500"></i>
                            Regulator.IA Certified
                        </div>
                    </div>
                    <div class="mt-4 text-xs text-gray-500">
                        Sistema de evaluación toxicológica automatizada • 
                        <a href="#" class="text-blue-500 hover:text-blue-600 font-medium">Regulator.IA Platform</a> • 
                        Versión 1.0 MVP
                    </div>
                </footer>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
