import { RuleTester } from 'eslint';
import rule from '../../src/rules/require-json-response-check';

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

tester.run('require-json-response-check', rule, {
  valid: [
    // Check Content-Type before parsing JSON
    `async function test() {
       const response = await fetch('/api/data');
       if (response.headers.get('content-type')?.includes('application/json')) {
         const data = await response.json();
       }
     }`,

    // Check Content-Type with different pattern
    `async function test() {
       const response = await fetch('/api/data');
       const contentType = response.headers.get('Content-Type');
       if (contentType && contentType.includes('application/json')) {
         const data = await response.json();
       }
     }`,

    // Using try/catch around json()
    `async function test() {
       const response = await fetch('/api/data');
       try {
         const data = await response.json();
       } catch (error) {
         console.error('Invalid JSON');
       }
     }`,

    // Response used for non-JSON parsing
    `async function test() {
       const response = await fetch('/api/data');
       const text = await response.text();
     }`,

    // No response.json() call
    `async function test() {
       const response = await fetch('/api/data');
       if (response.ok) {
         // do something else
       }
     }`,

    // Direct response.json() in API known to return JSON
    `async function test() {
       const response = await fetch('/api/users.json');
       const data = await response.json(); // .json extension suggests JSON response
     }`,

    // Non-fetch calls
    'const data = JSON.parse(jsonString)',
  ],

  invalid: [
    // Direct json() call without Content-Type check
    {
      code: `async function test() {
               const response = await fetch('/api/data');
               const data = await response.json();
             }`,
      errors: [{ messageId: 'missingContentTypeCheck' }],
    },

    // json() call with only status check
    {
      code: `async function test() {
               const response = await fetch('/api/data');
               if (response.ok) {
                 const data = await response.json();
               }
             }`,
      errors: [{ messageId: 'missingContentTypeCheck' }],
    },

    // Promise chain with direct json()
    {
      code: `fetch('/api/data')
               .then(response => response.json())
               .then(data => console.log(data))`,
      errors: [{ messageId: 'missingContentTypeCheck' }],
    },

    // Multiple responses, some without checks
    {
      code: `async function test() {
               const response1 = await fetch('/api/data1');
               if (response1.headers.get('content-type')?.includes('json')) {
                 const data1 = await response1.json(); // OK
               }
               
               const response2 = await fetch('/api/data2');
               const data2 = await response2.json(); // Missing check
             }`,
      errors: [{ messageId: 'missingContentTypeCheck' }],
    },

    // json() call with other checks but not Content-Type
    {
      code: `async function test() {
               const response = await fetch('/api/data');
               if (response.status === 200) {
                 const data = await response.json();
               }
             }`,
      errors: [{ messageId: 'missingContentTypeCheck' }],
    },

    // Variable assignment then json() without check
    {
      code: `async function test() {
               const response = await fetch('/api/data');
               const result = response.json(); // Missing await but still flagged
             }`,
      errors: [{ messageId: 'missingContentTypeCheck' }],
    },
  ],
});
