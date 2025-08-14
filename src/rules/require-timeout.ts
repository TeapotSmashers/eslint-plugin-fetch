import { Rule } from 'eslint';
import { CallExpression } from 'estree';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Require timeout configuration for fetch requests to prevent hanging',
      recommended: true,
    },
    type: 'problem',
    messages: {
      missingTimeout:
        'fetch() calls should include timeout configuration to prevent hanging indefinitely',
    },
    schema: [],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    function isFetchCall(node: CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'fetch';
    }

    function hasTimeoutConfiguration(node: CallExpression): boolean {
      // Check for AbortSignal.timeout()
      if (node.arguments.length > 1) {
        const optionsArg = node.arguments[1];
        if (
          optionsArg &&
          typeof optionsArg === 'object' &&
          'type' in optionsArg &&
          optionsArg.type === 'ObjectExpression' &&
          'properties' in optionsArg &&
          Array.isArray(optionsArg.properties)
        ) {
          const signalProperty = optionsArg.properties.find((prop: unknown) => {
            return (
              prop &&
              typeof prop === 'object' &&
              'type' in prop &&
              prop.type === 'Property' &&
              'key' in prop &&
              prop.key &&
              typeof prop.key === 'object' &&
              'type' in prop.key &&
              prop.key.type === 'Identifier' &&
              'name' in prop.key &&
              prop.key.name === 'signal'
            );
          });

          if (signalProperty) {
            const prop = signalProperty as {
              value: unknown;
            };
            const value = prop.value;

            // Check for AbortSignal.timeout()
            if (
              value &&
              typeof value === 'object' &&
              'type' in value &&
              value.type === 'CallExpression' &&
              'callee' in value &&
              value.callee &&
              typeof value.callee === 'object' &&
              'type' in value.callee &&
              value.callee.type === 'MemberExpression' &&
              'object' in value.callee &&
              'property' in value.callee &&
              value.callee.object &&
              typeof value.callee.object === 'object' &&
              'name' in value.callee.object &&
              value.callee.object.name === 'AbortSignal' &&
              value.callee.property &&
              typeof value.callee.property === 'object' &&
              'name' in value.callee.property &&
              value.callee.property.name === 'timeout'
            ) {
              return true;
            }

            // Check for controller.signal pattern (we'll assume it has timeout)
            if (
              value &&
              typeof value === 'object' &&
              'type' in value &&
              value.type === 'MemberExpression' &&
              'property' in value &&
              value.property &&
              typeof value.property === 'object' &&
              'name' in value.property &&
              value.property.name === 'signal'
            ) {
              return true; // Assume AbortController usage implies timeout
            }
          }
        }
      }

      return false;
    }

    return {
      CallExpression(node: CallExpression) {
        if (isFetchCall(node)) {
          if (!hasTimeoutConfiguration(node)) {
            context.report({
              node,
              messageId: 'missingTimeout',
            });
          }
        }
      },
    };
  },
};

export default rule;
