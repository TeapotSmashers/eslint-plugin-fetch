import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-json-in-get-requests';

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

tester.run('no-json-in-get-requests', rule, {
  valid: [
    // GET request without body
    "fetch('/api/data')",
    "fetch('/api/data', { method: 'GET' })",
    "fetch('/api/data', { method: 'get' })",

    // GET request with non-JSON body (unusual but not flagged)
    "fetch('/api/data', { method: 'GET', body: 'text data' })",

    // POST request with JSON body (correct)
    `fetch('/api/data', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
     })`,

    // PUT request with JSON body
    `fetch('/api/data', {
       method: 'PUT',
       body: JSON.stringify({ name: 'updated' })
     })`,

    // PATCH request with JSON body
    `fetch('/api/data', {
       method: 'PATCH',
       body: JSON.stringify({ status: 'active' })
     })`,

    // DELETE request with JSON body (sometimes valid)
    `fetch('/api/data', {
       method: 'DELETE',
       body: JSON.stringify({ reason: 'cleanup' })
     })`,

    // Default method (GET) without body
    "fetch('/api/data', { headers: { 'Accept': 'application/json' } })",

    // Non-JSON.stringify body with GET
    "fetch('/api/data', { method: 'GET', body: formData })",

    // Non-fetch function calls
    "request('/api/data', { method: 'GET', body: JSON.stringify(data) })",
  ],

  invalid: [
    // GET request with JSON.stringify body
    {
      code: `fetch('/api/data', {
               method: 'GET',
               body: JSON.stringify(data)
             })`,
      errors: [{ messageId: 'jsonInGetRequest' }],
    },

    // Lowercase get method with JSON body
    {
      code: `fetch('/api/data', {
               method: 'get',
               body: JSON.stringify({ query: 'search' })
             })`,
      errors: [{ messageId: 'jsonInGetRequest' }],
    },

    // Default method (GET) with JSON body
    {
      code: `fetch('/api/data', {
               body: JSON.stringify(params)
             })`,
      errors: [{ messageId: 'jsonInGetRequest' }],
    },

    // GET with JSON and headers
    {
      code: `fetch('/api/search', {
               method: 'GET',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': 'Bearer token'
               },
               body: JSON.stringify({ q: 'search term' })
             })`,
      errors: [{ messageId: 'jsonInGetRequest' }],
    },

    // Mixed case method name with JSON
    {
      code: `fetch('/api/data', {
               method: 'Get',
               body: JSON.stringify(data)
             })`,
      errors: [{ messageId: 'jsonInGetRequest' }],
    },

    // HEAD request with JSON (also inappropriate)
    {
      code: `fetch('/api/data', {
               method: 'HEAD',
               body: JSON.stringify(metadata)
             })`,
      errors: [{ messageId: 'jsonInGetRequest' }],
    },

    // OPTIONS request with JSON (questionable)
    {
      code: `fetch('/api/data', {
               method: 'OPTIONS',
               body: JSON.stringify(config)
             })`,
      errors: [{ messageId: 'jsonInGetRequest' }],
    },
  ],
});
