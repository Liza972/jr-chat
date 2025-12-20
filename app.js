Loading..., [21.12.2025 1:11]
class OnlineChat {
    constructor() {
        this.API_URL = '/api';
        this.MESSAGES_ENDPOINT = ${this.API_URL}/messages;
        this.POLL_INTERVAL = 3000; // 3 секунды
        this.currentUsername = '';
        this.lastMessageId = 0;
        this.polling = null;
        this.isConnected = false;
        this.uniqueUsers = new Set();
        
        this.init();
    }

    init() {
        this.loadUsername();
        this.setupEventListeners();
        this.updateConnectionStatus('connecting');
        this.startPolling();
        this.showNotification('Добро пожаловать!', 'Чат успешно загружен. Начните общение!');
    }

    setupEventListeners() {
        // Сохранение имени пользователя
        document.getElementById('save-username').addEventListener('click', () => this.saveUsername());
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveUsername();
        });

        // Отправка сообщения
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Счетчик символов
        document.getElementById('message-input').addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
        });

        // Обновление вручную
        document.getElementById('refresh-btn').addEventListener('click', () => this.fetchMessages());

        // Очистка локальных данных
        document.getElementById('clear-local-btn').addEventListener('click', () => this.clearLocalData());
    }

    // Работа с именем пользователя
    loadUsername() {
        const savedUsername = localStorage.getItem('chat_username');
        if (savedUsername) {
            this.currentUsername = savedUsername;
            document.getElementById('username').value = savedUsername;
        } else {
            this.generateDefaultUsername();
        }
    }

    generateDefaultUsername() {
        const adjectives = ['Веселый', 'Серьезный', 'Любопытный', 'Смешной', 'Умный', 'Добрый'];
        const nouns = ['Пользователь', 'Гость', 'Посетитель', 'Собеседник', 'Друг'];
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNum = Math.floor(Math.random() * 1000);
        
        this.currentUsername = ${randomAdj}${randomNoun}${randomNum};
        document.getElementById('username').value = this.currentUsername;
        this.saveUsername();
    }

    saveUsername() {
        const input = document.getElementById('username');
        const username = input.value.trim();
        
        if (username.length < 2) {
            this.showNotification('Ошибка', 'Имя должно содержать минимум 2 символа');
            return;
        }
        
        if (username.length > 50) {
            this.showNotification('Ошибка', 'Имя должно содержать не более 50 символов');
            return;
        }
        
        this.currentUsername = username;
        localStorage.setItem('chat_username', username);
        input.value = username;
        
        this.showNotification('Успех', `Имя пользователя сохранено: ${username}`);
    }

    // Отправка сообщения
    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const text = messageInput.value.trim();
        
        if (!this.currentUsername) {
            this.showNotification('Ошибка', 'Пожалуйста, установите имя пользователя');
            return;
        }
        
        if (!text) {
            this.showNotification('Ошибка', 'Сообщение не может быть пустым');
            return;
        }
        
        if (text.length > 500) {
            this.showNotification('Ошибка', 'Сообщение должно содержать не более 500 символов');
            return;

Loading..., [21.12.2025 1:11]
}
        
        const messageData = {
            username: this.currentUsername,
            text: text
        };
        
        try {
            const response = await fetch(this.MESSAGES_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                messageInput.value = '';
                this.updateCharCount(0);
                this.fetchMessages(); // Немедленное обновление
                
                // Прокрутка к новому сообщению
                setTimeout(() => {
                    const messagesContainer = document.getElementById('messages-container');
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 100);
            } else {
                this.showNotification('Ошибка отправки', result.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            this.showNotification('Ошибка сети', 'Не удалось отправить сообщение. Проверьте подключение.');
        }
    }

    // Получение сообщений
    async fetchMessages() {
        try {
            const response = await fetch(this.MESSAGES_ENDPOINT);
            const result = await response.json();
            
            if (result.success) {
                this.isConnected = true;
                this.updateConnectionStatus('online');
                this.displayMessages(result.data || []);
                this.updateStats(result.data || []);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Ошибка получения сообщений:', error);
            this.isConnected = false;
            this.updateConnectionStatus('offline');
        }
    }

    // Отображение сообщений
    displayMessages(messages) {
        const container = document.getElementById('messages-container');
        
        // Показать только новые сообщения
        const newMessages = messages.filter(msg => msg.id > this.lastMessageId);
        if (newMessages.length === 0 && messages.length > 0) {
            return; // Нет новых сообщений
        }
        
        // Обновить последний ID
        if (messages.length > 0) {
            this.lastMessageId = Math.max(...messages.map(msg => msg.id));
        }
        
        // Очистить только если это первый запрос
        if (container.querySelector('.welcome-message')) {
            container.innerHTML = '';
        }
        
        // Добавить новые сообщения
        newMessages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            container.appendChild(messageElement);
        });
        
        // Прокрутка к новому сообщению, если есть новые
        if (newMessages.length > 0) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Создание элемента сообщения
    createMessageElement(message) {
        const isMyMessage = message.username === this.currentUsername;
        const messageTime = this.formatTime(message.timestamp);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = message ${isMyMessage ? 'my-message' : ''};
        messageDiv.dataset.id = message.id;
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="message-username">
                    <i class="fas fa-user-circle"></i>
                    <span>${this.escapeHtml(message.username)}</span>
                </div>
                <div class="message-time" title="${new Date(message.timestamp).toLocaleString()}">
                    <i class="far fa-clock"></i> ${messageTime}
                </div>
            </div>
            <div class="message-content">

Loading..., [21.12.2025 1:11]
<div class="message-text">${this.formatMessageText(message.text)}</div>
            </div>
        `;
        
        return messageDiv;
    }

    // Форматирование текста сообщения
    formatMessageText(text) {
        // Замена смайликов
        let formatted = this.replaceEmojis(text);
        
        // Форматирование кода
        formatted = this.formatCode(formatted);
        
        // Экранирование HTML
        return this.escapeHtml(formatted);
    }

    replaceEmojis(text) {
        const emojiMap = {
            ':)': '😊',
            ':-)': '😊',
            ':(': '😞',
            ':-(': '😞',
            ':D': '😃',
            ':-D': '😃',
            ';)': '😉',
            ';-)': '😉',
            ':heart:': '❤️',
            ':like:': '👍',
            ':fire:': '🔥',
            ':star:': '⭐',
            ':rocket:': '🚀',
            ':100:': '💯'
        };
        
        let result = text;
        Object.keys(emojiMap).forEach(key => {
            const regex = new RegExp(this.escapeRegExp(key), 'g');
            result = result.replace(regex, emojiMap[key]);
        });
        
        return result;
    }

    formatCode(text) {
        // Обработка блоков кода в        const codeBlockRegex = /```([\s\S]*?)```/g;
        text = text.replace(codeBlockRegex, '<div class="code-block">$1</div>');
        
        // Обработка inline кода в  
        const inlineCodeRegex = /`([^`]+)`/g;
        text = text.replace(inlineCodeRegex, '<code>$1</code>');
        
        return text;
    }

    // Обновление статистики
    updateStats(messages) {
        // Подсчет уникальных пользователей
        this.uniqueUsers.clear();
        messages.forEach(msg => this.uniqueUsers.add(msg.username));
        
        document.getElementById('online-count').textContent = ${this.uniqueUsers.size} пользователей;
        document.getElementById('total-messages').textContent = messages.length;
    }

    // Обновление статуса подключения
    updateConnectionStatus(status) {
        const indicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        indicator.className = 'status-indicator ' + status;
        
        switch(status) {
            case 'online':
                statusText.textContent = 'Онлайн';
                break;
            case 'offline':
                statusText.textContent = 'Офлайн';
                break;
            case 'connecting':
                statusText.textContent = 'Подключение...';
                break;
        }
    }

    // Периодический опрос
    startPolling() {
        this.polling = setInterval(() => {
            this.fetchMessages();
        }, this.POLL_INTERVAL);
        
        // Первый запрос
        this.fetchMessages();
    }

    stopPolling() {
        if (this.polling) {
            clearInterval(this.polling);
            this.polling = null;
        }
    }

    // Вспомогательные методы
    updateCharCount(count) {
        const counter = document.getElementById('char-count');
        counter.textContent = count;
        
        if (count > 450) {
            counter.parentElement.className = 'char-counter warning';
        } else if (count >= 500) {
            counter.parentElement.className = 'char-counter danger';
        } else {
            counter.parentElement.className = 'char-counter';
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
            return 'Только что';
        } else if (diffMins < 60) {
            return ${diffMins} мин назад;
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    showNotification(title, message) {
        const modal = document.getElementById('notification-modal');
        const modalMessage = document.getElementById('modal-message');

Loading..., [21.12.2025 1:11]
modalMessage.innerHTML = `
            <h4>${title}</h4>
            <p>${message}</p>
        `;
        
        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('notification-modal').classList.remove('show');
    }

    clearLocalData() {
        if (confirm('Вы уверены, что хотите очистить все локальные данные (имя пользователя)?')) {
            localStorage.removeItem('chat_username');
            this.currentUsername = '';
            this.generateDefaultUsername();
            this.showNotification('Очистка', 'Локальные данные успешно удалены');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Методы для кнопок инструментов
    insertEmoji(emoji) {
        const input = document.getElementById('message-input');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        
        input.value = text.substring(0, start) + emoji + text.substring(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + emoji.length;
        
        this.updateCharCount(input.value.length);
    }

    insertCode() {
        const input = document.getElementById('message-input');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const selectedText = input.value.substring(start, end);
        
        if (selectedText) {
            // Обернуть выделенный текст в код
            input.value = input.value.substring(0, start) + '`' + selectedText + '`' + input.value.substring(end);
            input.focus();
            input.selectionStart = start;
            input.selectionEnd = end + 2;
        } else {
            // Вставить пустой блок кода
            this.insertEmoji('`код`');
        }
        
        this.updateCharCount(input.value.length);
    }

    clearMessage() {
        document.getElementById('message-input').value = '';
        this.updateCharCount(0);
        document.getElementById('message-input').focus();
    }
}

// Глобальные функции для кнопок инструментов
function insertEmoji(emoji) {
    window.chatApp.insertEmoji(emoji);
}

function insertCode() {
    window.chatApp.insertCode();
}

function clearMessage() {
    window.chatApp.clearMessage();
}

function closeModal() {
    window.chatApp.closeModal();
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new OnlineChat();
});