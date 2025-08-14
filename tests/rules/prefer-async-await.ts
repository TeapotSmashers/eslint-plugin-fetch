import { RuleTester } from 'eslint';
import rule from '../../src/rules/prefer-async-await';

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

tester.run('prefer-async-await', rule, {
  valid: [
    // async/await pattern
    `async function getData() {
       const response = await fetch('/api/data');
       const data = await response.json();
       return data;
     }`,

    // async/await with error handling
    `async function getData() {
       try {
         const response = await fetch('/api/data');
         if (response.ok) {
           return await response.json();
         }
       } catch (error) {
         console.error(error);
       }
     }`,

    // Arrow function with async/await
    `const getData = async () => {
       const response = await fetch('/api/data');
       return response.json();
     }`,

    // Fire and forget fetch (no .then)
    "fetch('/api/log', { method: 'POST', body: logData })",

    // Single .then for simple transformation (allowable)
    "const promise = fetch('/api/data')", // Just assignment, no .then

    // Non-fetch promise chains (should not be flagged)
    'Promise.resolve(data).then(process).then(save)',

    // fetch used in non-chain context
    "const fetchPromise = fetch('/api/data')",
  ],

  invalid: [
    // Basic .then chain
    {
      code: `fetch('/api/data')
               .then(response => response.json())
               .then(data => console.log(data))`,
      errors: [{ messageId: 'preferAsyncAwait' }],
    },

    // .then chain with error handling
    {
      code: `fetch('/api/data')
               .then(response => {
                 if (!response.ok) throw new Error('Failed');
                 return response.json();
               })
               .then(data => processData(data))
               .catch(error => console.error(error))`,
      errors: [{ messageId: 'preferAsyncAwait' }],
    },

    // Complex .then chain
    {
      code: `fetch('/api/users')
               .then(response => response.json())
               .then(users => users.filter(u => u.active))
               .then(activeUsers => {
                 return fetch('/api/process', {
                   method: 'POST',
                   body: JSON.stringify(activeUsers)
                 });
               })
               .then(response => response.json())`,
      errors: [{ messageId: 'preferAsyncAwait' }],
    },

    // Single .then on fetch (still prefer async/await)
    {
      code: `fetch('/api/data').then(response => response.json())`,
      errors: [{ messageId: 'preferAsyncAwait' }],
    },

    // .then with .catch
    {
      code: `fetch('/api/data')
               .then(response => response.json())
               .catch(error => console.error(error))`,
      errors: [{ messageId: 'preferAsyncAwait' }],
    },

    // .then in function return
    {
      code: `function getData() {
               return fetch('/api/data')
                 .then(response => response.json());
             }`,
      errors: [{ messageId: 'preferAsyncAwait' }],
    },

    // .then in variable assignment
    {
      code: `const dataPromise = fetch('/api/data')
                               .then(response => response.json())
                               .then(data => data.results)`,
      errors: [{ messageId: 'preferAsyncAwait' }],
    },
  ],
});
