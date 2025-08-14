# @teapot-smashers/fetch/prefer-async-await

> Prefer async/await over promise chains for fetch requests to improve readability

Promise chains with `fetch()` can become difficult to read and debug, especially with complex error handling. Async/await provides cleaner, more readable code that's easier to maintain.

❌ Examples of **incorrect** code for this rule:

```js
// Basic promise chain
fetch('/api/data')
  .then((response) => response.json())
  .then((data) => console.log(data));

// Complex promise chain with error handling
fetch('/api/data')
  .then((response) => {
    if (!response.ok) throw new Error('Failed');
    return response.json();
  })
  .then((data) => processData(data))
  .catch((error) => console.error(error));

// Nested fetch calls in promise chains
fetch('/api/users')
  .then((response) => response.json())
  .then((users) => users.filter((u) => u.active))
  .then((activeUsers) => {
    return fetch('/api/process', {
      method: 'POST',
      body: JSON.stringify(activeUsers),
    });
  })
  .then((response) => response.json());

// Single .then on fetch
fetch('/api/data').then((response) => response.json());

// Promise chain with .catch
fetch('/api/data')
  .then((response) => response.json())
  .catch((error) => console.error(error));
```

✅ Examples of **correct** code for this rule:

```js
// async/await pattern
async function getData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}

// async/await with error handling
async function getData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Complex async operations made readable
async function processUsers() {
  try {
    const response = await fetch('/api/users');
    const users = await response.json();
    const activeUsers = users.filter((u) => u.active);

    const processResponse = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeUsers),
    });

    return await processResponse.json();
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}

// Fire and forget (no promise chain)
fetch('/api/log', { method: 'POST', body: logData });

// Promise assignment without .then (allowable)
const fetchPromise = fetch('/api/data');
```

## Why?

Async/await provides several benefits over promise chains:

- **Readability**: Code reads more like synchronous code
- **Error handling**: Single try/catch block instead of multiple .catch() calls
- **Debugging**: Stack traces are clearer and more meaningful
- **Variable scope**: Variables are available throughout the function
- **Control flow**: Easier to implement loops, conditions, and complex logic

## Comparison

**Promise Chain (harder to read):**

```js
fetch('/api/user/1')
  .then((response) => {
    if (!response.ok) throw new Error('User not found');
    return response.json();
  })
  .then((user) => {
    return fetch(`/api/posts/${user.id}`);
  })
  .then((response) => {
    if (!response.ok) throw new Error('Posts not found');
    return response.json();
  })
  .then((posts) => {
    console.log(`User has ${posts.length} posts`);
    return posts;
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
```

**Async/Await (easier to read):**

```js
async function getUserPosts(userId) {
  try {
    const userResponse = await fetch(`/api/user/${userId}`);
    if (!userResponse.ok) throw new Error('User not found');
    const user = await userResponse.json();

    const postsResponse = await fetch(`/api/posts/${user.id}`);
    if (!postsResponse.ok) throw new Error('Posts not found');
    const posts = await postsResponse.json();

    console.log(`User has ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

## When Not To Use It

- If you prefer functional programming style with promise chains
- For simple one-line transformations where async/await adds overhead
- In environments where async/await is not supported (very old browsers)

## Migration Tips

1. **Wrap existing promise chains in async functions**
2. **Replace .then() with await**
3. **Replace .catch() with try/catch blocks**
4. **Don't forget to mark functions as async**

## Options

This rule has no options.
