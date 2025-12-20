import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Message, CreateMessageRequest, ApiResponse } from './types';
import { MessageValidator, RateLimiter } from './utils';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const rateLimiter = new RateLimiter();

const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip  req.socket.remoteAddress  'unknown';
  
  if (rateLimiter.isRateLimited(ip)) {
    res.status(429).json({
      success: false,
      error: 'Слишком много запросов. Пожалуйста, подождите.'
    });
    return;
  }
  
  next();
};

// In-memory storage
let messages: Message[] = [];
let messageIdCounter = 1;

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip  req.socket.remoteAddress  'unknown';
  
  console.log(`[${timestamp}] ${method} ${url} from ${ip}`);
  
  res.on('finish', () => {
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode}`);
  });
  
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    messageCount: messages.length
  });
});

// Get all messages
app.get('/messages', rateLimitMiddleware, (req: Request, res: Response) => {
  try {
    // Сортировка по времени (новые сверху)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const response: ApiResponse<Message[]> = {
      success: true,
      data: sortedMessages
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Add new message
app.post('/messages', rateLimitMiddleware, (req: Request, res: Response) => {
  try {
    const { username, text } = req.body as CreateMessageRequest;
    
    // Валидация
    const usernameValidation = MessageValidator.validateUsername(username);
    const textValidation = MessageValidator.validateMessageText(text);
    
    if (!usernameValidation.valid || !textValidation.valid) {
      const errors = [...usernameValidation.errors, ...textValidation.errors];
      res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
      return;
    }
    
    // Создание нового сообщения
    const newMessage: Message = {
      id: messageIdCounter++,
      username: username.trim(),
      text: text.trim(),
      timestamp: MessageValidator.formatTimestamp(new Date())
    };
    
    messages.push(newMessage);
    
    // Ограничение количества сообщений в памяти (опционально)
    if (messages.length > 1000) {
      messages = messages.slice(-1000);
    }
    
    const response: ApiResponse<Message> = {
      success: true,
      data: newMessage
    };
    
    res.status(201).json(response);
    
    console.log(`New message added: ${newMessage.username}: ${newMessage.text}`);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Clear all messages (для тестирования)
app.delete('/messages', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      error: 'Эта операция запрещена в production'
    });
    return;
  }
  
  messages = [];
  messageIdCounter = 1;
  
  res.json({
    success: true,
    message: 'Все сообщения очищены'
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});