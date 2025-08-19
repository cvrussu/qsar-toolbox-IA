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
        this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Procesando...';

        // Añadir mensaje del usuario
        this.addMessage('user', message);

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
            // Rehabilitar botón
            this.sendButton.disabled = false;
            this.sendButton.innerHTML = '<i class="fas fa-paper-plane mr-1"></i>Enviar';
            this.chatInput.focus();
        }
    }

    addMessage(type, content, variant = 'default') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-3';
        
        const isUser = type === 'user';
        const timestamp = new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let avatarClass, bubbleClass;
        
        if (isUser) {
            avatarClass = 'bg-green-100 text-green-600';
            bubbleClass = 'bg-green-50 ml-auto';
            messageDiv.className += ' justify-end';
        } else {
            avatarClass = variant === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600';
            bubbleClass = variant === 'error' ? 'bg-red-50' : 'bg-blue-50';
        }

        messageDiv.innerHTML = `
            <div class="${avatarClass} rounded-full p-2 w-8 h-8 flex items-center justify-center text-sm">
                <i class="fas fa-${isUser ? 'user' : variant === 'error' ? 'exclamation-triangle' : 'robot'}"></i>
            </div>
            <div class="${bubbleClass} rounded-lg p-3 max-w-md">
                <div class="prose prose-sm">${this.formatMessage(content)}</div>
                <div class="text-xs text-gray-500 mt-1">${timestamp}</div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addValidationError(suggestions, examples) {
        let content = '⚠️ **Tu consulta necesita más detalles**:\n\n';
        
        if (suggestions) {
            content += '**Sugerencias:**\n';
            suggestions.forEach(suggestion => {
                content += `• ${suggestion}\n`;
            });
        }

        if (examples) {
            content += '\n**Ejemplos válidos:**\n';
            examples.forEach(example => {
                content += `• "${example}"\n`;
            });
        }

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
        resultsDiv.className = 'mt-4 space-y-3';

        results.forEach(result => {
            const confidence = (result.prediction.confidence * 100).toFixed(0);
            const riskColor = this.getRiskColor(result.prediction.category);
            const riskIcon = this.getRiskIcon(result.prediction.category);

            const card = document.createElement('div');
            card.className = `bg-white border-l-4 ${riskColor} p-4 rounded-r-lg shadow-sm`;
            
            card.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-800">
                        ${riskIcon} ${result.endpoint}
                    </h4>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        Confianza: ${confidence}%
                    </span>
                </div>
                <div class="text-sm text-gray-700">
                    <p><strong>Valor:</strong> ${result.prediction.value} ${result.prediction.unit || ''}</p>
                    <p class="mt-1">${result.regulatory_relevance_es}</p>
                </div>
                <details class="mt-2">
                    <summary class="text-xs text-blue-600 cursor-pointer hover:underline">
                        Ver explicación técnica
                    </summary>
                    <p class="text-xs text-gray-600 mt-1 pl-4">${result.explanation_es}</p>
                </details>
            `;

            resultsDiv.appendChild(card);
        });

        // Botón para generar reporte PDF
        const pdfButton = document.createElement('button');
        pdfButton.className = 'w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm transition-colors';
        pdfButton.innerHTML = '<i class="fas fa-file-pdf mr-2"></i>Generar Reporte PDF';
        pdfButton.onclick = () => this.generatePDFReport(results, substance);
        
        resultsDiv.appendChild(pdfButton);

        // Añadir las tarjetas al chat
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-start';
        messageDiv.innerHTML = `
            <div class="bg-blue-100 text-blue-600 rounded-full p-2 w-8 h-8 flex items-center justify-center text-sm mr-3">
                <i class="fas fa-chart-bar"></i>
            </div>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'max-w-lg';
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

    getRiskColor(category) {
        switch (category) {
            case 'very_high': return 'border-red-500';
            case 'high': return 'border-orange-500';
            case 'moderate': return 'border-yellow-500';
            case 'low': return 'border-green-500';
            default: return 'border-gray-500';
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