import { Rule } from 'eslint';
import { CallExpression, Node } from 'estree';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Require error handling for fetch requests to prevent unhandled promise rejections',
      recommended: true,
    },
    type: 'problem',
    messages: {
      missingErrorHandling:
        'fetch() calls should include error handling with try/catch or .catch() to prevent unhandled promise rejections',
    },
    schema: [],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const fetchCallsWithoutErrorHandling = new Set<CallExpression>();
    const handledFetches = new Set<CallExpression>();

    function isFetchCall(node: CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'fetch';
    }

    function isInsideTryCatch(node: CallExpression): boolean {
      let parent = (node as unknown as { parent?: Node }).parent;
      while (parent) {
        if (parent.type === 'TryStatement') {
          return true;
        }
        parent = (parent as unknown as { parent?: Node }).parent;
      }
      return false;
    }

    function hasPromiseChainWithCatch(): boolean {
      // Simple check - we'll rely on the program-wide catch detection
      return false;
    }

    function isFireAndForget(node: CallExpression): boolean {
      // Check if this fetch is not assigned to anything and not awaited
      const parent = (node as unknown as { parent?: unknown }).parent;

      if (!parent) return true;

      // If it's not assigned, awaited, or part of a promise chain, it's fire-and-forget
      return (
        parent &&
        typeof parent === 'object' &&
        'type' in parent &&
        parent.type === 'ExpressionStatement'
      );
    }

    function isCatchCall(node: CallExpression): boolean {
      return (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'catch'
      );
    }

    function findFetchInPromiseChain(
      node: CallExpression
    ): CallExpression | null {
      if (node.callee.type !== 'MemberExpression') {
        return null;
      }

      let current = node.callee.object;

      while (current) {
        if (current.type === 'CallExpression') {
          if (isFetchCall(current)) {
            return current;
          }
          if (
            current.callee.type === 'MemberExpression' &&
            current.callee.property.type === 'Identifier' &&
            (current.callee.property.name === 'then' ||
              current.callee.property.name === 'catch')
          ) {
            current = current.callee.object;
            continue;
          }
        }
        break;
      }

      return null;
    }

    return {
      CallExpression(node: CallExpression) {
        if (isFetchCall(node)) {
          // Skip fire-and-forget fetch calls
          if (isFireAndForget(node)) {
            return;
          }

          const hasErrorHandling =
            isInsideTryCatch(node) || hasPromiseChainWithCatch();

          if (!hasErrorHandling) {
            fetchCallsWithoutErrorHandling.add(node);
          }
        }

        // Track .catch() calls to mark associated fetch as handled
        if (isCatchCall(node)) {
          const fetchCall = findFetchInPromiseChain(node);
          if (fetchCall) {
            handledFetches.add(fetchCall);
          }
        }
      },

      'Program:exit'() {
        for (const fetchCall of fetchCallsWithoutErrorHandling) {
          if (!handledFetches.has(fetchCall)) {
            context.report({
              node: fetchCall,
              messageId: 'missingErrorHandling',
            });
          }
        }
      },
    };
  },
};

export default rule;
