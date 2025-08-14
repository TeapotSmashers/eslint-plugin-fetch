import { Rule } from 'eslint';
import { CallExpression, Property, ObjectExpression } from 'estree';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Require Content-Type header when sending JSON data with fetch',
      recommended: true,
      url: 'https://github.com/teapot-smashers/eslint-plugin-fetch/blob/master/docs/rules/require-json-content-type.md',
    },
    messages: {
      missingContentType:
        'Missing Content-Type header when sending JSON data. Add "Content-Type": "application/json" to headers.',
      incorrectContentType:
        'Incorrect Content-Type header when sending JSON data. Use "application/json".',
    },
    type: 'problem',
    fixable: 'code',
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    function isFetchCall(node: CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'fetch';
    }

    function hasJSONStringifyInBody(optionsArg: ObjectExpression): boolean {
      const bodyProperty = optionsArg.properties.find(
        (prop): prop is Property =>
          prop.type === 'Property' &&
          prop.key.type === 'Identifier' &&
          prop.key.name === 'body'
      );

      if (!bodyProperty) return false;

      // Check if body value is JSON.stringify()
      return (
        bodyProperty.value.type === 'CallExpression' &&
        bodyProperty.value.callee.type === 'MemberExpression' &&
        bodyProperty.value.callee.object.type === 'Identifier' &&
        bodyProperty.value.callee.object.name === 'JSON' &&
        bodyProperty.value.callee.property.type === 'Identifier' &&
        bodyProperty.value.callee.property.name === 'stringify'
      );
    }

    function getContentTypeValue(headersObj: ObjectExpression): string | null {
      for (const prop of headersObj.properties) {
        if (prop.type === 'Property' && prop.key.type === 'Identifier') {
          const keyName = prop.key.name.toLowerCase();
          if (keyName === 'content-type' || keyName === 'contenttype') {
            if (
              prop.value.type === 'Literal' &&
              typeof prop.value.value === 'string'
            ) {
              return prop.value.value;
            }
          }
        } else if (prop.type === 'Property' && prop.key.type === 'Literal') {
          const keyValue = prop.key.value;
          if (
            typeof keyValue === 'string' &&
            keyValue.toLowerCase() === 'content-type'
          ) {
            if (
              prop.value.type === 'Literal' &&
              typeof prop.value.value === 'string'
            ) {
              return prop.value.value;
            }
          }
        }
      }
      return null;
    }

    function getHeadersProperty(optionsArg: ObjectExpression): Property | null {
      return (
        optionsArg.properties.find(
          (prop): prop is Property =>
            prop.type === 'Property' &&
            prop.key.type === 'Identifier' &&
            prop.key.name === 'headers'
        ) || null
      );
    }

    return {
      CallExpression(node: CallExpression) {
        if (!isFetchCall(node) || node.arguments.length < 2) {
          return;
        }

        const optionsArg = node.arguments[1];
        if (optionsArg.type !== 'ObjectExpression') {
          return;
        }

        if (!hasJSONStringifyInBody(optionsArg)) {
          return;
        }

        const headersProperty = getHeadersProperty(optionsArg);

        if (!headersProperty) {
          context.report({
            node: optionsArg,
            messageId: 'missingContentType',
            fix(fixer) {
              const headersText =
                '"headers": { "Content-Type": "application/json" }';
              if (optionsArg.properties.length === 0) {
                return fixer.replaceText(optionsArg, `{ ${headersText} }`);
              } else {
                const lastProp =
                  optionsArg.properties[optionsArg.properties.length - 1];
                return fixer.insertTextAfter(lastProp, `, ${headersText}`);
              }
            },
          });
          return;
        }

        if (headersProperty.value.type !== 'ObjectExpression') {
          return;
        }

        const contentTypeValue = getContentTypeValue(headersProperty.value);

        if (!contentTypeValue) {
          context.report({
            node: headersProperty.value,
            messageId: 'missingContentType',
            fix(fixer) {
              const contentTypeText = '"Content-Type": "application/json"';
              if (
                headersProperty.value.type === 'ObjectExpression' &&
                headersProperty.value.properties.length === 0
              ) {
                return fixer.replaceText(
                  headersProperty.value,
                  `{ ${contentTypeText} }`
                );
              } else if (headersProperty.value.type === 'ObjectExpression') {
                const lastProp =
                  headersProperty.value.properties[
                    headersProperty.value.properties.length - 1
                  ];
                return fixer.insertTextAfter(lastProp, `, ${contentTypeText}`);
              }
              return null;
            },
          });
        } else if (!contentTypeValue.includes('application/json')) {
          context.report({
            node: headersProperty.value,
            messageId: 'incorrectContentType',
          });
        }
      },
    };
  },
};

export default rule;
