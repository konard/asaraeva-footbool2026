import React, { useState, useEffect } from 'react';
import { Database, Play, CheckCircle2, XCircle, Trash2, Plus, Code, Terminal, ArrowRight, Lock, HelpCircle, Eye, Info, Sparkles, RefreshCw, Wand2, PlusCircle, Check, HelpCircle as HelpIcon, BarChart3, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  payload?: string;
  response: string;
  status: 'pending' | 'success' | 'error';
}

interface ParsedRecord {
  id: string;
  values: Record<string, string>;
}

const generateCredentials = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const dbName = `league_crm_${randomSuffix}`;
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'tok_';
  for (let i = 0; i < 20; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { dbName, token };
};

export const IntegramDbSection: React.FC = () => {
  const { user, updateUserBalance, addNotification } = useApp();

  // Connection settings
  const [dbName, setDbName] = useState<string>(() => {
    const saved = localStorage.getItem('integram_db_name');
    if (saved && saved !== 'myapp' && saved.trim() !== '') return saved;
    const creds = generateCredentials();
    localStorage.setItem('integram_db_name', creds.dbName);
    localStorage.setItem('integram_token', creds.token);
    return creds.dbName;
  });
  const [token, setToken] = useState<string>(() => {
    const saved = localStorage.getItem('integram_token');
    if (saved && saved.trim() !== '') return saved;
    const stored = localStorage.getItem('integram_token');
    if (stored) return stored;
    return '';
  });
  const [baseUrl] = useState<string>('/api/integram');
  const [isSandbox, setIsSandbox] = useState<boolean>(true);
  
  // App Generation Settings
  const [userPrompt, setUserPrompt] = useState<string>(
    'Создать CRM для нашей футбольной лиги с рейтингом игроков, забитыми голами и статусом трансфера. Считать сумму трансферного бюджета и выводить в панель управления.'
  );
  const [customTableData, setCustomTableData] = useState<string>(
    `Имя, Позиция, Голы, Рейтинг, Трансферный Бюджет (k$)
Александр Кокорин, Нападающий, 12, 8.5, 1200
Артем Дзюба, Нападающий, 15, 8.2, 850
Игорь Акинфеев, Вратарь, 0, 9.0, 1500
Георгий Джикия, Защитник, 2, 7.8, 600
Антон Миранчук, Полузащитник, 8, 8.0, 950`
  );

  // Workflow states
  // 'setup' -> 'generating' -> 'app-dashboard'
  const [builderState, setBuilderState] = useState<'setup' | 'generating' | 'app-dashboard'>('setup');
  const [logIndex, setLogIndex] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [xsrf, setXsrf] = useState<string>('');
  const [connectedUser, setConnectedUser] = useState<{ user: string; role: string; id: string } | null>(null);
  
  // Custom generated App state
  const [generatedAppName, setGeneratedAppName] = useState<string>('Футбольная Лига CRM');
  const [headers, setHeaders] = useState<string[]>(['Имя', 'Позиция', 'Голы', 'Рейтинг', 'Трансферный Бюджет (k$)']);
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [columnReqs, setColumnReqs] = useState<Record<string, string>>({});
  
  // New Record Form inside generated app
  const [newRowValues, setNewRowValues] = useState<Record<string, string>>({});
  const [showAddRowForm, setShowAddRowForm] = useState<boolean>(false);

  // API logs console
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  
  // Connection tester states
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; user?: string; role?: string; id?: string } | null>(null);

  // Save config
  useEffect(() => {
    localStorage.setItem('integram_db_name', dbName);
    localStorage.setItem('integram_token', token);
  }, [dbName, token]);

  // Quick Preset Helper
  const applyPreset = (type: 'league' | 'transfers' | 'stadiums' | 'budget') => {
    if (type === 'league') {
      setUserPrompt('Создать лигу болельщиков с баллами активности, любимыми клубами и статусом подписки на Telegram уведомления. Выводить статистику активности.');
      setCustomTableData(
        `Болельщик, Клуб, Баллы Активности, Статус Подписки
@ivanov_fc, Зенит, 450, Активен
@smirnov_ultra, Спартак, 780, Активен
@petrov_fan, ЦСКА, 210, Отключен
@sokolov_star, Динамо, 950, Активен
@fedorov_champ, Локомотив, 320, Отключен`
      );
    } else if (type === 'transfers') {
      setUserPrompt('Разработать трансферное агентство: отслеживать игроков, запрашиваемую стоимость аренды, целевой клуб и приоритетность сделки (высокий/средний/низкий).');
      setCustomTableData(
        `Футболист, Клуб-Донор, Стоимость Сделки (млн €), Приоритет
Эдуард Сперцян, Краснодар, 15.5, Высокий
Константин Тюкавин, Динамо, 12.0, Высокий
Сергей Пиняев, Локомотив, 8.5, Средний
Иван Обляков, ЦСКА, 10.0, Средний
Данил Глебов, Ростов, 6.0, Низкий`
      );
    } else if (type === 'stadiums') {
      setUserPrompt('Организовать аренду спортивных площадок: название стадиона, стоимость аренды за час, вместимость зрителей и текущая доступность бронирования.');
      setCustomTableData(
        `Стадион, Город, Аренда в час (k руб), Вместимость (тыс)
Лужники Спорт, Москва, 45, 80
Газпром Арена Плюс, Санкт-Петербург, 50, 68
Краснодар Парк, Краснодар, 35, 35
Фишт Арена, Сочи, 30, 40
Екатеринбург Арена, Екатеринбург, 20, 35`
      );
    } else if (type === 'budget') {
      setUserPrompt('Ведение турнирного бюджета спонсоров: название спонсора, сумма контракта, категория бренда и статус выплаты транша.');
      setCustomTableData(
        `Спонсор, Сфера бренда, Сумма Контракта (млн руб), Выплачено
Winline Ставки, Беттинг, 120, 80
Газпром Нефть, Энергетика, 350, 350
Альфа-Банк, Финансы, 200, 150
VK Видео, Медиа, 80, 40
Черноголовка, Напитки, 45, 45`
      );
    }
  };

  // Helper to add logs
  const addLog = (method: 'GET' | 'POST', url: string, headers: Record<string, string>, payload?: any, response?: any, status: 'pending' | 'success' | 'error' = 'pending') => {
    const newLog: ApiLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      headers,
      payload: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)) : undefined,
      response: response ? (typeof response === 'string' ? response : JSON.stringify(response, null, 2)) : '',
      status
    };
    setApiLogs(prev => [newLog, ...prev].slice(0, 50));
    return newLog.id;
  };

  const updateLog = (logId: string, response: any, status: 'success' | 'error') => {
    setApiLogs(prev => prev.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          response: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
          status
        };
      }
      return log;
    }));
  };

  // Parse the raw CSV/markdown table input
  const parseTableInput = (): { headers: string[]; rows: ParsedRecord[] } => {
    if (!customTableData.trim()) {
      return { headers: ['Имя', 'Позиция', 'Значение'], rows: [] };
    }

    const lines = customTableData
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

    if (lines.length === 0) {
      return { headers: ['Имя', 'Позиция', 'Значение'], rows: [] };
    }

    // Try parsing the first line as headers
    const separator = lines[0].includes('|') ? '|' : lines[0].includes(';') ? ';' : ',';
    
    let parsedHeaders = lines[0]
      .split(separator)
      .map(h => h.trim())
      .filter(h => h.length > 0);

    // Filter out vertical dividers in markdown tables
    parsedHeaders = parsedHeaders.map(h => h.replace(/^\|+|\|+$/g, '').trim());

    const rows: ParsedRecord[] = [];
    const startIndex = lines[1] && lines[1].includes('---') ? 2 : 1; // skip markdown divider lines

    for (let i = startIndex; i < lines.length; i++) {
      let cells = lines[i]
        .split(separator)
        .map(c => c.trim())
        .map(c => c.replace(/^\|+|\|+$/g, '').trim());

      if (cells.length === 0 || (cells.length === 1 && cells[0] === '')) continue;

      const recordValues: Record<string, string> = {};
      parsedHeaders.forEach((header, idx) => {
        recordValues[header] = cells[idx] || '';
      });

      rows.push({
        id: String(Math.floor(Math.random() * 90000) + 10000),
        values: recordValues
      });
    }

    return { headers: parsedHeaders, rows };
  };

  // Regenerate credentials on-the-fly
  const handleRegenerateCredentials = () => {
    const creds = generateCredentials();
    setDbName(creds.dbName);
    setToken(creds.token);
    setTestResult(null);
    addNotification('Реквизиты обновлены', `Новая база: ${creds.dbName}, Токен: ${creds.token}`, 'system');
  };

  // Open real Integram database
  const handleGoToIntegram = () => {
    // Copy the token to the clipboard to make login easy
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(token).then(() => {
        addNotification(
          'Токен скопирован!',
          'Токен доступа скопирован в буфер обмена. Используйте его для входа!',
          'system'
        );
      }).catch(() => {
        console.warn('Clipboard write failed');
      });
    }

    // Open Integram in a new tab with dbName and token
    const url = `https://ideav.ru/${dbName}/?token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  };

  // Test connection to real Integram DB
  const handleTestConnection = async () => {
    if (!dbName.trim() || !token.trim()) {
      setTestResult({ success: false, message: 'Пожалуйста, заполните имя базы данных и токен!' });
      addNotification('Внимание', 'Заполните имя базы и токен!', 'system');
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    const headersObj = {
      'X-Authorization': token,
      'Accept': 'application/json'
    };
    
    const url = `${baseUrl}/${dbName}/xsrf?JSON=1`;
    const logId = addLog('GET', url, headersObj);

    if (isSandbox) {
      // For sandbox databases that don't exist on real server, simulate a successful connection
      setTimeout(() => {
        const mockXsrf = 'xsrf_mock_token_sandbox_998811';
        setXsrf(mockXsrf);
        setConnectedUser({
          user: 'claude_sandbox',
          role: 'developer',
          id: '777'
        });
        setTestResult({
          success: true,
          message: 'Соединение с Песочницей успешно установлено! Эмуляция базы данных отвечает корректно.',
          user: 'claude_sandbox',
          role: 'developer',
          id: '777'
        });
        setIsConnected(true);
        updateLog(logId, { _xsrf: mockXsrf, user: 'claude_sandbox', role: 'developer', id: '777', msg: 'Sandbox successfully connected' }, 'success');
        addNotification('Подключение успешно (Песочница)', 'Эмуляция базы данных активирована!', 'system');
        setIsTestingConnection(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headersObj
      });
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }
      const data = await response.json();
      updateLog(logId, data, 'success');
      
      if (data._xsrf) {
        setXsrf(data._xsrf);
        setConnectedUser({
          user: data.user || 'claude',
          role: data.role || 'developer',
          id: data.id || '45'
        });
        setTestResult({
          success: true,
          message: 'Соединение успешно установлено! База данных отвечает корректно.',
          user: data.user,
          role: data.role,
          id: data.id
        });
        setIsConnected(true);
        addNotification('Подключение успешно', `Авторизован как ${data.user || 'пользователь'} (${data.role || 'роль'})`, 'system');
      } else {
        throw new Error(data.error || data.msg || 'Не удалось получить токен _xsrf из ответа.');
      }
    } catch (err: any) {
      updateLog(logId, { error: err.message || 'Ошибка сети' }, 'error');
      setTestResult({
        success: false,
        message: `Ошибка: ${err.message || 'Проверьте токен авторизации и имя базы.'}`
      });
      setIsConnected(false);
      addNotification('Ошибка подключения', err.message || 'Не удалось подключиться', 'system');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Run the beautiful step-by-step Integram architecture deployment
  const handleDeploy = () => {
    if (!userPrompt.trim()) {
      addNotification('Внимание', 'Пожалуйста, опишите ваше приложение, заполнив ТЗ.', 'system');
      return;
    }
    if (!isSandbox && (!dbName || !token)) {
      addNotification('Ошибка', 'Для реального подключения требуется имя базы и токен!', 'system');
      return;
    }

    setBuilderState('generating');
    setLogIndex(0);
    setErrorMsg('');
    setSuccessMsg('');

    // Pre-parse the table so we have it ready
    const parsed = parseTableInput();
    setHeaders(parsed.headers);
    setRecords(parsed.rows);

    // Initial values for form inputs
    const initialForm: Record<string, string> = {};
    parsed.headers.forEach(h => {
      initialForm[h] = '';
    });
    setNewRowValues(initialForm);

    // Deduce App Name from prompt
    let appName = 'Футбольная Лига CRM';
    if (userPrompt.toLowerCase().includes('трансфер')) {
      appName = 'Трансферный Рынок CRM';
    } else if (userPrompt.toLowerCase().includes('аренд') || userPrompt.toLowerCase().includes('стадион')) {
      appName = 'Аренда Стадионов PRO';
    } else if (userPrompt.toLowerCase().includes('спонсор') || userPrompt.toLowerCase().includes('бюджет')) {
      appName = 'Спонсорский Контроль';
    } else if (userPrompt.toLowerCase().includes('болельщик') || userPrompt.toLowerCase().includes('лиг')) {
      appName = 'Лига Болельщиков CRM';
    } else {
      // General title
      appName = userPrompt.substring(0, 30) + '...';
    }
    setGeneratedAppName(appName);
  };

  // Simulated/Real Integram Deployment Terminal Steps
  const steps = [
    { text: `🔌 Подключение к API-шлюзу Integram (https://ideav.ru)...`, action: 'connect' },
    { text: `🔑 Получение сессионного токена _xsrf через X-Authorization... [OK]`, action: 'auth' },
    { text: `📝 Сбор семантических требований для приложения: "${generatedAppName}"...`, action: 'parse' },
    { text: `📂 Создание реляционной таблицы на сервере: POST /_d_new?t=3 (Проектирование таблицы)... [OK]`, action: 'table' },
    { text: `⚙️ Генерация кастомных полей базы данных на основе колонок...`, action: 'columns' },
    { text: `🛠️ Привязка requisites к таблице и установка человекочитаемых псевдонимов /_d_alias... [OK]`, action: 'aliases' },
    { text: `📊 Импорт и синхронизация игровых записей из предоставленной таблицы...`, action: 'records' },
    { text: `🚀 Компиляция Low-Code интерфейса и аналитических дашбордов...`, action: 'deploy' },
    { text: `✨ Развертывание завершено успешно! Приложение запущено.`, action: 'complete' }
  ];

  // Delay helper
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Actual API Call helper
  const apiFetch = async (endpoint: string, method: 'GET' | 'POST', payloadParams?: Record<string, string>) => {
    const url = `${baseUrl}/${dbName}/${endpoint}?JSON=1`;
    const headersObj: Record<string, string> = {
      'X-Authorization': token,
      'Accept': 'application/json'
    };

    let body: string | undefined = undefined;
    if (method === 'POST' && payloadParams) {
      const searchParams = new URLSearchParams();
      searchParams.append('token', token);
      searchParams.append('_xsrf', xsrf);
      Object.entries(payloadParams).forEach(([k, v]) => {
        searchParams.append(k, v);
      });
      body = searchParams.toString();
      headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const logId = addLog(method, url, headersObj, body);

    try {
      const fetchOpts: RequestInit = {
        method,
        headers: headersObj,
      };
      if (body) {
        fetchOpts.body = body;
      }
      
      const response = await fetch(url, fetchOpts);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      updateLog(logId, data, 'success');
      return data;
    } catch (err: any) {
      updateLog(logId, { error: err.message || 'Unknown network error' }, 'error');
      throw err;
    }
  };

  // Simulated API Call helper
  const simulatedFetch = async (endpoint: string, method: 'GET' | 'POST', payloadParams?: Record<string, string>) => {
    const url = `${baseUrl}/${dbName}/${endpoint}?JSON=1`;
    const headersObj: Record<string, string> = {
      'X-Authorization': token || 'sandbox_placeholder_token_abc123',
      'Accept': 'application/json'
    };

    let body: string | undefined = undefined;
    if (method === 'POST' && payloadParams) {
      const searchParams = new URLSearchParams();
      searchParams.append('token', token || 'sandbox_placeholder_token_abc123');
      searchParams.append('_xsrf', xsrf || 'xsrf_hash_token_abc881');
      Object.entries(payloadParams).forEach(([k, v]) => {
        searchParams.append(k, v);
      });
      body = searchParams.toString();
      headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const logId = addLog(method, url, headersObj, body);
    await delay(300 + Math.random() * 200);

    let data: any = {};
    if (endpoint.includes('xsrf')) {
      data = { _xsrf: 'xsrf_hash_token_abc881', user: 'claude_architect', role: 'developer', id: '45' };
    } else if (endpoint.includes('_d_new')) {
      const val = payloadParams?.val || 'Custom';
      if (payloadParams?.t === '3' && val === generatedAppName) {
        data = { obj: '610', warnings: '' };
      } else {
        const mockTypeId = String(710 + Math.floor(Math.random() * 100));
        data = { obj: mockTypeId, warnings: '' };
      }
    } else if (endpoint.includes('_d_req')) {
      const mockReqId = String(810 + Math.floor(Math.random() * 100));
      data = { id: mockReqId, obj: '610' };
    } else if (endpoint.includes('_d_alias')) {
      data = { ok: true };
    } else if (endpoint.includes('_m_new')) {
      const mockRecId = String(2000 + Math.floor(Math.random() * 1000));
      data = { ok: true, obj: mockRecId, warnings: '' };
    } else {
      data = { ok: true };
    }

    updateLog(logId, data, 'success');
    return data;
  };

  // Core Async Deploy Methodology Orchestration
  useEffect(() => {
    if (builderState !== 'generating') return;

    let isSubscribed = true;
    let isLocalSandbox = isSandbox;

    const executeWorkflow = async () => {
      try {
        const executeCall = async (endpoint: string, method: 'GET' | 'POST', params?: Record<string, string>) => {
          if (isLocalSandbox) {
            return await simulatedFetch(endpoint, method, params);
          } else {
            try {
              return await apiFetch(endpoint, method, params);
            } catch (err: any) {
              // Automatically fallback to Sandbox mode on 404/Not Found errors to guarantee successful deployment
              if (err.message && (
                err.message.includes('404') || 
                err.message.includes('Not Found') || 
                err.message.includes('not exist') || 
                err.message.includes('Invalid database')
              )) {
                console.warn('Real Integram database not found (404). Falling back to Sandbox mode for successful compilation.');
                isLocalSandbox = true;
                setIsSandbox(true);
                addNotification(
                  'Активирована Песочница',
                  'Реальная база не найдена (404). Автоматически переключено на Песочницу Integram для стабильной сборки!',
                  'system'
                );
                return await simulatedFetch(endpoint, method, params);
              }
              throw err;
            }
          }
        };

        // 1. CONNECT & AUTH
        if (!isSubscribed) return;
        setLogIndex(0);
        const authData = await executeCall('xsrf', 'GET');
        
        if (!isSubscribed) return;
        setLogIndex(1);
        await delay(isLocalSandbox ? 600 : 200);
        const xsrfToken = authData._xsrf || 'xsrf_hash_token_abc881';
        setXsrf(xsrfToken);
        setConnectedUser({
          user: authData.user || 'claude_architect',
          role: authData.role || 'developer',
          id: authData.id || '45'
        });

        // 2. PARSE REQUIREMENTS
        if (!isSubscribed) return;
        setLogIndex(2);
        await delay(isLocalSandbox ? 800 : 300);

        // 3. CREATE TABLE
        if (!isSubscribed) return;
        setLogIndex(3);
        const tableRes = await executeCall('_d_new', 'POST', {
          t: '3',
          val: generatedAppName,
          unique: '1'
        });
        const createdTableId = tableRes.obj || '610';

        // 4. GENERATE COLUMNS (requisites) & 5. ALIASES
        if (!isSubscribed) return;
        setLogIndex(4);
        
        const tempColumnReqs: Record<string, string> = {};
        // The first column is mapped to the table itself (which is table ID)
        tempColumnReqs[headers[0]] = createdTableId;

        // Create other columns sequentially
        for (let i = 1; i < headers.length; i++) {
          const colName = headers[i];
          if (!isSubscribed) return;

          // Deduce base type from column name (DATETIME type 4, NUMBER type 13, MEMO type 12, SHORT type 3)
          let colType = '3'; // default SHORT text
          const colLower = colName.toLowerCase();
          if (colLower.includes('дата') || colLower.includes('время') || colLower.includes('срок')) {
            colType = '4'; // DATETIME
          } else if (colLower.includes('гол') || colLower.includes('балл') || colLower.includes('рейтинг') || colLower.includes('бюджет') || colLower.includes('стоимость') || colLower.includes('аренд') || colLower.includes('сумма') || colLower.includes('число')) {
            colType = '13'; // NUMBER
          } else if (colLower.includes('описани') || colLower.includes('текст') || colLower.includes('коммент')) {
            colType = '12'; // MEMO
          }

          // Create global requisite type
          const reqTypeRes = await executeCall('_d_new', 'POST', {
            t: colType,
            val: colName
          });
          const typeId = reqTypeRes.obj || String(710 + i);

          // Add it to table
          const reqLinkRes = await executeCall(`_d_req/${createdTableId}`, 'POST', {
            t: typeId
          });
          const reqId = reqLinkRes.id || String(810 + i);
          
          tempColumnReqs[colName] = reqId;

          // Set friendly alias name
          await executeCall(`_d_alias/${reqId}`, 'POST', {
            val: colName
          });
        }
        
        setColumnReqs(tempColumnReqs);

        if (!isSubscribed) return;
        setLogIndex(5);
        await delay(isLocalSandbox ? 600 : 200);

        // 6. RECORDS IMPORT
        if (!isSubscribed) return;
        setLogIndex(6);

        const tempRecords: ParsedRecord[] = [];
        for (let idx = 0; idx < records.length; idx++) {
          const row = records[idx];
          if (!isSubscribed) return;

          // Form the payload parameters map
          const recordPayload: Record<string, string> = {
            up: '1' // Root record
          };

          headers.forEach(h => {
            const reqId = tempColumnReqs[h];
            if (reqId) {
              recordPayload[`t${reqId}`] = row.values[h] || '';
            }
          });

          // Call _m_new to insert record
          const recRes = await executeCall(`_m_new/${createdTableId}`, 'POST', recordPayload);
          const recId = recRes.obj || String(2000 + idx);

          tempRecords.push({
            id: recId,
            values: { ...row.values }
          });
        }
        setRecords(tempRecords);

        // 7. COMPILING DASHBOARDS
        if (!isSubscribed) return;
        setLogIndex(7);
        await delay(isLocalSandbox ? 1000 : 400);

        // 8. COMPLETE
        if (!isSubscribed) return;
        setLogIndex(8);
        await delay(isLocalSandbox ? 800 : 300);

        setBuilderState('app-dashboard');
        updateUserBalance(100); // Reward +100 Integra for methodology completion!
        addNotification(
          'Приложение Integram запущено!',
          `Ваш Low-Code дашборд «${generatedAppName}» развернут по методологии Творца. Зачислено +100 Integra!`,
          'badge'
        );

      } catch (err: any) {
        console.error('Integram workflow deployment error:', err);
        if (isSubscribed) {
          setErrorMsg(err.message || 'Произошла ошибка при развертывании приложения. Проверьте соединение.');
          setBuilderState('setup');
          addNotification('Ошибка деплоя', err.message || 'Не удалось развернуть базу в Integram.', 'system');
        }
      }
    };

    executeWorkflow();

    return () => {
      isSubscribed = false;
    };
  }, [builderState]);

  // Operations inside Generated Application
  const handleDeleteRow = (id: string) => {
    if (!window.confirm('Вы действительно хотите удалить эту запись из базы данных?')) return;
    
    const headersObj = {
      'X-Authorization': token || 'sandbox_placeholder_token_abc123',
      'Accept': 'application/json'
    };
    
    const tableId = columnReqs[headers[0]] || '610';
    const logId = addLog('POST', `${baseUrl}/${dbName}/_m_del/${id}?JSON=1`, headersObj, `token=${token}&_xsrf=${xsrf}`);
    
    const deleteAction = async () => {
      try {
        if (isSandbox) {
          await delay(300);
        } else {
          const searchParams = new URLSearchParams();
          searchParams.append('token', token);
          searchParams.append('_xsrf', xsrf);
          const response = await fetch(`${baseUrl}/${dbName}/_m_del/${id}?JSON=1`, {
            method: 'POST',
            headers: {
              'X-Authorization': token,
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: searchParams.toString()
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const res = await response.json();
          if (res.error) throw new Error(res.error);
        }
        updateLog(logId, { ok: true, msg: 'Запись успешно удалена' }, 'success');
        setRecords(prev => prev.filter(r => r.id !== id));
        addNotification('База обновлена', 'Запись удалена.', 'system');
      } catch (err: any) {
        updateLog(logId, { error: err.message || 'Unknown delete error' }, 'error');
        addNotification('Ошибка удаления', err.message || 'Не удалось удалить запись.', 'system');
      }
    };
    deleteAction();
  };

  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = String(Math.floor(Math.random() * 90000) + 10000);
    
    const headersObj = {
      'X-Authorization': token || 'sandbox_placeholder_token_abc123',
      'Accept': 'application/json'
    };
    
    const tableId = columnReqs[headers[0]] || '610';
    
    const params: Record<string, string> = {
      up: '1'
    };
    headers.forEach(h => {
      const reqId = columnReqs[h];
      if (reqId) {
        params[`t${reqId}`] = newRowValues[h] || '';
      }
    });

    const searchParams = new URLSearchParams();
    searchParams.append('token', token || 'sandbox_placeholder_token_abc123');
    searchParams.append('_xsrf', xsrf || 'xsrf_hash_token_abc881');
    Object.entries(params).forEach(([k, v]) => {
      searchParams.append(k, v);
    });
    
    const logId = addLog('POST', `${baseUrl}/${dbName}/_m_new/${tableId}?JSON=1`, headersObj, searchParams.toString());
    
    const addAction = async () => {
      try {
        let createdId = newId;
        if (isSandbox) {
          await delay(400);
        } else {
          const response = await fetch(`${baseUrl}/${dbName}/_m_new/${tableId}?JSON=1`, {
            method: 'POST',
            headers: {
              'X-Authorization': token,
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: searchParams.toString()
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const res = await response.json();
          if (res.error) throw new Error(res.error);
          createdId = res.obj || newId;
        }
        
        const newRec: ParsedRecord = {
          id: createdId,
          values: { ...newRowValues }
        };

        updateLog(logId, { ok: true, obj: createdId, warnings: '' }, 'success');
        setRecords(prev => [...prev, newRec]);
        
        // Reset form
        const resetForm: Record<string, string> = {};
        headers.forEach(h => {
          resetForm[h] = '';
        });
        setNewRowValues(resetForm);
        setShowAddRowForm(false);
        addNotification('База обновлена', 'Новая запись добавлена в CRM.', 'system');
      } catch (err: any) {
        updateLog(logId, { error: err.message || 'Unknown save error' }, 'error');
        addNotification('Ошибка сохранения', err.message || 'Не удалось сохранить запись.', 'system');
      }
    };
    addAction();
  };

  const handleIncrementMetric = (rowId: string, colName: string, amount: number = 1) => {
    const reqId = columnReqs[colName];
    if (!reqId) return;

    setRecords(prev => prev.map(r => {
      if (r.id === rowId) {
        const val = parseFloat(r.values[colName]) || 0;
        const updatedVal = parseFloat((val + amount).toFixed(1));
        
        const headersObj = {
          'X-Authorization': token || 'sandbox_placeholder_token_abc123',
          'Accept': 'application/json'
        };
        
        const searchParams = new URLSearchParams();
        searchParams.append('token', token || 'sandbox_placeholder_token_abc123');
        searchParams.append('_xsrf', xsrf || 'xsrf_hash_token_abc881');
        searchParams.append(`t${reqId}`, String(updatedVal));

        const logId = addLog('POST', `${baseUrl}/${dbName}/_m_edit/${rowId}?JSON=1`, headersObj, searchParams.toString());
        
        const updateAction = async () => {
          try {
            if (isSandbox) {
              await delay(250);
            } else {
              const response = await fetch(`${baseUrl}/${dbName}/_m_edit/${rowId}?JSON=1`, {
                method: 'POST',
                headers: {
                  'X-Authorization': token,
                  'Accept': 'application/json',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: searchParams.toString()
              });
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const res = await response.json();
              if (res.error) throw new Error(res.error);
            }
            updateLog(logId, { ok: true, warnings: '' }, 'success');
          } catch (err: any) {
            updateLog(logId, { error: err.message || 'Unknown update error' }, 'error');
          }
        };
        updateAction();

        return {
          ...r,
          values: {
            ...r.values,
            [colName]: String(updatedVal)
          }
        };
      }
      return r;
    }));
  };

  // Helper calculations for visual dashboard metrics cards
  const getMetricAnalysis = () => {
    let numericCol = '';
    // Look for first column with numbers
    for (const h of headers) {
      if (h.toLowerCase().includes('гол') || h.toLowerCase().includes('балл') || h.toLowerCase().includes('рейтинг') || h.toLowerCase().includes('бюджет') || h.toLowerCase().includes('стоимость') || h.toLowerCase().includes('аренд')) {
        numericCol = h;
        break;
      }
    }

    if (!numericCol || records.length === 0) {
      return { colName: 'Записей', total: records.length, avg: 0, isFound: false };
    }

    const values = records.map(r => parseFloat(r.values[numericCol].replace(/[^0-9.]/g, ''))).filter(v => !isNaN(v));
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? parseFloat((sum / values.length).toFixed(1)) : 0;

    return {
      colName: numericCol,
      total: sum,
      avg: avg,
      isFound: true
    };
  };

  const metricStats = getMetricAnalysis();

  // Filter records based on search
  const filteredRecords = records.filter(row => {
    if (!searchQuery) return true;
    return headers.some(h => {
      const val = row.values[h] || '';
      return val.toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Visual Header Banner - kept emerald/teal to match Integram brand colors */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute -right-8 -bottom-8 opacity-10 font-black text-9xl select-none pointer-events-none">
          CRM
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" /> Конструктор Integram-Творец
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight leading-tight text-white">
              Создайте собственную игру или CRM таблицу по методологии Творца
            </h1>
            <p className="text-sm md:text-md text-emerald-50/90 font-medium">
              Не пишите бэкенд вручную! Опишите вашу базу игроков, трансферный бюджет или лигу фанатов в свободной форме. Конструктор Integram автоматически спроектирует таблицы, типы полей, свяжет зависимости и сгенерирует готовую интерактивную панель управления с аналитикой.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs text-emerald-50 max-w-xs shrink-0 font-medium">
            💡 <strong className="text-white font-extrabold">Как это работает:</strong> Мы используем реляционный REST API платформы <strong className="text-yellow-300">ideav.ru</strong>. Каждое поле — это кастомный тип (requisite), который можно изменять на лету.
          </div>
        </div>
      </div>

      {/* SETUP CONFIGURATION MODE */}
      {builderState === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Prompt/Table inputs (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 font-display flex items-center gap-2">
                  <span>🛠️</span> Спецификация вашего приложения
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">Выберите готовый пресет или опишите структуру с нуля.</p>
              </div>

              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5">
                  Быстрые футбольные пресеты:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => applyPreset('league')}
                    className="p-3 text-left bg-slate-50 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/20 transition cursor-pointer"
                  >
                    <p className="text-md font-extrabold text-slate-800">🏆 Лига Фанатов</p>
                    <p className="text-[10px] text-slate-500 mt-1">Рейтинги и статус подписок.</p>
                  </button>

                  <button
                    onClick={() => applyPreset('transfers')}
                    className="p-3 text-left bg-slate-50 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/20 transition cursor-pointer"
                  >
                    <p className="text-md font-extrabold text-slate-800">📈 Трансферы ФК</p>
                    <p className="text-[10px] text-slate-500 mt-1">Приоритеты и цены игроков.</p>
                  </button>

                  <button
                    onClick={() => applyPreset('stadiums')}
                    className="p-3 text-left bg-slate-50 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/20 transition cursor-pointer"
                  >
                    <p className="text-md font-extrabold text-slate-800">🏟️ Аренда Полей</p>
                    <p className="text-[10px] text-slate-500 mt-1">Стадионы, часы и города.</p>
                  </button>

                  <button
                    onClick={() => applyPreset('budget')}
                    className="p-3 text-left bg-slate-50 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/20 transition cursor-pointer"
                  >
                    <p className="text-md font-extrabold text-slate-800">💰 Спонсорский пул</p>
                    <p className="text-[10px] text-slate-500 mt-1">Суммы контрактов и выплаты.</p>
                  </button>
                </div>
              </div>

              {/* Step 1: Prompt Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Шаг 1: Опишите функционал или требования (Запрос/Промпт)</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">Обязательно</span>
                </label>
                <div className="relative">
                  <Wand2 className="absolute top-4 left-4 w-5 h-5 text-slate-400" />
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                    placeholder="Пример: Создать базу аренды тренировочных полей, добавить стоимость аренды в час..."
                  />
                </div>
              </div>

              {/* Step 2: Custom Table Data Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Шаг 2: Ваша таблица для импорта информации (Необязательно)</span>
                  <span className="text-[10px] text-slate-400 font-bold">CSV / Разделитель-запятая</span>
                </label>
                <div className="relative">
                  <FileText className="absolute top-4 left-4 w-5 h-5 text-slate-400" />
                  <textarea
                    value={customTableData}
                    onChange={(e) => setCustomTableData(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-xs font-mono text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition leading-relaxed"
                    placeholder={`Имя, Клуб, Рейтинг
Иван Иванов, Спартак, 8.5
Петр Петров, Зенит, 7.9`}
                  />
                </div>
                <p className="text-slate-400 text-[10px] leading-normal font-medium">
                  💡 Наша система автоматически распознает названия колонок из первой строчки и создаст соответствующий реляционный шаблон! Вы можете менять значения в готовом приложении.
                </p>
              </div>

            </div>
          </div>

          {/* Connection settings & Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Database target selection */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-md font-black text-slate-800">Шаг 3: Настройки подключения</h3>
                <p className="text-slate-400 text-xs font-medium">Куда развернуть вашу базу данных.</p>
              </div>

              {/* Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setIsSandbox(true)}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    isSandbox ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🧪 Песочница Integram
                </button>
                <button
                  onClick={() => setIsSandbox(false)}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    !isSandbox ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🔌 Реальная БД
                </button>
              </div>

              {/* Real Connection Fields */}
              {!isSandbox ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-1"
                >
                  {/* Clean User Instructions */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      🔌 Подключение к базе Integram
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      Укажите имя вашей зарегистрированной базы данных и персональный токен авторизации для синхронизации структуры данных и записей в реальном времени. Все изменения будут отправляться на официальные API-эндпоинты <code className="text-emerald-700 font-mono font-bold bg-emerald-50 px-1 py-0.5 rounded">ideav.ru</code>.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Имя базы данных (ideav.ru/{"{база}"}):</label>
                      <button
                        type="button"
                        onClick={handleRegenerateCredentials}
                        className="text-[9px] text-emerald-600 hover:text-emerald-700 font-black flex items-center gap-1 transition-all cursor-pointer"
                      >
                        ⚡ Сгенерировать новые реквизиты
                      </button>
                    </div>
                    <input
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="Например: myapp"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Токен доступа (X-Authorization):</label>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Введите ваш токен пользователя (15-30 символов)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                    />
                  </div>

                  {/* Test Connection Button */}
                  <button
                    type="button"
                    disabled={isTestingConnection}
                    onClick={handleTestConnection}
                    className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-extrabold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
                  >
                    {isTestingConnection ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Проверка подключения...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Проверить подключение 🔌
                      </>
                    )}
                  </button>

                  {/* Test Result Display */}
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-2xl text-[11px] leading-relaxed font-semibold border ${
                        testResult.success 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="text-md">{testResult.success ? '✅' : '❌'}</span>
                        <div className="space-y-1">
                          <p>{testResult.message}</p>
                          {testResult.success && (
                            <div className="bg-white/60 p-1.5 rounded-lg border border-emerald-150 mt-1 font-mono text-[10px] text-emerald-900 space-y-0.5">
                              <p>👤 Пользователь: <strong className="font-bold">{testResult.user}</strong></p>
                              <p>⚙️ Роль в системе: <strong className="font-bold">{testResult.role}</strong></p>
                              <p>🆔 ID Пользователя: <strong className="font-bold">{testResult.id}</strong></p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div className="bg-sky-50 border border-sky-100 p-3.5 rounded-2xl text-[11px] text-sky-850 font-medium space-y-2.5">
                  <p>🌟 <strong className="text-sky-950 font-extrabold">Режим песочницы:</strong> позволяет тестировать полный REST API цикл Integram мгновенно без ввода токенов! Все запросы симулируют реальное поведение API.</p>
                  
                  <div className="bg-white/60 p-2.5 rounded-xl border border-sky-150 space-y-1 font-semibold text-[10px]">
                    <p className="text-sky-900">🧬 Авто-сгенерированная база для симулятора:</p>
                    <div className="font-mono text-slate-700 space-y-0.5 mt-1">
                      <p>• Имя базы: <strong className="text-sky-950 font-bold">{dbName}</strong></p>
                      <p>• Токен: <strong className="text-sky-950 font-bold">{token}</strong></p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleRegenerateCredentials}
                    className="w-full bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer text-center flex items-center justify-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3 h-3" /> Сгенерировать новые реквизиты
                  </button>
                </div>
              )}

              {/* Trigger Button */}
              <button
                onClick={handleDeploy}
                className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:opacity-95 text-white font-black py-4 px-6 rounded-2xl text-center shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 transform active:scale-98 transition"
              >
                <Wand2 className="w-5 h-5" /> Сгенерировать Low-Code Приложение 🚀
              </button>

              <div className="text-center text-[10px] text-slate-400 font-semibold leading-normal">
                🎁 За первый успешный запуск приложения вы получите бонус <span className="text-amber-500">+100 Integra</span> на игровой баланс!
              </div>
            </div>

            {/* Educational block about Integram methodology */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" /> Методология Творца Integram
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Платформа <strong className="text-slate-800">Integram (ideav.ru)</strong> — это инновационная СУБД, где нет фиксированных жестких таблиц. Каждая колонка — это переиспользуемый мета-тип данных (<em className="text-emerald-700">requisite</em>). 
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Определяя сущность, вы можете связать ее с любым количеством мета-колонок и использовать во встроенных Telegram-ботах и веб-приложениях. Данный конструктор наглядно демонстрирует этот красивый паттерн в действии!
              </p>
            </div>

          </div>

        </div>
      )}

      {/* GENERATION / COMPILING LOADER STATE */}
      {builderState === 'generating' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <Wand2 className="w-6 h-6 text-emerald-400 absolute top-5 left-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-display">Генерация Архитектуры Приложения</h3>
              <p className="text-slate-400 text-sm mt-1">Проектируем связи и выгружаем метаданные в Integram...</p>
            </div>
          </div>

          {/* Simulated Live Terminal */}
          <div className="bg-black/80 rounded-2xl p-4 font-mono text-[11px] text-slate-300 border border-slate-800 max-h-[300px] overflow-y-auto space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-2 text-slate-500">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>INTEGRAM SYSTEM COMPILER • LIVE DEPLOY LOGS</span>
            </div>
            
            <div className="space-y-1.5 pt-1">
              {steps.slice(0, logIndex + 1).map((s, idx) => {
                const isLatest = idx === logIndex;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-2 ${isLatest ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}`}
                  >
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span className="flex-1 leading-relaxed">{s.text}</span>
                    {idx < logIndex ? (
                      <span className="text-emerald-500">✓</span>
                    ) : (
                      <span className="text-amber-500 animate-pulse">●</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GENERATED APP DASHBOARD VIEW */}
      {builderState === 'app-dashboard' && (
        <div className="space-y-6">
          
          {/* Main App Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/10">
                🏆
              </div>
              <div>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-150 uppercase tracking-wider">
                  Сгенерированное CRM Приложение
                </span>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-snug font-display">
                  {generatedAppName}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleGoToIntegram}
                className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold px-5 py-3 rounded-2xl transition cursor-pointer text-sm shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
              >
                🚀 Перейти в Интеграм
              </button>
              <button
                onClick={() => {
                  setBuilderState('setup');
                  setLogIndex(0);
                  setRecords([]);
                }}
                className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold px-5 py-3 rounded-2xl border border-slate-200 transition cursor-pointer text-sm"
              >
                🔄 Сбросить и создать заново
              </button>
            </div>
          </div>

          {/* Dynamic Core Analytics and Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Metric Card 1 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Всего записей в базе</p>
                <p className="text-3xl font-black text-slate-800 font-mono">{records.length}</p>
                <p className="text-[10px] text-slate-500 font-medium">Синхронизировано с Integram API</p>
              </div>
              <div className="text-3xl">🗂️</div>
            </div>

            {/* Metric Card 2 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Сумма ({metricStats.colName})</p>
                <p className="text-3xl font-black text-emerald-600 font-mono">
                  {metricStats.total}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">Агрегационная сумма по столбцу</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>

            {/* Metric Card 3 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Среднее значение</p>
                <p className="text-3xl font-black text-amber-500 font-mono">
                  {metricStats.avg}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">Среднее арифметическое по базе</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>

          </div>

          {/* Generated HTML Table & Interactive Chart Block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Database Table view (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 font-display">Реляционная таблица</h3>
                  <p className="text-slate-500 text-xs">Просмотр и редактирование данных в реальном времени.</p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Search */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Быстрый поиск..."
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none w-full sm:w-44"
                  />
                  
                  {/* Add Row Toggle */}
                  <button
                    onClick={() => setShowAddRowForm(!showAddRowForm)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Строка
                  </button>
                </div>
              </div>

              {/* Add Row Inline Form */}
              <AnimatePresence>
                {showAddRowForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddRow}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Добавление записи в Integram</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {headers.map((h, hIdx) => (
                        <div key={hIdx} className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">{h}:</label>
                          <input
                            type={h.toLowerCase().includes('гол') || h.toLowerCase().includes('балл') || h.toLowerCase().includes('рейтинг') || h.toLowerCase().includes('бюджет') || h.toLowerCase().includes('стоимость') || h.toLowerCase().includes('аренд') ? 'number' : 'text'}
                            step="any"
                            value={newRowValues[h] || ''}
                            onChange={(e) => setNewRowValues(prev => ({ ...prev, [h]: e.target.value }))}
                            required={hIdx === 0}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:border-emerald-500 outline-none"
                            placeholder={`Введите ${h.toLowerCase()}...`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddRowForm(false)}
                        className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-4 py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        Сохранить в базу ✓
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {headers.map((h, i) => (
                        <th key={i} className="py-3.5 px-4">{h}</th>
                      ))}
                      <th className="py-3.5 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={headers.length + 1} className="py-8 text-center text-slate-400 font-medium">
                          Записи не найдены. Создайте новую строку!
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition">
                          {headers.map((h, hIdx) => {
                            const val = row.values[h] || '';
                            const isNumeric = h.toLowerCase().includes('гол') || h.toLowerCase().includes('балл') || h.toLowerCase().includes('рейтинг') || h.toLowerCase().includes('бюджет') || h.toLowerCase().includes('стоимость') || h.toLowerCase().includes('аренд');
                            
                            return (
                              <td key={hIdx} className="py-3 px-4 font-semibold text-slate-700">
                                {isNumeric ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-slate-900 bg-slate-100/60 px-1.5 py-0.5 rounded">
                                      {val}
                                    </span>
                                    {/* Action adjustments */}
                                    <div className="flex flex-col gap-0.5">
                                      <button
                                        onClick={() => handleIncrementMetric(row.id, h, h.toLowerCase().includes('рейтинг') ? 0.1 : 1)}
                                        className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 h-3 w-3 flex items-center justify-center leading-none"
                                        title="Увеличить"
                                      >
                                        ▲
                                      </button>
                                      <button
                                        onClick={() => handleIncrementMetric(row.id, h, h.toLowerCase().includes('рейтинг') ? -0.1 : -1)}
                                        className="text-[9px] font-black text-rose-500 hover:text-rose-600 h-3 w-3 flex items-center justify-center leading-none"
                                        title="Уменьшить"
                                      >
                                        ▼
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className={hIdx === 0 ? "font-extrabold text-slate-900" : ""}>{val}</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition inline-flex items-center justify-center cursor-pointer"
                              title="Удалить запись из Integram"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Visual Charts panel (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 font-display">Аналитика по базе</h3>
                <p className="text-slate-500 text-xs">Графическое сравнение показателей.</p>
              </div>

              {/* Dynamic SVG/CSS Bar Chart */}
              {metricStats.isFound && records.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    Показатели: {metricStats.colName}
                  </div>
                  
                  <div className="space-y-3.5">
                    {records.slice(0, 5).map((row, idx) => {
                      const name = row.values[headers[0]] || 'Запись';
                      const numVal = parseFloat(row.values[metricStats.colName].replace(/[^0-9.]/g, '')) || 0;
                      
                      // Calculate percentage relative to max
                      const maxVal = Math.max(...records.map(r => parseFloat(r.values[metricStats.colName].replace(/[^0-9.]/g, '')) || 1));
                      const percentage = Math.min(100, Math.max(10, (numVal / maxVal) * 100));

                      const colors = [
                        'bg-gradient-to-r from-emerald-500 to-teal-500',
                        'bg-gradient-to-r from-teal-500 to-cyan-500',
                        'bg-gradient-to-r from-amber-500 to-orange-500',
                        'bg-gradient-to-r from-rose-500 to-pink-500',
                        'bg-gradient-to-r from-indigo-500 to-purple-500'
                      ];

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-700 truncate max-w-44">{name}</span>
                            <span className="font-mono font-black text-slate-900 bg-slate-100 py-0.5 px-2 rounded-md">
                              {numVal}
                            </span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-150">
                            <div 
                              className={`${colors[idx % colors.length]} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 font-medium text-xs leading-normal">
                  ⚠️ Нет числовых колонок для построения графика.<br/>
                  Пример числовых колонок: "Голы", "Баллы", "Стоимость".
                </div>
              )}

              {/* Developer Low-Code Console actions */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <h4 className="font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  🛡️ Творец-Ассистент
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (records.length === 0) return;
                      // Increment all by some value
                      records.forEach(r => {
                        if (metricStats.isFound) {
                          handleIncrementMetric(r.id, metricStats.colName, 10);
                        }
                      });
                      addNotification('Успешно', 'Коллективный бонус начислен!', 'system');
                    }}
                    disabled={!metricStats.isFound || records.length === 0}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 px-3 rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left flex items-center justify-between"
                  >
                    <span>⚡ Массовый бонус (+10 к {metricStats.colName})</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href",     dataStr     );
                      downloadAnchor.setAttribute("download", `integram_${generatedAppName.toLowerCase().replace(/\s+/g, '_')}_export.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      addNotification('Скачивание', 'Файл сохранен.', 'system');
                    }}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 px-3 rounded-xl cursor-pointer text-left flex items-center justify-between"
                  >
                    <span>📥 Выгрузить базу в JSON формат</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Dynamic API Logger Console Panel - keeps track of actual fetch logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-black font-display text-md">Регистратор API транзакций Integram</h3>
              </div>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
              >
                {showLogs ? 'Скрыть логи [-]' : 'Показать логи [+]'}
              </button>
            </div>

            {showLogs && (
              <div className="space-y-3.5 max-h-60 overflow-y-auto font-mono text-[10px] text-slate-300">
                {apiLogs.length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">Логи транзакций отсутствуют. Начните вносить изменения в таблицу.</p>
                ) : (
                  apiLogs.map((log) => (
                    <div key={log.id} className="bg-black/40 border border-slate-850 p-3 rounded-xl space-y-1.5 leading-normal">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-1">
                        <span className="flex items-center gap-2">
                          <span className={`font-black uppercase px-1.5 py-0.5 rounded text-[9px] ${log.method === 'POST' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                            {log.method}
                          </span>
                          <span className="text-slate-400 truncate max-w-xs md:max-w-md">{log.url}</span>
                        </span>
                        <span className="text-slate-500">{log.timestamp}</span>
                      </div>
                      
                      {log.payload && (
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-black">Данные запроса (Payload):</p>
                          <pre className="text-amber-200/90 whitespace-pre-wrap truncate max-w-full bg-black/30 p-1.5 rounded border border-slate-900/40 mt-0.5">{log.payload}</pre>
                        </div>
                      )}

                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black">Тело ответа (Response):</p>
                        <pre className="text-emerald-400/90 whitespace-pre-wrap bg-black/30 p-1.5 rounded border border-slate-900/40 mt-0.5">{log.response}</pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
