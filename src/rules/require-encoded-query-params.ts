import { Rule } from 'eslint';
import { CallExpression, Node } from 'estree';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description: 'Require proper encoding of query parameters in fetch URLs',
      recommended: true,
      url: 'https://github.com/teapot-smashers/eslint-plugin-fetch/blob/master/docs/rules/require-encoded-query-params.md',
    },
    messages: {
      unsafeQueryParam:
        'Query parameters should be encoded using encodeURIComponent(), URL, or URLSearchParams to prevent injection attacks.',
      preferURLSearchParams:
        'Consider using URLSearchParams for building query strings instead of manual concatenation.',
    },
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: {
          allowManualEncoding: {
            type: 'boolean',
            description:
              'Allow manual concatenation if encodeURIComponent is used',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = context.options[0] || {};
    const allowManualEncoding = options.allowManualEncoding !== false; // default true

    function isFetchCall(node: CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'fetch';
    }

    function hasEncodeURIComponent(node: unknown): boolean {
      if (
        node &&
        typeof node === 'object' &&
        'type' in node &&
        node.type === 'CallExpression' &&
        'callee' in node &&
        node.callee &&
        typeof node.callee === 'object' &&
        'type' in node.callee &&
        node.callee.type === 'Identifier' &&
        'name' in node.callee &&
        node.callee.name === 'encodeURIComponent'
      ) {
        return true;
      }

      // Recursively check child nodes
      if (node && typeof node === 'object') {
        for (const key in node) {
          if (key === 'parent' || key === 'range' || key === 'loc') continue;
          const child = (node as Record<string, unknown>)[key];
          if (Array.isArray(child)) {
            for (const item of child) {
              if (
                item &&
                typeof item === 'object' &&
                hasEncodeURIComponent(item)
              ) {
                return true;
              }
            }
          } else if (
            child &&
            typeof child === 'object' &&
            hasEncodeURIComponent(child)
          ) {
            return true;
          }
        }
      }
      return false;
    }

    function hasURLConstructor(node: unknown): boolean {
      if (
        node &&
        typeof node === 'object' &&
        'type' in node &&
        node.type === 'NewExpression' &&
        'callee' in node &&
        node.callee &&
        typeof node.callee === 'object' &&
        'type' in node.callee &&
        node.callee.type === 'Identifier' &&
        'name' in node.callee &&
        node.callee.name === 'URL'
      ) {
        return true;
      }

      // Recursively check child nodes
      if (node && typeof node === 'object') {
        for (const key in node) {
          if (key === 'parent' || key === 'range' || key === 'loc') continue;
          const child = (node as Record<string, unknown>)[key];
          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && typeof item === 'object' && hasURLConstructor(item)) {
                return true;
              }
            }
          } else if (
            child &&
            typeof child === 'object' &&
            hasURLConstructor(child)
          ) {
            return true;
          }
        }
      }
      return false;
    }

    function hasURLSearchParams(node: unknown): boolean {
      if (
        node &&
        typeof node === 'object' &&
        'type' in node &&
        node.type === 'NewExpression' &&
        'callee' in node &&
        node.callee &&
        typeof node.callee === 'object' &&
        'type' in node.callee &&
        node.callee.type === 'Identifier' &&
        'name' in node.callee &&
        node.callee.name === 'URLSearchParams'
      ) {
        return true;
      }

      // Check for .toString() method calls on URLSearchParams-like objects
      if (
        node &&
        typeof node === 'object' &&
        'type' in node &&
        node.type === 'CallExpression' &&
        'callee' in node &&
        node.callee &&
        typeof node.callee === 'object' &&
        'type' in node.callee &&
        node.callee.type === 'MemberExpression' &&
        'property' in node.callee &&
        node.callee.property &&
        typeof node.callee.property === 'object' &&
        'type' in node.callee.property &&
        node.callee.property.type === 'Identifier' &&
        'name' in node.callee.property &&
        node.callee.property.name === 'toString'
      ) {
        return true;
      }

      // Recursively check child nodes
      if (node && typeof node === 'object') {
        for (const key in node) {
          if (key === 'parent' || key === 'range' || key === 'loc') continue;
          const child = (node as Record<string, unknown>)[key];
          if (Array.isArray(child)) {
            for (const item of child) {
              if (
                item &&
                typeof item === 'object' &&
                hasURLSearchParams(item)
              ) {
                return true;
              }
            }
          } else if (
            child &&
            typeof child === 'object' &&
            hasURLSearchParams(child)
          ) {
            return true;
          }
        }
      }
      return false;
    }

    function containsQueryParams(urlArg: unknown): boolean {
      if (!urlArg || typeof urlArg !== 'object' || !('type' in urlArg)) {
        return false;
      }

      // Check for string concatenation with variables (dynamic content)
      if (
        urlArg.type === 'BinaryExpression' &&
        'operator' in urlArg &&
        urlArg.operator === '+'
      ) {
        // Don't flag if it's concatenating with URLSearchParams
        if (hasURLSearchParams(urlArg)) {
          return false;
        }
        return true;
      }

      // Check for template literals with expressions (dynamic content)
      if (
        urlArg.type === 'TemplateLiteral' &&
        'expressions' in urlArg &&
        Array.isArray(urlArg.expressions) &&
        urlArg.expressions.length > 0
      ) {
        // Don't flag if it uses URLSearchParams
        if (hasURLSearchParams(urlArg)) {
          return false;
        }
        return true;
      }

      // Don't flag static literal strings - they're safe
      return false;
    }

    function checkUrlArgument(urlArg: unknown) {
      if (!containsQueryParams(urlArg)) {
        return;
      }

      const hasProperEncoding =
        hasEncodeURIComponent(urlArg) ||
        hasURLConstructor(urlArg) ||
        hasURLSearchParams(urlArg);

      if (!hasProperEncoding) {
        context.report({
          node: urlArg as Node,
          messageId: 'unsafeQueryParam',
        });
      } else if (
        allowManualEncoding &&
        hasEncodeURIComponent(urlArg) &&
        !hasURLSearchParams(urlArg)
      ) {
        context.report({
          node: urlArg as Node,
          messageId: 'preferURLSearchParams',
        });
      }
    }

    return {
      CallExpression(node: CallExpression) {
        if (!isFetchCall(node) || node.arguments.length === 0) {
          return;
        }

        const urlArg = node.arguments[0];
        checkUrlArgument(urlArg);
      },
    };
  },
};

export default rule;
