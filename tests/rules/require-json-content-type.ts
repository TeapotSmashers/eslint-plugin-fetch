import { RuleTester } from 'eslint';
import rule from '../../src/rules/require-json-content-type';

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

tester.run('require-json-content-type', rule, {
  valid: [
    // No body property
    "fetch('/api/data')",
    "fetch('/api/data', {})",
    "fetch('/api/data', { method: 'GET' })",

    // Body without JSON.stringify
    "fetch('/api/data', { body: 'plain text' })",
    "fetch('/api/data', { body: formData })",

    // JSON.stringify with correct Content-Type
    `fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })`,

    // JSON.stringify with correct Content-Type (different casing)
    `fetch('/api/data', {
      method: 'POST', 
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    })`,

    // JSON.stringify with correct Content-Type (mixed casing)
    `fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(data)
    })`,

    // Non-fetch function calls
    "request('/api/data', { body: JSON.stringify(data) })",
  ],

  invalid: [
    // JSON.stringify without headers
    {
      code: `fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify(data)
      })`,
      errors: [{ messageId: 'missingContentType' }],
      output: `fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify(data), "headers": { "Content-Type": "application/json" }
      })`,
    },

    // JSON.stringify with empty headers
    {
      code: `fetch('/api/data', {
        method: 'POST',
        headers: {},
        body: JSON.stringify(data)
      })`,
      errors: [{ messageId: 'missingContentType' }],
      output: `fetch('/api/data', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })`,
    },

    // JSON.stringify with headers but no Content-Type
    {
      code: `fetch('/api/data', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer token'
        },
        body: JSON.stringify(data)
      })`,
      errors: [{ messageId: 'missingContentType' }],
      output: `fetch('/api/data', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer token', "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })`,
    },

    // JSON.stringify with wrong Content-Type
    {
      code: `fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(data)
      })`,
      errors: [{ messageId: 'incorrectContentType' }],
    },

    // Empty options object with JSON.stringify
    {
      code: `fetch('/api/data', { body: JSON.stringify(data) })`,
      errors: [{ messageId: 'missingContentType' }],
      output: `fetch('/api/data', { body: JSON.stringify(data), "headers": { "Content-Type": "application/json" } })`,
    },
  ],
});
