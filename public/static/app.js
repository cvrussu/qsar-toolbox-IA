// Frontend JavaScript para el chatbot QSAR
class QSARChatbot {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');
        this.messageId = 0;
        
        this.init();
    }

    init() {
        // Auto-scroll del chat
        this.scrollToBottom();
        
        // Focus en el input
        this.chatInput.focus();
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Limpiar input y deshabilitar botón
        this.chatInput.value = '';
        this.sendButton.disabled = true;
        this.sendButton.innerHTML = `
            <i class="fas fa-brain mr-2"></i>
            <span class="ai-thinking">Analizando</span>
        `;
        this.sendButton.classList.add('loading-shimmer');

        // Añadir mensaje del usuario
        this.addMessage('user', message);
        
        // Añadir indicador de procesamiento
        this.addProcessingIndicator();

        try {
            // Enviar consulta a la API
            const response = await axios.post('/api/chat', { message });
            const data = response.data;

            if (data.type === 'validation_error') {
                this.addValidationError(data.suggestions, data.examples);
            } else if (data.type === 'success') {
                this.addQSARResults(data);
            }

        } catch (error) {
            console.error('Error:', error);
            this.addMessage('assistant', 
                '❌ **Error**: No pude procesar tu consulta. Por favor, inténtalo de nuevo.', 
                'error'
            );
        } finally {
            // Remover indicador de procesamiento
            this.removeProcessingIndicator();
            
            // Rehabilitar botón
            this.sendButton.disabled = false;
            this.sendButton.classList.remove('loading-shimmer');
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Analizar';
            this.chatInput.focus();
        }
    }

    addMessage(type, content, variant = 'default') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-4 message-enter';
        
        const isUser = type === 'user';
        const timestamp = new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let avatarClass, bubbleClass, iconClass;
        
        if (isUser) {
            avatarClass = 'avatar avatar-user';
            bubbleClass = 'message-bubble message-user';
            iconClass = 'fas fa-user';
            messageDiv.className += ' justify-end';
        } else {
            avatarClass = 'avatar avatar-assistant';
            bubbleClass = variant === 'error' ? 'message-bubble message-error' : 
                         variant === 'warning' ? 'message-bubble message-warning' : 
                         'message-bubble message-assistant';
            iconClass = variant === 'error' ? 'fas fa-exclamation-triangle' : 
                       variant === 'warning' ? 'fas fa-exclamation-circle' : 
                       'fas fa-brain';
        }

        messageDiv.innerHTML = `
            <div class="${avatarClass} w-12 h-12 flex items-center justify-center text-lg text-white flex-shrink-0">
                <i class="${iconClass}"></i>
            </div>
            <div class="${bubbleClass} p-4 max-w-2xl">
                <div class="prose prose-sm max-w-none">${this.formatMessage(content)}</div>
                <div class="text-xs opacity-70 mt-2 flex items-center">
                    <i class="fas fa-clock mr-1"></i>
                    ${timestamp}
                </div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addValidationError(suggestions, examples) {
        let content = `
            <div class="space-y-4">
                <div class="glass-panel p-4 rounded-lg">
                    <h3 class="text-lg font-bold text-orange-600 mb-2 flex items-center">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Consulta Incompleta
                    </h3>
                    <p class="text-gray-700">Tu consulta necesita más información específica para el análisis QSAR.</p>
                </div>
        `;
        
        if (suggestions) {
            content += `
                <div class="space-y-2">
                    <h4 class="font-semibold text-gray-800 flex items-center">
                        <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                        Sugerencias de mejora:
                    </h4>
                    <ul class="space-y-1 pl-6">
            `;
            suggestions.forEach(suggestion => {
                content += `<li class="text-sm text-gray-700">• ${suggestion}</li>`;
            });
            content += '</ul></div>';
        }

        if (examples) {
            content += `
                <div class="space-y-2">
                    <h4 class="font-semibold text-gray-800 flex items-center">
                        <i class="fas fa-examples text-blue-500 mr-2"></i>
                        Ejemplos válidos:
                    </h4>
                    <div class="space-y-2">
            `;
            examples.forEach(example => {
                content += `
                    <div class="chemical-formula p-2 cursor-pointer hover:bg-blue-50 rounded" 
                         onclick="setExample('${example}')">
                        "${example}"
                    </div>
                `;
            });
            content += '</div></div>';
        }

        content += '</div>';

        this.addMessage('assistant', content, 'warning');
    }

    addQSARResults(data) {
        const { query, results, response_es } = data;
        
        // Mensaje principal con resultados
        this.addMessage('assistant', response_es);
        
        // Añadir tarjetas detalladas de resultados
        if (results && results.length > 0) {
            this.addResultsCards(results, query.substance);
        }
    }

    addResultsCards(results, substance) {
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'endpoints-grid mt-6';

        results.forEach((result, index) => {
            const confidence = (result.prediction.confidence * 100).toFixed(0);
            const riskClass = this.getRiskClass(result.prediction.category);
            const riskIcon = this.getRiskIcon(result.prediction.category);

            const card = document.createElement('div');
            card.className = `toxicity-card ${riskClass} result-enter`;
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <div class="relative z-10">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold text-gray-800 text-lg flex items-center">
                            ${riskIcon}
                            <span class="ml-2">${result.endpoint}</span>
                        </h4>
                        <div class="confidence-indicator" style="--confidence-width: ${confidence}%">
                            <span class="relative z-10 text-xs font-bold">
                                ${confidence}% confianza
                            </span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="glass-panel p-3 rounded-lg">
                            <p class="text-sm font-medium text-gray-700">
                                <i class="fas fa-flask mr-2 text-blue-500"></i>
                                <strong>Predicción:</strong> 
                                <span class="chemical-formula ml-2">
                                    ${result.prediction.value} ${result.prediction.unit || ''}
                                </span>
                            </p>
                        </div>
                        
                        <div class="text-sm text-gray-700">
                            <p>${result.regulatory_relevance_es}</p>
                        </div>
                        
                        <details class="group">
                            <summary class="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                                <i class="fas fa-microscope mr-2"></i>
                                Explicación Técnica
                                <i class="fas fa-chevron-down ml-2 transform group-open:rotate-180 transition-transform"></i>
                            </summary>
                            <div class="mt-3 p-3 glass-panel rounded-lg">
                                <p class="text-xs text-gray-600 leading-relaxed">
                                    ${result.explanation_es}
                                </p>
                                ${result.similar_substances && result.similar_substances.length > 0 ? `
                                    <div class="mt-2 pt-2 border-t border-gray-200">
                                        <p class="text-xs font-medium text-gray-700 mb-1">
                                            <i class="fas fa-atom mr-1"></i>
                                            Sustancias similares:
                                        </p>
                                        <div class="flex flex-wrap gap-1">
                                            ${result.similar_substances.map(sub => 
                                                `<span class="chemical-formula text-xs">${sub}</span>`
                                            ).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </details>
                    </div>
                </div>
            `;

            resultsDiv.appendChild(card);
        });

        // Botón para generar reporte PDF con diseño moderno
        const pdfButton = document.createElement('button');
        pdfButton.className = 'btn-primary w-full mt-6 py-4 text-lg font-semibold';
        pdfButton.innerHTML = `
            <i class="fas fa-file-contract mr-3"></i>
            Generar Reporte Científico PDF
            <i class="fas fa-download ml-3"></i>
        `;
        pdfButton.onclick = () => this.generatePDFReport(results, substance);
        
        resultsDiv.appendChild(pdfButton);

        // Añadir las tarjetas al chat con avatar científico
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-4 message-enter';
        messageDiv.innerHTML = `
            <div class="avatar avatar-assistant w-12 h-12 flex items-center justify-center text-lg text-white flex-shrink-0">
                <i class="fas fa-chart-line"></i>
            </div>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex-1 max-w-full';
        contentDiv.appendChild(resultsDiv);
        messageDiv.appendChild(contentDiv);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    async generatePDFReport(results, substance) {
        try {
            const response = await axios.post('/api/generate-report', {
                substance,
                results,
                user_query: `Reporte completo para ${substance}`
            });

            const data = response.data;
            if (data.success) {
                this.addMessage('assistant', 
                    `📄 **Reporte PDF generado exitosamente**\n\n` +
                    `Sustancia: ${substance}\n` +
                    `Generado: ${new Date(data.generated_at).toLocaleString('es-ES')}\n\n` +
                    `[Descargar Reporte](${data.pdf_url}) 📥`
                );
            }
        } catch (error) {
            console.error('Error generando PDF:', error);
            this.addMessage('assistant', 
                '❌ Error generando el reporte PDF. Inténtalo de nuevo.', 
                'error'
            );
        }
    }

    getRiskClass(category) {
        switch (category) {
            case 'very_high': return 'risk-very-high';
            case 'high': return 'risk-high';
            case 'moderate': return 'risk-moderate';
            case 'low': return 'risk-low';
            default: return 'risk-low';
        }
    }

    getRiskIcon(category) {
        switch (category) {
            case 'very_high': return '🚨';
            case 'high': return '⚠️';
            case 'moderate': return '🔶';
            case 'low': return '✅';
            default: return '🔍';
        }
    }

    formatMessage(content) {
        // Convertir markdown básico a HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');
    }

    addProcessingIndicator() {
        const processingDiv = document.createElement('div');
        processingDiv.className = 'flex items-start space-x-4 processing-indicator';
        processingDiv.innerHTML = `
            <div class="avatar avatar-assistant w-12 h-12 flex items-center justify-center text-lg text-white flex-shrink-0">
                <i class="fas fa-brain fa-pulse"></i>
            </div>
            <div class="message-bubble message-assistant p-4">
                <div class="flex items-center space-x-3">
                    <div class="loading-shimmer w-4 h-4 rounded-full"></div>
                    <span class="text-gray-600">Procesando análisis QSAR...</span>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    <i class="fas fa-microscope mr-1"></i>
                    Aplicando modelos de machine learning
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(processingDiv);
        this.scrollToBottom();
    }

    removeProcessingIndicator() {
        const indicator = this.chatMessages.querySelector('.processing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
}

// Funciones globales para el HTML
let chatbot;

window.addEventListener('DOMContentLoaded', () => {
    chatbot = new QSARChatbot();
});

function sendMessage() {
    if (chatbot) {
        chatbot.sendMessage();
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function setExample(example) {
    document.getElementById('chat-input').value = example;
    document.getElementById('chat-input').focus();
}

// Función de utilidad para cargar ejemplos
async function loadExamples() {
    try {
        const response = await axios.get('/api/examples');
        const data = response.data;
        
        console.log('Ejemplos disponibles:', data.examples);
        console.log('Sustancias conocidas:', data.available_substances);
        console.log('Stats del simulador:', data.simulator_stats);
        
        return data;
    } catch (error) {
        console.error('Error cargando ejemplos:', error);
        return null;
    }
}