import { RuleTester } from 'eslint';
import rule from '../../src/rules/require-status-check';

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

tester.run('require-status-check', rule, {
  valid: [
    // Direct status check
    `async function test() {
       const response = await fetch('/api/data');
       if (response.ok) {
         const data = await response.json();
       }
     }`,

    // Status code check
    `async function test() {
       const response = await fetch('/api/data');
       if (response.status === 200) {
         const data = await response.json();
       }
     }`,

    // Direct await with ok check
    "async function test() { if ((await fetch('/api/data')).ok) { /* handle success */ } }",

    // Direct await with status check
    "async function test() { if ((await fetch('/api/data')).status === 200) { /* handle success */ } }",

    // Response assigned and checked later
    `async function test() {
       let response;
       response = await fetch('/api/data');
       if (response.ok) {
         const data = await response.json();
       }
     }`,

    // Non-fetch function calls
    "async function test() { const response = await request('/api/data'); }",

    // Fetch without assignment (fire and forget) - should not be flagged
    "fetch('/api/log', { method: 'POST', body: logData });",
  ],

  invalid: [
    // Fetch assigned but never checked
    {
      code: `async function test() {
               const response = await fetch('/api/data');
               const data = await response.json();
             }`,
      errors: [{ messageId: 'missingStatusCheck' }],
    },

    // Fetch with response used but no status check
    {
      code: `async function test() {
               const response = await fetch('/api/data');
               const text = await response.text();
             }`,
      errors: [{ messageId: 'missingStatusCheck' }],
    },

    // Multiple responses, some unchecked
    {
      code: `async function test() {
               const response1 = await fetch('/api/data1');
               if (response1.ok) {
                 // handle response1
               }
               const response2 = await fetch('/api/data2');
               const data = await response2.json(); // no check
             }`,
      errors: [{ messageId: 'missingStatusCheck' }],
    },

    // Promise-based fetch without status check
    {
      code: `const promise = fetch('/api/data').then(response => {
               return response.json();
             });`,
      errors: [{ messageId: 'missingStatusCheck' }],
    },

    // Fetch in variable declaration without check
    {
      code: `const response = fetch('/api/data');
             response.then(r => r.json());`,
      errors: [{ messageId: 'missingStatusCheck' }],
    },

    // Response properties accessed but not ok/status
    {
      code: `async function test() {
               const response = await fetch('/api/data');
               const headers = response.headers;
               const data = await response.json();
             }`,
      errors: [{ messageId: 'missingStatusCheck' }],
    },
  ],
});
