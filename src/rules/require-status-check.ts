import { Rule } from 'eslint';
import { CallExpression, MemberExpression } from 'estree';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Require checking response.ok or response.status when using fetch',
      recommended: true,
      url: 'https://github.com/teapot-smashers/eslint-plugin-fetch/blob/master/docs/rules/require-status-check.md',
    },
    messages: {
      missingStatusCheck:
        'fetch() does not throw on HTTP error status. Check response.ok or response.status before using the response.',
    },
    type: 'problem',
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const fetchCalls = new Set<CallExpression>();
    const checkedResponses = new Set<string>();

    function isFetchCall(node: CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'fetch';
    }

    function getVariableName(node: unknown): string | null {
      if (
        node &&
        typeof node === 'object' &&
        'type' in node &&
        node.type === 'VariableDeclarator' &&
        'id' in node &&
        node.id &&
        typeof node.id === 'object' &&
        'type' in node.id &&
        node.id.type === 'Identifier' &&
        'name' in node.id &&
        typeof node.id.name === 'string'
      ) {
        return node.id.name;
      }
      if (
        node &&
        typeof node === 'object' &&
        'type' in node &&
        node.type === 'AssignmentExpression' &&
        'left' in node &&
        node.left &&
        typeof node.left === 'object' &&
        'type' in node.left &&
        node.left.type === 'Identifier' &&
        'name' in node.left &&
        typeof node.left.name === 'string'
      ) {
        return node.left.name;
      }
      return null;
    }

    function findFetchAssignment(node: unknown): string | null {
      let current = node;

      // Walk up to find assignment
      while (current && typeof current === 'object' && 'type' in current) {
        if (current.type === 'VariableDeclarator') {
          return getVariableName(current);
        }
        if (current.type === 'AssignmentExpression') {
          return getVariableName(current);
        }
        // Note: parent property doesn't exist in estree types,
        // but ESLint adds it during traversal
        if ('parent' in current) {
          current = current.parent;
        } else {
          break;
        }
      }
      return null;
    }

    return {
      CallExpression(node: CallExpression) {
        if (isFetchCall(node)) {
          fetchCalls.add(node);
        }
      },

      MemberExpression(node: MemberExpression) {
        if (
          node.object.type === 'Identifier' &&
          node.property.type === 'Identifier' &&
          (node.property.name === 'ok' || node.property.name === 'status')
        ) {
          checkedResponses.add(node.object.name);
        }

        // Handle awaited fetch: (await fetch(...)).ok
        if (
          node.object.type === 'AwaitExpression' &&
          node.object.argument.type === 'CallExpression' &&
          isFetchCall(node.object.argument) &&
          node.property.type === 'Identifier' &&
          (node.property.name === 'ok' || node.property.name === 'status')
        ) {
          // This is a direct check, mark as checked
          fetchCalls.delete(node.object.argument);
        }
      },

      'Program:exit'() {
        for (const fetchCall of fetchCalls) {
          // Try to find the variable name this fetch is assigned to
          const parent = (fetchCall as unknown as { parent?: unknown }).parent;
          const variableName = findFetchAssignment(parent);

          // Only flag if there's a clear variable assignment that's not checked
          if (variableName && !checkedResponses.has(variableName)) {
            context.report({
              node: fetchCall,
              messageId: 'missingStatusCheck',
            });
          }
        }
      },
    };
  },
};

export default rule;
