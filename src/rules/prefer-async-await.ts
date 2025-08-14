import { Rule } from 'eslint';
import { CallExpression } from 'estree';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Prefer async/await over promise chains for fetch requests to improve readability',
      recommended: true,
    },
    type: 'suggestion',
    messages: {
      preferAsyncAwait:
        'Prefer async/await over promise chains for fetch requests to improve readability and error handling',
    },
    schema: [],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const reportedFetches = new Set<CallExpression>();

    function isFetchCall(node: CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'fetch';
    }

    function isThenOrCatchCall(node: CallExpression): boolean {
      return (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        (node.callee.property.name === 'then' ||
          node.callee.property.name === 'catch')
      );
    }

    function findFetchInChain(node: CallExpression): CallExpression | null {
      if (node.callee.type !== 'MemberExpression') {
        return null;
      }

      let current = node.callee.object;

      // Walk down the chain
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
        if (isThenOrCatchCall(node)) {
          const fetchCall = findFetchInChain(node);
          if (fetchCall && !reportedFetches.has(fetchCall)) {
            reportedFetches.add(fetchCall);
            context.report({
              node: fetchCall,
              messageId: 'preferAsyncAwait',
            });
          }
        }
      },
    };
  },
};

export default rule;
