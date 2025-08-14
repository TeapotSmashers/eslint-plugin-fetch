import { RuleTester } from 'eslint';
import rule from '../../src/rules/require-error-handling';

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

tester.run('require-error-handling', rule, {
  valid: [
    // try/catch with async/await
    `async function getData() {
       try {
         const response = await fetch('/api/data');
         return await response.json();
       } catch (error) {
         console.error('Fetch failed:', error);
       }
     }`,

    // .catch() with promises
    `fetch('/api/data')
       .then(response => response.json())
       .catch(error => console.error(error))`,

    // Fire and forget (no error handling needed)
    "fetch('/api/log', { method: 'POST', body: logData })",

    // Non-fetch function calls
    "request('/api/data')",
  ],

  invalid: [
    // Basic fetch without error handling
    {
      code: `async function getData() {
               const response = await fetch('/api/data');
               return response.json();
             }`,
      errors: [{ messageId: 'missingErrorHandling' }],
    },

    // fetch in async function without try/catch
    {
      code: `async function processData() {
               const response = await fetch('/api/data');
               const data = await response.json();
               return data.results;
             }`,
      errors: [{ messageId: 'missingErrorHandling' }],
    },

    // Promise chain without .catch()
    {
      code: `fetch('/api/data')
               .then(response => response.json())
               .then(data => console.log(data))`,
      errors: [{ messageId: 'missingErrorHandling' }],
    },

    // Complex promise chain without error handling
    {
      code: `fetch('/api/users')
               .then(response => response.json())
               .then(users => users.filter(u => u.active))
               .then(activeUsers => processUsers(activeUsers))`,
      errors: [{ messageId: 'missingErrorHandling' }],
    },

    // fetch in arrow function without error handling
    {
      code: `const getData = async () => {
               const response = await fetch('/api/data');
               return response.json();
             }`,
      errors: [{ messageId: 'missingErrorHandling' }],
    },

    // try/catch that doesn't include fetch
    {
      code: `async function getData() {
               const response = await fetch('/api/data');
               try {
                 return JSON.parse(someString);
               } catch (error) {
                 console.error(error);
               }
             }`,
      errors: [{ messageId: 'missingErrorHandling' }],
    },

    // Multiple fetch calls, some without error handling
    {
      code: `async function getData() {
               try {
                 const response1 = await fetch('/api/data1');
                 const data1 = await response1.json();
               } catch (error) {
                 console.error(error);
               }
               
               const response2 = await fetch('/api/data2'); // No error handling
               return response2.json();
             }`,
      errors: [{ messageId: 'missingErrorHandling' }],
    },

    // Promise assignment without error handling
    {
      code: `const dataPromise = fetch('/api/data')
                             .then(response => response.json())`,
      errors: [{ messageId: 'missingErrorHandling' }],
    },
  ],
});
