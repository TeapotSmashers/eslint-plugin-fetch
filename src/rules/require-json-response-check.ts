import { Rule } from 'eslint';
import { CallExpression, MemberExpression } from 'estree';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Require Content-Type check before calling response.json() to prevent parsing errors',
      recommended: true,
    },
    type: 'problem',
    messages: {
      missingContentTypeCheck:
        'Check Content-Type header before calling response.json() to avoid parsing non-JSON responses',
    },
    schema: [],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const responseVariables = new Map<string, unknown>();
    const checkedResponses = new Set<string>();
    const jsonCalls = new Set<CallExpression>();

    function getResponseVariableName(node: unknown): string | null {
      // Try to extract variable name from various patterns
      let current = node;
      while (current && typeof current === 'object' && 'parent' in current) {
        const parent = (current as unknown as { parent?: unknown }).parent;
        if (
          parent &&
          typeof parent === 'object' &&
          'type' in parent &&
          parent.type === 'VariableDeclarator' &&
          'id' in parent &&
          parent.id &&
          typeof parent.id === 'object' &&
          'name' in parent.id
        ) {
          return parent.id.name as string;
        }
        if (
          parent &&
          typeof parent === 'object' &&
          'type' in parent &&
          parent.type === 'AssignmentExpression' &&
          'left' in parent &&
          parent.left &&
          typeof parent.left === 'object' &&
          'name' in parent.left
        ) {
          return parent.left.name as string;
        }
        current = parent;
      }
      return null;
    }

    function isFetchCall(node: CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'fetch';
    }

    function isJsonCall(node: CallExpression): boolean {
      return (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'json'
      );
    }

    function isContentTypeCheck(node: unknown): boolean {
      // Check for response.headers.get('content-type') or similar patterns
      if (
        node &&
        typeof node === 'object' &&
        'type' in node &&
        node.type === 'CallExpression' &&
        'callee' in node &&
        node.callee &&
        typeof node.callee === 'object' &&
        'type' in node.callee &&
        node.callee.type === 'MemberExpression'
      ) {
        const callee = node.callee as MemberExpression;

        // Check for headers.get pattern
        if (
          callee.property.type === 'Identifier' &&
          callee.property.name === 'get' &&
          callee.object.type === 'MemberExpression' &&
          callee.object.property.type === 'Identifier' &&
          callee.object.property.name === 'headers'
        ) {
          // Check if the argument is content-type related
          const args = (node as CallExpression).arguments;
          if (args.length > 0) {
            const firstArg = args[0];
            if (
              firstArg &&
              typeof firstArg === 'object' &&
              'type' in firstArg &&
              firstArg.type === 'Literal' &&
              'value' in firstArg &&
              typeof firstArg.value === 'string'
            ) {
              const headerName = firstArg.value.toLowerCase();
              return (
                headerName === 'content-type' || headerName === 'Content-Type'
              );
            }
          }
        }
      }
      return false;
    }

    function isInsideTryCatch(node: CallExpression): boolean {
      let parent = (node as unknown as { parent?: unknown }).parent;
      while (parent) {
        if (
          parent &&
          typeof parent === 'object' &&
          'type' in parent &&
          parent.type === 'TryStatement'
        ) {
          return true;
        }
        parent = (parent as unknown as { parent?: unknown }).parent;
      }
      return false;
    }

    function hasJsonExtension(fetchNode: CallExpression): boolean {
      if (fetchNode.arguments.length > 0) {
        const urlArg = fetchNode.arguments[0];
        if (
          urlArg &&
          typeof urlArg === 'object' &&
          'type' in urlArg &&
          urlArg.type === 'Literal' &&
          'value' in urlArg &&
          typeof urlArg.value === 'string'
        ) {
          return urlArg.value.endsWith('.json');
        }
      }
      return false;
    }

    return {
      CallExpression(node: CallExpression) {
        if (isFetchCall(node)) {
          const variableName = getResponseVariableName(node);
          if (variableName) {
            responseVariables.set(variableName, node);
          }
        }

        if (isJsonCall(node)) {
          // Check if this is inside try/catch or has JSON extension
          if (isInsideTryCatch(node)) {
            return;
          }

          const responseObj = (node.callee as MemberExpression).object;
          let variableName: string | null = null;

          if (responseObj.type === 'Identifier') {
            variableName = responseObj.name;
          } else if (
            responseObj.type === 'AwaitExpression' &&
            responseObj.argument.type === 'CallExpression'
          ) {
            // Direct await fetch() pattern
            const fetchCall = responseObj.argument;
            if (isFetchCall(fetchCall) && hasJsonExtension(fetchCall)) {
              return; // Allow .json extension URLs
            }
          }

          if (variableName) {
            const fetchCall = responseVariables.get(variableName);
            if (
              fetchCall &&
              isFetchCall(fetchCall as CallExpression) &&
              hasJsonExtension(fetchCall as CallExpression)
            ) {
              return; // Allow .json extension URLs
            }

            if (!checkedResponses.has(variableName)) {
              jsonCalls.add(node);
            }
          } else {
            // Direct call like (await fetch()).json() without content-type check
            jsonCalls.add(node);
          }
        }

        // Track Content-Type checks
        if (isContentTypeCheck(node)) {
          const checkNode = node.callee as MemberExpression;
          if (
            checkNode.object.type === 'MemberExpression' &&
            checkNode.object.object.type === 'Identifier'
          ) {
            const responseName = checkNode.object.object.name;
            checkedResponses.add(responseName);
          }
        }
      },

      'Program:exit'() {
        for (const jsonCall of jsonCalls) {
          context.report({
            node: jsonCall,
            messageId: 'missingContentTypeCheck',
          });
        }
      },
    };
  },
};

export default rule;
