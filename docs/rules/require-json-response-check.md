# @teapot-smashers/fetch/require-json-response-check

> Require Content-Type check before calling response.json() to prevent parsing errors

The `response.json()` method will throw an error if the response body is not valid JSON. Checking the Content-Type header before parsing helps avoid unexpected runtime errors.

❌ Examples of **incorrect** code for this rule:

```js
// Direct json() call without Content-Type check
async function getData() {
  const response = await fetch('/api/data');
  const data = await response.json(); // May fail if not JSON
  return data;
}

// json() call with only status check
async function getData() {
  const response = await fetch('/api/data');
  if (response.ok) {
    const data = await response.json(); // Still risky
  }
}

// Promise chain with direct json()
fetch('/api/data')
  .then((response) => response.json()) // No content type check
  .then((data) => console.log(data));

// Multiple responses, some without checks
async function getData() {
  const response1 = await fetch('/api/data1');
  if (response1.headers.get('content-type')?.includes('json')) {
    const data1 = await response1.json(); // OK
  }

  const response2 = await fetch('/api/data2');
  const data2 = await response2.json(); // Missing check
}
```

✅ Examples of **correct** code for this rule:

```js
// Check Content-Type before parsing JSON
async function getData() {
  const response = await fetch('/api/data');
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return data;
  } else {
    throw new Error('Response is not JSON');
  }
}

// Using try/catch for JSON parsing
async function getData() {
  const response = await fetch('/api/data');
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    throw error;
  }
}

// Check multiple content types
async function getData() {
  const response = await fetch('/api/data');
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return await response.json();
  } else if (contentType?.includes('text/')) {
    return await response.text();
  } else {
    return await response.blob();
  }
}

// URLs with .json extension (assumed to be JSON)
async function getData() {
  const response = await fetch('/api/users.json');
  const data = await response.json(); // OK - .json extension
  return data;
}
```

## Why?

Without Content-Type checking:

- **Runtime errors**: `response.json()` throws on non-JSON responses
- **Poor error handling**: Generic JSON parsing errors are hard to debug
- **Incorrect assumptions**: APIs may return different content types based on conditions
- **Brittle code**: Changes in API response format can break the application

## Common Response Types

- `application/json` - Standard JSON responses
- `text/html` - Error pages or HTML responses
- `text/plain` - Plain text responses
- `application/xml` - XML responses
- `multipart/form-data` - File uploads

## Recommended Patterns

1. **Check Content-Type header**:

   ```js
   const contentType = response.headers.get('content-type');
   if (contentType?.includes('application/json')) {
     return await response.json();
   }
   ```

2. **Use try/catch for robustness**:

   ```js
   try {
     return await response.json();
   } catch (error) {
     throw new Error('Invalid JSON response');
   }
   ```

3. **Handle multiple content types**:
   ```js
   const contentType = response.headers.get('content-type');
   if (contentType?.includes('json')) return await response.json();
   if (contentType?.includes('text')) return await response.text();
   return await response.blob();
   ```

## When Not To Use It

- If you're certain the API always returns JSON
- If you have a try/catch wrapper around all JSON parsing
- If the URL has a `.json` extension (rule allows this)

## Options

This rule has no options.
