import { Rule } from 'eslint';
import { CallExpression, Property } from 'estree';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Disallow JSON body in GET requests as it violates HTTP semantics',
      recommended: true,
    },
    type: 'problem',
    messages: {
      jsonInGetRequest:
        'GET requests should not include JSON data in the body. Consider using POST, PUT, or PATCH for requests with data, or move data to query parameters.',
    },
    schema: [],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    function isFetchCall(node: CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'fetch';
    }

    function getHttpMethod(optionsArg: unknown): string | null {
      if (
        optionsArg &&
        typeof optionsArg === 'object' &&
        'type' in optionsArg &&
        optionsArg.type === 'ObjectExpression' &&
        'properties' in optionsArg &&
        Array.isArray(optionsArg.properties)
      ) {
        const methodProperty = optionsArg.properties.find((prop: unknown) => {
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
            prop.key.name === 'method'
          );
        });

        if (methodProperty) {
          const prop = methodProperty as Property;
          if (
            prop.value &&
            typeof prop.value === 'object' &&
            'type' in prop.value &&
            prop.value.type === 'Literal' &&
            'value' in prop.value &&
            typeof prop.value.value === 'string'
          ) {
            return prop.value.value.toLowerCase();
          }
        }
      }

      return null; // Default is GET
    }

    function hasJSONStringifyInBody(optionsArg: unknown): boolean {
      if (
        optionsArg &&
        typeof optionsArg === 'object' &&
        'type' in optionsArg &&
        optionsArg.type === 'ObjectExpression' &&
        'properties' in optionsArg &&
        Array.isArray(optionsArg.properties)
      ) {
        const bodyProperty = optionsArg.properties.find((prop: unknown) => {
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
            prop.key.name === 'body'
          );
        });

        if (bodyProperty) {
          const prop = bodyProperty as Property;
          // Check if body value is JSON.stringify()
          return (
            prop.value &&
            typeof prop.value === 'object' &&
            'type' in prop.value &&
            prop.value.type === 'CallExpression' &&
            'callee' in prop.value &&
            prop.value.callee &&
            typeof prop.value.callee === 'object' &&
            'type' in prop.value.callee &&
            prop.value.callee.type === 'MemberExpression' &&
            'object' in prop.value.callee &&
            'property' in prop.value.callee &&
            prop.value.callee.object &&
            typeof prop.value.callee.object === 'object' &&
            'type' in prop.value.callee.object &&
            prop.value.callee.object.type === 'Identifier' &&
            'name' in prop.value.callee.object &&
            prop.value.callee.object.name === 'JSON' &&
            prop.value.callee.property &&
            typeof prop.value.callee.property === 'object' &&
            'type' in prop.value.callee.property &&
            prop.value.callee.property.type === 'Identifier' &&
            'name' in prop.value.callee.property &&
            prop.value.callee.property.name === 'stringify'
          );
        }
      }

      return false;
    }

    function isGetLikeMethod(method: string | null): boolean {
      if (!method) {
        return true; // Default is GET
      }

      const getLikeMethods = ['get', 'head', 'options'];
      return getLikeMethods.includes(method.toLowerCase());
    }

    return {
      CallExpression(node: CallExpression) {
        if (!isFetchCall(node)) {
          return;
        }

        if (node.arguments.length < 2) {
          return; // No options object
        }

        const optionsArg = node.arguments[1];
        const method = getHttpMethod(optionsArg);
        const hasJsonBody = hasJSONStringifyInBody(optionsArg);

        if (isGetLikeMethod(method) && hasJsonBody) {
          context.report({
            node,
            messageId: 'jsonInGetRequest',
          });
        }
      },
    };
  },
};

export default rule;
