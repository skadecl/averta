const TargetBranches = {
  id: '/TargetBranches',
  type: 'array',
  required: true,
  minItems: 1,
  items: { type: 'string' }
};

const MessagesSchema = {
  id: '/Messages',
  type: 'object',
  additionalProperties: false,
  properties: {
    commit: { type: 'string' },
    tag: { type: 'string' }
  }
};

const WebHooksSchema = {
  id: '/WebHooks',
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      method: { type: 'string' },
      url: { type: 'string' },
      payload: { type: 'object' },
      template: { type: 'string' }
    }
  }
};

const RuleSchema = {
  id: '/Rule',
  type: 'object',
  required: true,
  properties: {
    prefixes: {
      type: 'array',
      items: { type: 'string' }
    },
    disableTag: { type: 'boolean' },
    disableFileUpdate: { type: 'boolean' }
  }
};

const FileHandlersSchema = {
  id: '/FileHandlers',
  type: 'object',
  additionalProperties: false,
  patternProperties: {
    '^[^0-9][aA-zZ0-9]+([\.]{1}[^0-9][aA-zZ0-9]+)*\.[^0-9][aA-zZ0-9]+$': {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', required: true },
          keys: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  },
};

const Config = {
  id: '/Config',
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      targetBranches: { $ref: '/TargetBranches' },
      messages: { $ref: '/Messages' },
      webHooks: { $ref: '/WebHooks' },
      rules: {
        type: 'object',
        required: true,
        additionalProperties: false,
        properties: {
          major: { $ref: '/Rule' },
          minor: { $ref: '/Rule' },
          patch: { $ref: '/Rule' }
        }
      },
      fileHandlers: { $ref: '/FileHandlers' }
    }
  }
};

export default {
  Config,
  TargetBranches,
  MessagesSchema,
  WebHooksSchema,
  RuleSchema,
  FileHandlersSchema
};
