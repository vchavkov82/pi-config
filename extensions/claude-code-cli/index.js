import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function resolveHelperPath(fileName) {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidate = resolve(currentDir, fileName);

  if (existsSync(candidate)) {
    return candidate;
  }

  throw new Error(`Unable to resolve Claude Code helper module: ${fileName}`);
}

const readinessModule = await import(pathToFileURL(resolveHelperPath('readiness.js')).href);
const { isClaudeCodeReady } = readinessModule;

function applyEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const exportMatch = line.match(/^\s*export\s+([A-Z0-9_]+)=(['"]?)(.*?)\2\s*$/);
    if (exportMatch) {
      process.env[exportMatch[1]] = exportMatch[3];
      continue;
    }

    const unsetMatch = line.match(/^\s*unset\s+([A-Z0-9_]+)\s*$/);
    if (unsetMatch) {
      delete process.env[unsetMatch[1]];
    }
  }
}

const ZERO_USAGE = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

class AssistantStream {
  constructor() {
    this.queue = [];
    this.waiting = [];
    this.done = false;
    this.finalResultPromise = new Promise((resolve) => {
      this.resolveFinalResult = resolve;
    });
  }

  push(event) {
    if (this.done) return;
    if (event.type === 'done' || event.type === 'error') {
      this.done = true;
      this.resolveFinalResult(event.type === 'done' ? event.message : event.error);
    }

    const waiter = this.waiting.shift();
    if (waiter) {
      waiter({ value: event, done: false });
    } else {
      this.queue.push(event);
    }
  }

  end(result) {
    this.done = true;
    if (result !== undefined) this.resolveFinalResult(result);
    while (this.waiting.length > 0) {
      this.waiting.shift()({ value: undefined, done: true });
    }
  }

  async *[Symbol.asyncIterator]() {
    while (true) {
      if (this.queue.length > 0) {
        yield this.queue.shift();
      } else if (this.done) {
        return;
      } else {
        const result = await new Promise((resolve) => this.waiting.push(resolve));
        if (result.done) return;
        yield result.value;
      }
    }
  }

  result() {
    return this.finalResultPromise;
  }
}

function contextToPrompt(context) {
  const parts = [];
  if (context.systemPrompt) {
    parts.push(`<system>\n${context.systemPrompt}\n</system>`);
  }

  for (const message of context.messages ?? []) {
    if (message.role === 'user') {
      parts.push(`User:\n${contentToText(message.content)}`);
    } else if (message.role === 'assistant') {
      parts.push(`Assistant:\n${contentToText(message.content)}`);
    } else if (message.role === 'toolResult') {
      parts.push(`Tool result (${message.toolCallId}):\n${contentToText(message.content)}`);
    }
  }

  return parts.join('\n\n');
}

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .map((item) => {
      if (!item) return '';
      if (item.type === 'text') return item.text ?? '';
      if (item.type === 'thinking') return item.thinking ?? '';
      if (item.type === 'toolCall') return `[tool call: ${item.name} ${JSON.stringify(item.arguments ?? {})}]`;
      if (item.type === 'image') return '[image omitted]';
      return JSON.stringify(item);
    })
    .filter(Boolean)
    .join('\n');
}

function extractClaudeJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return undefined;

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}

function createMessage(model, text, stopReason = 'stop', errorMessage) {
  const message = {
    role: 'assistant',
    content: text ? [{ type: 'text', text }] : [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: { ...ZERO_USAGE, cost: { ...ZERO_USAGE.cost } },
    stopReason,
    timestamp: Date.now(),
  };

  if (errorMessage) message.errorMessage = errorMessage;
  return message;
}

function streamViaClaudeCode(model, context, options) {
  const stream = new AssistantStream();
  const prompt = contextToPrompt(context);
  const args = [
    '--print',
    '--output-format',
    'json',
    '--model',
    model.id,
    '--permission-mode',
    'acceptEdits',
    prompt,
  ];

  const initial = createMessage(model, '');
  stream.push({ type: 'start', partial: initial });

  const child = spawn('claude', args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (options?.signal) {
    options.signal.addEventListener('abort', () => child.kill('SIGTERM'), { once: true });
  }

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', (error) => {
    const message = createMessage(model, '', 'error', error.message);
    stream.push({ type: 'error', reason: 'error', error: message });
  });

  child.on('close', (code, signal) => {
    if (options?.signal?.aborted || signal) {
      const message = createMessage(model, 'Claude Code stream aborted by caller', 'aborted');
      stream.push({ type: 'error', reason: 'aborted', error: message });
      return;
    }

    const parsed = extractClaudeJson(stdout);
    const text = parsed?.result ?? parsed?.message?.content?.[0]?.text ?? stdout.trim();

    if (code !== 0) {
      const errorText = stderr.trim() || text || `claude exited with code ${code}`;
      const message = createMessage(model, text, 'error', errorText);
      stream.push({ type: 'error', reason: 'error', error: message });
      return;
    }

    const message = createMessage(model, text);
    if (text) {
      stream.push({ type: 'text_start', contentIndex: 0, partial: message });
      stream.push({ type: 'text_delta', contentIndex: 0, delta: text, partial: message });
      stream.push({ type: 'text_end', contentIndex: 0, content: text, partial: message });
    }
    stream.push({ type: 'done', reason: 'stop', message });
  });

  return stream;
}

function streamViaBoschClaudeCode(model, context, options) {
  applyEnvFile(resolve(process.env.HOME ?? '', '.zsh', 'zsh-aliases-claude-bosch'));
  return streamViaClaudeCode(model, context, options);
}

const MODELS = [
  {
    id: 'haiku',
    name: 'Claude Haiku (via Claude Code)',
    reasoning: false,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6 (via Claude Code)',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    id: 'claude-opus-4-7',
    name: 'Claude Opus 4.7 (via Claude Code)',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 128_000,
  },
];

const BOSCH_MODELS = [
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6 (Bosch via Claude Code)',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6 (Bosch via Claude Code)',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 128_000,
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5 (Bosch via Claude Code)',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5 20251001 (Bosch via Claude Code)',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    id: 'claude-sonnet-4@20250514',
    name: 'Claude Sonnet 4 20250514 (Bosch via Claude Code)',
    reasoning: false,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
]

export default function claudeCodeCli(pi) {
  pi.registerProvider('bosch-claude-code', {
    apiKey: 'cli',
    api: 'anthropic-messages',
    baseUrl: 'local://claude-code/bosch',
    isReady: isClaudeCodeReady,
    streamSimple: streamViaBoschClaudeCode,
    models: BOSCH_MODELS,
  });

  pi.registerProvider('claude-code', {
    apiKey: 'cli',
    api: 'anthropic-messages',
    baseUrl: 'local://claude-code',
    isReady: isClaudeCodeReady,
    streamSimple: streamViaClaudeCode,
    models: MODELS,
  });
}
