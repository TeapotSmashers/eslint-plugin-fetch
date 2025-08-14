# @teapot-smashers/fetch/require-error-handling

> Require error handling for fetch requests to prevent unhandled promise rejections

Network requests can fail for various reasons (network errors, server issues, timeouts). Without proper error handling, these failures result in unhandled promise rejections that can crash applications or create poor user experiences.

❌ Examples of **incorrect** code for this rule:

```js
// Basic fetch without error handling
async function getData() {
  const response = await fetch('/api/data');
  return response.json();
}

// fetch in async function without try/catch
async function processData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data.results;
}

// Promise chain without .catch()
fetch('/api/data')
  .then((response) => response.json())
  .then((data) => console.log(data));

// Complex promise chain without error handling
fetch('/api/users')
  .then((response) => response.json())
  .then((users) => users.filter((u) => u.active))
  .then((activeUsers) => processUsers(activeUsers));

// Arrow function without error handling
const getData = async () => {
  const response = await fetch('/api/data');
  return response.json();
};

// Multiple fetch calls with partial error handling
async function getData() {
  try {
    const response1 = await fetch('/api/data1');
    const data1 = await response1.json();
  } catch (error) {
    console.error(error);
  }

  // This fetch has no error handling
  const response2 = await fetch('/api/data2');
  return response2.json();
}
```

✅ Examples of **correct** code for this rule:

```js
// try/catch with async/await
async function getData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// .catch() with promises
fetch('/api/data')
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Fetch failed:', error));

// .catch() in the middle of chain
fetch('/api/data')
  .then((response) => response.json())
  .catch((error) => ({ error: true, message: error.message }))
  .then((result) => processResult(result));

// Comprehensive error handling
async function robustFetch() {
  try {
    const response = await fetch('/api/data');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Fetch aborted');
    } else if (error.name === 'TypeError') {
      console.error('Network error:', error.message);
    } else {
      console.error('Fetch error:', error.message);
    }
    throw error;
  }
}

// Fire and forget (no error handling needed)
fetch('/api/log', { method: 'POST', body: logData });

// Error handling in wrapper function
async function wrapper() {
  try {
    await getData();
  } catch (error) {
    handleError(error);
  }
}

async function getData() {
  const response = await fetch('/api/data');
  return response.json();
}
```

## Why?

Without error handling:

- **Unhandled promise rejections**: Can crash Node.js applications
- **Silent failures**: Users may not know requests failed
- **Poor user experience**: No feedback when things go wrong
- **Debugging difficulty**: Errors may not be properly logged
- **Application instability**: Unhandled errors can break application flow

## Common Fetch Errors

1. **Network errors**: No internet connection, DNS resolution failures
2. **CORS errors**: Cross-origin request blocked
3. **Timeout errors**: Request took too long (with AbortSignal)
4. **HTTP errors**: 404, 500, etc. (fetch doesn't throw for these)
5. **JSON parsing errors**: Invalid JSON in response
6. **Abort errors**: Request was cancelled

## Error Handling Patterns

### 1. Try/Catch with Async/Await

```js
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error.message);
    // Handle specific error types
    if (error.name === 'AbortError') {
      // Request was cancelled
    } else if (error.name === 'TypeError') {
      // Network error
    }
    throw error; // Re-throw or handle gracefully
  }
}
```

### 2. Promise .catch()

```js
fetch('/api/data')
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => processData(data))
  .catch((error) => {
    console.error('Fetch failed:', error.message);
    showErrorToUser('Failed to load data');
  });
```

### 3. Error Recovery

```js
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## When Not To Use It

- For fire-and-forget requests (logging, analytics) where errors are not critical
- If you have a global error handler that catches all unhandled promises
- In environments where unhandled promise rejections are acceptable

## Related Rules

- `require-status-check`: Ensures HTTP status codes are checked
- `require-json-response-check`: Ensures JSON parsing is safe

## Options

This rule has no options.
