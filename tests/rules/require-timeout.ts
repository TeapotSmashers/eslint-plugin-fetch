import { RuleTester } from 'eslint';
import rule from '../../src/rules/require-timeout';

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

tester.run('require-timeout', rule, {
  valid: [
    // AbortSignal.timeout (modern browsers)
    "fetch('/api/data', { signal: AbortSignal.timeout(5000) })",

    // AbortController with signal (assumes timeout)
    "fetch('/api/data', { signal: controller.signal })",

    // Non-fetch function calls
    "request('/api/data')",
    "axios.get('/api/data')",
  ],

  invalid: [
    // Basic fetch without timeout
    {
      code: "fetch('/api/data')",
      errors: [{ messageId: 'missingTimeout' }],
    },

    // fetch with options but no timeout
    {
      code: `fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })`,
      errors: [{ messageId: 'missingTimeout' }],
    },

    // fetch with signal but no timeout
    {
      code: `const controller = new AbortController();
             fetch('/api/data', { signal: controller.signal })`,
      errors: [{ messageId: 'missingTimeout' }],
    },

    // async/await without timeout
    {
      code: `async function getData() {
               const response = await fetch('/api/data');
               return response.json();
             }`,
      errors: [{ messageId: 'missingTimeout' }],
    },

    // Promise chain without timeout
    {
      code: `fetch('/api/data')
               .then(response => response.json())
               .then(data => console.log(data))`,
      errors: [{ messageId: 'missingTimeout' }],
    },

    // Multiple fetch calls, some without timeout
    {
      code: `async function test() {
               const controller = new AbortController();
               setTimeout(() => controller.abort(), 5000);
               
               const response1 = await fetch('/api/data1', { signal: controller.signal }); // OK
               const response2 = await fetch('/api/data2'); // Missing timeout
             }`,
      errors: [{ messageId: 'missingTimeout' }],
    },

    // AbortController without setTimeout call
    {
      code: `const controller = new AbortController();
             fetch('/api/data', { signal: controller.signal })`,
      errors: [{ messageId: 'missingTimeout' }],
    },
  ],
});
