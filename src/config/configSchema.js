export default {
  id: '/Config',
  type: 'array',
  items: {
    type: 'object',
    properties: {
      branches: {
        type: 'array',
        required: true,
        minItems: 1,
        items: {
          type: 'string'
        }
      },
      versioning: {
        type: 'object',
        properties: {
          major: {
            required: true,
            type: 'array',
            items: {
              type: 'string'
            }
          },
          minor: {
            required: true,
            type: 'array',
            items: {
              type: 'string'
            }
          },
          patch: {
            required: true,
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      fileHandlers: {
        required: true,
        type: 'object',
        patternProperties: {
          '^[^0-9][aA-zZ0-9]+([\.]{1}[^0-9][aA-zZ0-9]+)*\.[^0-9][aA-zZ0-9]+$': {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  required: true
                },
                keys: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        additionalProperties: false
      }
    }
  }
};
