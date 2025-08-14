import { RuleTester } from 'eslint';
import rule from '../../src/rules/require-encoded-query-params';

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

tester.run('require-encoded-query-params', rule, {
  valid: [
    // No query parameters
    "fetch('/api/data')",
    "fetch('/api/users')",

    // Static URLs with query params (no variables) - should not be flagged
    "fetch('/api/data?param=value')",
    "fetch('/api/data?search=test&limit=10')",

    // Using URLSearchParams - the preferred method
    `const params = new URLSearchParams();
     params.set('q', query);
     fetch('/api/search?' + params.toString())`,

    "fetch('/api/search?' + new URLSearchParams({ q: query }).toString())",

    // Template literal with URLSearchParams
    'fetch(`/api/search?${new URLSearchParams({ q: query })}`)',

    // Using URL constructor
    "fetch(new URL('/api/search', base).href)",
    `const url = new URL('/api/search', 'https://api.example.com');
     url.searchParams.set('q', query);
     fetch(url.href)`,

    // Non-fetch function calls
    "request('/api/search?q=' + query)",
  ],

  invalid: [
    // String concatenation without encoding
    {
      code: "fetch('/api/search?q=' + query)",
      errors: [{ messageId: 'unsafeQueryParam' }],
    },

    // Template literal without encoding
    {
      code: 'fetch(`/api/search?q=${query}`)',
      errors: [{ messageId: 'unsafeQueryParam' }],
    },

    // Multiple parameters without encoding
    {
      code: "fetch('/api/search?q=' + query + '&sort=' + sortBy)",
      errors: [{ messageId: 'unsafeQueryParam' }],
    },

    // Complex template literal without encoding
    {
      code: 'fetch(`/api/search?q=${query}&limit=${limit}&offset=${offset}`)',
      errors: [{ messageId: 'unsafeQueryParam' }],
    },

    // Mixed encoding (some encoded, some not) - should flag as unsafe
    {
      code: "fetch('/api/search?q=' + encodeURIComponent(query) + '&sort=' + sortBy)",
      errors: [{ messageId: 'preferURLSearchParams' }],
    },

    // Manual encoding with suggestion for URLSearchParams (default behavior)
    {
      code: "fetch('/api/search?q=' + encodeURIComponent(query))",
      errors: [{ messageId: 'preferURLSearchParams' }],
    },

    // Complex manual encoding should suggest URLSearchParams
    {
      code: 'fetch(`/api/search?q=${encodeURIComponent(query)}&sort=${encodeURIComponent(sortBy)}`)',
      errors: [{ messageId: 'preferURLSearchParams' }],
    },
  ],
});
