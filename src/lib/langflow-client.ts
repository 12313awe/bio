interface LangflowResponse {
  outputs?: Array<{
    outputs?: Array<{
      results?: { message?: { text?: string } };
      outputs?: { message?: { message?: string } };
      messages?: Array<{ message?: string }>;
    }>;
  }>;
  session_id?: string;
}

interface LangflowResult {
  response: string;
  sessionId: string;
}

// Get configuration from environment variables
const DEFAULT_FLOW_ID: string = import.meta.env.VITE_FLOW_ID || '';
const DEFAULT_LANGFLOW_URL: string = import.meta.env.VITE_LANGFLOW_BASE_URL || '';
const REQUEST_TIMEOUT: number = 30000;

// Validate required environment variables
if (!DEFAULT_FLOW_ID || !DEFAULT_LANGFLOW_URL || !import.meta.env.VITE_LANGFLOW_API_KEY || !import.meta.env.VITE_HF_TOKEN) {
  throw new Error('Eksik yapılandırma. Lütfen ortam değişkenlerini kontrol edin.');
}

// Error classes for better error handling
class LangflowError extends Error {
  constructor(message: string, public code: string = 'LANGFLOW_ERROR') {
    super(message);
    this.name = 'LangflowError';
  }
}

class NetworkError extends LangflowError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

class APIError extends LangflowError {
  constructor(public status: number, message: string) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('İstek zaman aşımına uğradı. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.');
    }
    throw error;
  }
};

/**
 * Langflow yanıtından metin çıkarmak için yardımcı fonksiyon
 * @param data - Langflow API'sinden gelen yanıt verisi
 */
const extractResponseText = (data: LangflowResponse): string => {
  if (!data) {
    throw new LangflowError('API\'den veri alınamadı');
  }

  const responseText = 
    data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ??
    data?.outputs?.[0]?.outputs?.[0]?.outputs?.message?.message ??
    data?.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message;

  if (!responseText) {
    throw new LangflowError('API\'den beklenmeyen yanıt formatı');
  }

  return responseText;
};

/**
 * Sohbet takibi için benzersiz bir oturum kimliği oluşturur
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Langflow API'sine mesaj gönderir ve tekrar deneme mantığı uygular
 * @param message - Gönderilecek mesaj
 * @param sessionId - Sohbet sürekliliği için isteğe bağlı oturum kimliği
 * @param flowId - İsteğe bağlı akış kimliği
 * @param langflowUrl - İsteğe bağlı Langflow URL'si
 * @param maxRetries - Maksimum tekrar deneme sayısı
 * @returns Langflow sonucunu döndüren bir promise
 */
export const sendMessageToLangflow = async (
  message: string,
  sessionId: string | null = null,
  flowId: string = DEFAULT_FLOW_ID,
  langflowUrl: string = DEFAULT_LANGFLOW_URL,
  maxRetries: number = 2
): Promise<LangflowResult> => {
  const url = `${langflowUrl}/api/v1/run/${flowId}`;
  const currentSessionId = sessionId || generateSessionId();
  
  const body = {
    input_value: message,
    output_type: 'chat',
    input_type: 'chat',
    session_id: currentSessionId,
    tweaks: null
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }

      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_LANGFLOW_API_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_HF_TOKEN || ''}`
          },
          body: JSON.stringify(body),
        },
        REQUEST_TIMEOUT
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(response.status, errorText);
      }

      let data: LangflowResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new LangflowError('API yanıtı ayrıştırılamadı');
      }
      
      const responseText = extractResponseText(data);
      
      return {
        response: responseText,
        sessionId: data.session_id || currentSessionId
      };
      
    } catch (error) {
      if (error instanceof NetworkError) {
        throw new NetworkError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (error instanceof APIError) {
        throw new APIError(error.status, `API isteği başarısız`);
      } else if (error instanceof LangflowError) {
        throw error;
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
        throw new LangflowError(errorMessage);
      }
    }
  }
  
  if (lastError instanceof NetworkError) {
    throw new NetworkError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
  } else if (lastError instanceof APIError) {
    throw new APIError(lastError.status, `API isteği başarısız: ${lastError.message}`);
  } else if (lastError instanceof LangflowError) {
    throw lastError;
  } else {
    const errorMessage = lastError instanceof Error ? lastError.message : 'Bilinmeyen bir hata oluştu';
    throw new LangflowError(errorMessage);
  }
}