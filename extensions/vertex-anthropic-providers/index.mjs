const VERSIONED_MODELS = [
  {
    slug: 'claude-haiku-4-5',
    title: 'Claude Haiku 4.5',
    reasoning: false,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    slug: 'claude-sonnet-4-6',
    title: 'Claude Sonnet 4.6',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    slug: 'claude-opus-4-6',
    title: 'Claude Opus 4.6',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 128_000,
  },
];

const LATEST_MODELS = [
  {
    slug: 'claude-haiku-latest',
    title: 'Claude Haiku Latest',
    reasoning: false,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    slug: 'claude-sonnet-latest',
    title: 'Claude Sonnet Latest',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 64_000,
  },
  {
    slug: 'claude-opus-latest',
    title: 'Claude Opus Latest',
    reasoning: true,
    input: ['text', 'image'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 128_000,
  },
];

function firstDefined(keys) {
  for (const key of keys) {
    if (process.env[key]) return key;
  }
  return undefined;
}

function registerVertexAnthropicProvider(pi, { provider, label, baseUrlKeys, apiKeyKeys, models }) {
  const baseUrlKey = firstDefined(baseUrlKeys);
  const apiKeyKey = firstDefined(apiKeyKeys);

  if (!baseUrlKey || !apiKeyKey) return;

  pi.registerProvider(provider, {
    baseUrl: process.env[baseUrlKey],
    apiKey: apiKeyKey,
    authHeader: true,
    api: 'anthropic-messages',
    models: models.map((model) => ({
      id: model.slug,
      name: `${label} ${model.title}`,
      reasoning: model.reasoning,
      input: model.input,
      cost: model.cost,
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
    })),
  });
}

export default function vertexAnthropicProviders(pi) {
  registerVertexAnthropicProvider(pi, {
    provider: 'anthropic-versioned',
    label: 'Anthropic',
    baseUrlKeys: [
      'ANTHROPIC_BASE_URL',
    ],
    apiKeyKeys: [
      'ANTHROPIC_AUTH_TOKEN',
    ],
    models: VERSIONED_MODELS,
  });

  registerVertexAnthropicProvider(pi, {
    provider: 'anthropic-latest',
    label: 'Anthropic',
    baseUrlKeys: [
      'ANTHROPIC_BASE_URL',
    ],
    apiKeyKeys: [
      'ANTHROPIC_AUTH_TOKEN',
    ],
    models: LATEST_MODELS,
  });

  registerVertexAnthropicProvider(pi, {
    provider: 'bosch-anthropic',
    label: 'Bosch',
    baseUrlKeys: [
      'BOSCH_ANTHROPIC_BASE_URL',
      'BOSCH_ANTHROPIC_VERTEX_BASE_URL',
      'ANTHROPIC_VERTEX_BASE_URL',
    ],
    apiKeyKeys: [
      'BOSCH_ANTHROPIC_AUTH_TOKEN',
    ],
    models: VERSIONED_MODELS,
  });

  registerVertexAnthropicProvider(pi, {
    provider: 'sap-anthropic',
    label: 'SAP',
    baseUrlKeys: [
      'SAP_ANTHROPIC_BASE_URL',
      'SAP_ANTHROPIC_VERTEX_BASE_URL',
    ],
    apiKeyKeys: [
      'SAP_ANTHROPIC_AUTH_TOKEN',
    ],
    models: VERSIONED_MODELS,
  });
}
