# React 19 Best Practices Guide (2024-2025)

**Report Date:** November 30, 2025
**Research Focus:** React 19 development best practices, new features, patterns, and security

---

## Table of Contents

1. [React 19 Overview](#react-19-overview)
2. [New Features and Migration Patterns](#new-features-and-migration-patterns)
3. [Component Patterns and Hooks Best Practices](#component-patterns-and-hooks-best-practices)
4. [Performance Optimization](#performance-optimization)
5. [TypeScript Integration Patterns](#typescript-integration-patterns)
6. [Testing React Components](#testing-react-components)
7. [Security Considerations](#security-considerations)
8. [Recommendations Summary](#recommendations-summary)

---

## React 19 Overview

React 19 was officially released on **December 5, 2024**, marking a significant milestone in React's evolution. This release focuses on enhancing performance, improving developer experience, and making asynchronous UI patterns production-ready.

### Key Highlights

- **Automatic Performance Optimization**: React Compiler (formerly React Forget) eliminates most manual memoization needs
- **Enhanced Async UI Handling**: New hooks specifically designed for form handling and optimistic updates
- **Server-First Architecture**: Production-ready Server Components and Server Actions
- **Concurrent Rendering by Default**: Prevents long renders from blocking the UI
- **Developer Experience**: Simplified APIs, better error reporting, and reduced boilerplate

---

## New Features and Migration Patterns

### 1. New Hooks

React 19 introduces four major hooks that revolutionize async UI patterns:

#### `use()` API

The `use()` API is a groundbreaking addition that reads resources during render. Unlike traditional hooks, it can be called conditionally.

**Key Features:**
- Works with Promises (suspends until resolution)
- Reads Context values
- Can be used inside `if` statements and loops (unlike traditional hooks)
- Must be used with Suspense for Promise handling

**Example with Promises:**
```javascript
import { use, Suspense } from 'react';

function DataComponent({ dataPromise }) {
  const data = use(dataPromise); // Suspends until promise resolves
  return <div>{data}</div>;
}

// Usage with Suspense
<Suspense fallback={<p>Loading...</p>}>
  <DataComponent dataPromise={fetchData()} />
</Suspense>
```

**Example with Context (Conditional):**
```javascript
function MyComponent({ isSpecialMode }) {
  if (isSpecialMode) {
    const theme = use(ThemeContext); // Can use conditionally!
    return <div className={`theme-${theme}`}>Special Mode</div>;
  }
  return <div>Normal Mode</div>;
}
```

**Important Note:** Promises created in render must be cached using a Suspense-compatible library.

#### `useActionState`

Simplifies async form handling by managing state transitions automatically.

**Syntax:**
```javascript
const [state, formAction] = useActionState(asyncFunction, initialState);
```

**Parameters:**
- `asyncFunction`: Receives current state and FormData
- `initialState`: Initial state value

**Example:**
```javascript
async function submitUser(prevState, formData) {
  try {
    const username = formData.get('username');
    const newUser = await api.createUser(username);
    return {
      users: [...prevState.users, newUser],
      error: null
    };
  } catch (error) {
    return {
      ...prevState,
      error: error.message
    };
  }
}

function UserForm() {
  const [state, formAction] = useActionState(submitUser, {
    users: [],
    error: null
  });

  return (
    <form action={formAction}>
      <input type="text" name="username" required />
      <button type="submit">Add User</button>
      {state?.error && <div className="error">{state.error}</div>}
      <ul>
        {state?.users?.map(user => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </form>
  );
}
```

#### `useOptimistic`

Enables optimistic UI updates that show expected results immediately while the server confirms.

**Syntax:**
```javascript
const [optimisticState, setOptimisticState] = useOptimistic(actualState, updateFn);
```

**Behavior:**
- Displays optimistic value immediately
- Automatically reverts if operation fails
- Updates to actual value on success

**Example:**
```javascript
function TodoList({ todos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, sending: true }]
  );

  async function handleSubmit(formData) {
    const title = formData.get('title');
    addOptimisticTodo({ id: Date.now(), title });

    try {
      await api.createTodo(title);
      // Success - optimistic update becomes permanent
    } catch (error) {
      // Failure - automatically reverts to original state
      console.error('Failed to create todo:', error);
    }
  }

  return (
    <>
      <form action={handleSubmit}>
        <input name="title" placeholder="New todo" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.sending ? 0.5 : 1 }}>
            {todo.title}
          </li>
        ))}
      </ul>
    </>
  );
}
```

#### `useFormStatus`

Reads parent form status without prop drilling, similar to Context but specialized for forms.

**Important:** Must be imported from `react-dom`, not `react`:
```javascript
import { useFormStatus } from 'react-dom';
```

**Returns:** `{ pending, data }` where:
- `pending`: Boolean indicating if form is submitting
- `data`: FormData object with form values

**Example:**
```javascript
function SubmitButton() {
  const { pending, data } = useFormStatus();

  return (
    <div>
      <button disabled={pending} type="submit">
        {pending ? 'Submitting...' : 'Submit'}
      </button>
      {pending && data && (
        <p>Submitting {data.get('username')}...</p>
      )}
    </div>
  );
}

function Form() {
  return (
    <form action={submitAction}>
      <input type="text" name="username" placeholder="Enter name" />
      <SubmitButton /> {/* Accesses form status without props */}
    </form>
  );
}
```

### 2. Actions Framework

Actions are async functions that automatically manage:
- **Pending states**: Automatically tracked and reset
- **Error handling**: Integrated with Error Boundaries
- **Optimistic updates**: Via `useOptimistic`
- **Form resets**: Automatic reset after successful submission

**Form Integration:**
```javascript
async function createPost(formData) {
  'use server'; // Server Action

  const title = formData.get('title');
  const post = await db.posts.create({ title });
  revalidatePath('/posts');
  return post;
}

function PostForm() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

### 3. Server Components and Server Actions

**Server Components:**
- Execute on the server (build-time or per-request)
- Access databases directly
- Reduce JavaScript bundle size
- No interactivity (no state, effects, or event handlers)

**Server Actions:**
- Defined with `"use server"` directive
- Execute on the server
- Callable from Client Components
- Replace many REST/GraphQL API patterns

**Example:**
```javascript
// app/posts/actions.js
'use server';

export async function getPosts() {
  const posts = await db.posts.findMany();
  return posts;
}

export async function createPost(formData) {
  const title = formData.get('title');
  await db.posts.create({ title });
  revalidatePath('/posts');
}

// app/posts/page.js (Server Component)
import { getPosts } from './actions';

export default async function PostsPage() {
  const posts = await getPosts(); // Direct async/await

  return (
    <div>
      <h1>Posts</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. Developer Experience Improvements

#### `ref` as Prop (No More `forwardRef`)

Function components now accept `ref` directly:

```javascript
// React 19 - Simple and clean
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// React 18 - Verbose
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

#### Simplified Context Provider

```javascript
// React 19
<ThemeContext value="dark">
  <App />
</ThemeContext>

// React 18
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>
```

#### Ref Cleanup Functions

```javascript
function Component() {
  return (
    <div ref={element => {
      // Setup
      element.addEventListener('scroll', handleScroll);

      // Cleanup (new in React 19)
      return () => {
        element.removeEventListener('scroll', handleScroll);
      };
    }}>
      Content
    </div>
  );
}
```

#### Enhanced `useDeferredValue`

```javascript
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query, {
    initialValue: '' // Show empty initially, update in background
  });

  const results = search(deferredQuery);
  return <ResultsList results={results} />;
}
```

### 5. Document Metadata Support

No more `react-helmet` needed:

```javascript
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title} - My Blog</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:image" content={post.image} />
      <link rel="canonical" href={`https://myblog.com/posts/${post.slug}`} />

      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### 6. Resource Preloading APIs

New APIs for performance optimization:

```javascript
import { preload, preinit, preconnect, prefetchDNS } from 'react-dom';

// Preload a resource
preload('/assets/font.woff2', { as: 'font', type: 'font/woff2' });

// Preinit (preload + execute)
preinit('/scripts/analytics.js', { as: 'script' });

// Preconnect to external domain
preconnect('https://cdn.example.com');

// DNS prefetch
prefetchDNS('https://api.example.com');
```

### Migration Patterns

#### Breaking Changes to Address

1. **PropTypes Removed**
   - Migrate to TypeScript or remove PropTypes
   - Function component `defaultProps` removed (use ES6 defaults)

2. **Legacy Context Removed**
   - Migrate to modern `createContext` API
   - Class components: use `contextType`

3. **String Refs Removed**
   - Replace with callback refs: `ref={el => this.input = el}`

4. **ReactDOM Methods Removed**
   - `ReactDOM.render()` → `createRoot().render()`
   - `ReactDOM.hydrate()` → `hydrateRoot()`
   - `unmountComponentAtNode()` → `root.unmount()`
   - `findDOMNode()` → Use refs instead

5. **Test Utilities Removed**
   - `react-test-renderer/shallow` → Use React Testing Library
   - `react-dom/test-utils` → Use React Testing Library

#### Automated Migration

Use codemods for automatic migration:

```bash
# Comprehensive migration recipe
npx codemod@latest react/19/migration-recipe

# Or specific codemods
npx react-codemod replace-reactdom-render
npx react-codemod replace-string-ref
```

#### Incremental Adoption Strategy

1. **Update Dependencies:**
   ```bash
   npm install --save-exact react@^19.0.0 react-dom@^19.0.0
   npm install --save-exact @types/react@^19.0.0 @types/react-dom@^19.0.0
   ```

2. **Test in Staging:**
   - Evaluate compatibility with your stack
   - Run automated tests
   - Test critical user flows

3. **Enable Features Gradually:**
   - React Compiler can be enabled per-file/component
   - Server Components require framework support (Next.js 15+)
   - Most new hooks are opt-in

4. **Team Training:**
   - Update internal documentation
   - Conduct workshops on new patterns
   - Share migration guide with team

---

## Component Patterns and Hooks Best Practices

### 1. Functional Components as Standard

**Recommendation:** Use functional components exclusively. Class components are legacy.

**Best Practice:**
```javascript
// Good - Modern functional component
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  return <div>{user.name}</div>;
}

// Avoid - Class component (legacy)
class UserProfile extends React.Component {
  // ...outdated pattern
}
```

### 2. Custom Hooks for Reusable Logic

Custom hooks are the preferred way to share stateful logic across components.

**Best Practice:**
```javascript
// Custom hook for data fetching
function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetchUser(userId)
      .then(data => {
        if (!cancelled) {
          setUser(data);
          setError(null);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  return { user, loading, error };
}

// Usage in multiple components
function UserProfile({ userId }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <div>{user.name}</div>;
}

function UserAvatar({ userId }) {
  const { user, loading } = useUser(userId);

  if (loading) return <SkeletonAvatar />;
  return <img src={user.avatar} alt={user.name} />;
}
```

### 3. Hooks Composition Pattern

Combine multiple custom hooks for complex behavior:

```javascript
function useAuthenticatedUser() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, loading: profileLoading } = useUserProfile(user?.id);
  const { permissions, loading: permLoading } = usePermissions(user?.id);

  return {
    user,
    profile,
    permissions,
    loading: authLoading || profileLoading || permLoading
  };
}

// Clean component using composed hook
function Dashboard() {
  const { user, profile, permissions, loading } = useAuthenticatedUser();

  if (loading) return <Spinner />;

  return (
    <div>
      <h1>Welcome, {profile.name}</h1>
      {permissions.canEdit && <EditButton />}
    </div>
  );
}
```

### 4. State Reducer Pattern

For complex state logic, use the reducer pattern:

```javascript
const initialState = {
  items: [],
  filter: 'all',
  sortBy: 'date',
  loading: false,
  error: null
};

function listReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, items: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload };
    default:
      return state;
  }
}

function ItemList() {
  const [state, dispatch] = useReducer(listReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    fetchItems()
      .then(items => dispatch({ type: 'FETCH_SUCCESS', payload: items }))
      .catch(error => dispatch({ type: 'FETCH_ERROR', payload: error }));
  }, []);

  const filteredItems = filterAndSort(state.items, state.filter, state.sortBy);

  return (
    <div>
      <FilterControls
        filter={state.filter}
        onFilterChange={f => dispatch({ type: 'SET_FILTER', payload: f })}
      />
      <ItemGrid items={filteredItems} />
    </div>
  );
}
```

### 5. Component Composition over Props Drilling

Use composition to avoid deep prop drilling:

```javascript
// Good - Composition
function Dashboard({ children }) {
  const user = useUser();

  return (
    <div className="dashboard">
      <Sidebar user={user} />
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <Dashboard>
      <UserProfile /> {/* Gets user from context, not props */}
      <ActivityFeed />
    </Dashboard>
  );
}

// Avoid - Props drilling
function Dashboard({ user, children }) {
  return (
    <div className="dashboard">
      <Sidebar user={user} />
      <main>{React.cloneElement(children, { user })}</main>
    </div>
  );
}
```

### 6. Avoid Unnecessary useEffect

React 19 emphasizes reducing `useEffect` usage:

```javascript
// Bad - Unnecessary effect
function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    setResults(filterResults(data, query));
  }, [query, data]);

  return <ResultsList results={results} />;
}

// Good - Direct calculation
function SearchResults({ query }) {
  const results = useMemo(() => filterResults(data, query), [query, data]);
  return <ResultsList results={results} />;
}

// Better - May not even need useMemo if fast
function SearchResults({ query }) {
  const results = filterResults(data, query); // React Compiler handles this
  return <ResultsList results={results} />;
}
```

### 7. Rules of Hooks (Still Apply)

1. **Only call hooks at the top level** - No conditionals, loops, or nested functions
2. **Only call hooks from React functions** - Components or custom hooks
3. **Custom hooks must start with "use"** - Naming convention for tooling

```javascript
// Bad - Conditional hook
function Component({ shouldFetch }) {
  if (shouldFetch) {
    const data = useFetch('/api/data'); // ERROR!
  }
}

// Good - Conditional logic inside hook
function Component({ shouldFetch }) {
  const data = useFetch(shouldFetch ? '/api/data' : null);
}

function useFetch(url) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!url) return;
    fetch(url).then(r => r.json()).then(setData);
  }, [url]);

  return data;
}
```

---

## Performance Optimization

### 1. React Compiler (Automatic Memoization)

**Revolutionary Change:** React 19's compiler eliminates most manual memoization needs.

**How It Works:**
- Analyzes components at compile-time
- Automatically skips unnecessary re-renders
- Memoizes expensive calculations
- Stabilizes function references

**What This Means:**
```javascript
// React 18 - Manual memoization needed
const ExpensiveComponent = memo(({ data }) => {
  const processed = useMemo(() => processData(data), [data]);
  const handleClick = useCallback(() => { /* ... */ }, []);

  return <div onClick={handleClick}>{processed}</div>;
});

// React 19 - Compiler handles it automatically
function ExpensiveComponent({ data }) {
  const processed = processData(data); // Auto-memoized by compiler
  const handleClick = () => { /* ... */ }; // Auto-stabilized

  return <div onClick={handleClick}>{processed}</div>;
}
```

**When Manual Memoization Is Still Needed:**
- Third-party libraries requiring memoized values
- Passing functions to `React.memo` components with strict equality
- Extreme performance-critical sections

### 2. Concurrent Rendering Features

React 19 enables concurrent rendering by default, allowing interruptible rendering.

#### `useTransition`

Mark non-urgent updates to keep UI responsive:

```javascript
function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value); // Urgent: update input immediately

    startTransition(() => {
      // Non-urgent: search can be interrupted
      setResults(searchData(value));
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </div>
  );
}
```

#### `useDeferredValue`

Defer expensive updates:

```javascript
function FilteredList({ items, filter }) {
  const deferredFilter = useDeferredValue(filter);
  const filtered = items.filter(item => item.includes(deferredFilter));

  return (
    <div>
      {filter !== deferredFilter && <Spinner />}
      <ul>
        {filtered.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
```

### 3. Suspense for Data Fetching

Use Suspense to handle loading states declaratively:

```javascript
import { use, Suspense } from 'react';

function UserProfile({ userPromise }) {
  const user = use(userPromise); // Suspends until loaded
  return <div>{user.name}</div>;
}

function ProfilePage({ userId }) {
  const userPromise = fetchUser(userId); // Don't await here

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

**Suspense Batching (React 19.2):**
React 19.2 introduced Suspense batching for server-side rendering, dramatically improving performance by grouping multiple Suspense boundaries.

### 4. Lazy Loading and Code Splitting

Split large components to reduce initial bundle:

```javascript
import { lazy, Suspense } from 'react';

const AdminPanel = lazy(() => import('./AdminPanel'));
const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  const { isAdmin } = useAuth();

  return (
    <Suspense fallback={<PageSpinner />}>
      {isAdmin ? <AdminPanel /> : <Dashboard />}
    </Suspense>
  );
}
```

### 5. Virtualization for Long Lists

Don't render thousands of items at once:

```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6. Image Optimization

Modern image optimization techniques:

```javascript
function OptimizedImage({ src, alt }) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`${src}.webp 1x, ${src}@2x.webp 2x`}
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={800}
        height={600}
      />
    </picture>
  );
}
```

### 7. Resource Preloading

Use React 19's new preloading APIs:

```javascript
import { preload, prefetchDNS } from 'react-dom';

function ProductPage({ productId }) {
  // Preload product image as soon as component mounts
  useEffect(() => {
    preload(`/images/product-${productId}.jpg`, { as: 'image' });
    prefetchDNS('https://api.example.com');
  }, [productId]);

  return <Product id={productId} />;
}
```

### 8. Profiling and Monitoring

**Continuous Performance Monitoring:**

```javascript
// Use React DevTools Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id, // component identifier
  phase, // "mount" or "update"
  actualDuration, // time spent rendering
  baseDuration, // estimated time without memoization
  startTime,
  commitTime,
  interactions
) {
  // Log or send to analytics
  analytics.track('component-render', {
    id,
    phase,
    duration: actualDuration
  });
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Dashboard />
    </Profiler>
  );
}
```

**Key Recommendations:**
- Profile regularly during development
- Set up Real User Monitoring (RUM) for production
- Monitor Core Web Vitals (LCP, FID, CLS)
- Use React DevTools Profiler to identify bottlenecks
- Don't optimize prematurely - measure first

---

## TypeScript Integration Patterns

### 1. Component Props Typing

**Function Components:**

```typescript
interface UserCardProps {
  name: string;
  age: number;
  email?: string;
  onEdit?: () => void;
}

function UserCard({ name, age, email, onEdit }: UserCardProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      {email && <p>Email: {email}</p>}
      {onEdit && <button onClick={onEdit}>Edit</button>}
    </div>
  );
}
```

**Extending HTML Element Props:**

```typescript
import { ComponentProps } from 'react';

// Inherit all button props
interface CustomButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

function CustomButton({ variant = 'primary', loading, children, ...props }: CustomButtonProps) {
  return (
    <button
      {...props}
      className={`btn btn-${variant}`}
      disabled={loading || props.disabled}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

**Using `ComponentPropsWithRef` (React 19):**

```typescript
import { ComponentPropsWithRef, forwardRef } from 'react';

// React 19 - No forwardRef needed
interface InputProps extends ComponentPropsWithRef<'input'> {
  label: string;
}

function Input({ label, ref, ...props }: InputProps) {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
    </div>
  );
}
```

### 2. Event Handler Typing

```typescript
// Specific event types
function Form() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle submission
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Handle enter
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleInputChange} onKeyDown={handleKeyDown} />
    </form>
  );
}

// Generic handler type
type ClickHandler = React.MouseEventHandler<HTMLButtonElement>;

const handleClick: ClickHandler = (e) => {
  console.log(e.currentTarget); // Typed as HTMLButtonElement
};
```

**Using Handler Types:**

```typescript
interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
}
```

### 3. State and Refs Typing

```typescript
// State with explicit type
const [user, setUser] = useState<User | null>(null);

// State with initial value (type inferred)
const [count, setCount] = useState(0); // Type: number

// Array state
const [items, setItems] = useState<Item[]>([]);

// Complex state
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

const [formState, setFormState] = useState<FormState>({
  values: {},
  errors: {},
  isSubmitting: false
});

// Refs (React 19 requires initial value)
const inputRef = useRef<HTMLInputElement>(null);

// Ref for mutable value
const timerRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  timerRef.current = setTimeout(() => {
    // Do something
  }, 1000);

  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
}, []);
```

### 4. Custom Hooks Typing

```typescript
interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useUser(userId: string): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchUser(userId);
      setUser(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refetch: fetchUser };
}
```

### 5. Generic Components

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// Usage with type inference
function UserList() {
  const users: User[] = [...];

  return (
    <List
      items={users}
      renderItem={(user) => <UserCard user={user} />} // user is typed as User
      keyExtractor={(user) => user.id}
    />
  );
}
```

### 6. Context Typing

```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext value={value}>
      {children}
    </ThemeContext>
  );
}

// Custom hook for type-safe context consumption
function useTheme(): ThemeContextValue {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 7. Children and ReactNode

```typescript
// Basic children
interface CardProps {
  children: React.ReactNode;
  title?: string;
}

// Render prop pattern
interface RenderPropProps<T> {
  data: T[];
  render: (item: T) => React.ReactNode;
}

// Function as children
interface LoadingWrapperProps {
  loading: boolean;
  children: (data: Data) => React.ReactNode;
}

function LoadingWrapper({ loading, children }: LoadingWrapperProps) {
  const data = useData();

  if (loading) return <Spinner />;
  return <>{children(data)}</>;
}
```

### 8. React 19 Specific Types

```typescript
// useActionState typing
type ActionState = {
  errors?: Record<string, string>;
  success?: boolean;
};

async function submitAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Implementation
  return { success: true };
}

function Form() {
  const [state, action] = useActionState(submitAction, {});

  return (
    <form action={action}>
      {/* Form fields */}
    </form>
  );
}

// useOptimistic typing
interface Todo {
  id: number;
  title: string;
  sending?: boolean;
}

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state: Todo[], newTodo: Todo): Todo[] => [...state, newTodo]
  );

  return <ul>{/* Render todos */}</ul>;
}
```

### TypeScript Configuration

**Recommended `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Testing React Components

### 1. Vitest + React Testing Library Setup

**Why Vitest?**
- Lightning-fast execution (uses Vite/esbuild)
- Native ESM and TypeScript support
- No complex configuration needed
- Modern UI dashboard
- Drop-in replacement for Jest

**Installation:**

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8
```

**Configuration (`vite.config.ts`):**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ]
    }
  }
});
```

**Setup File (`src/test/setup.ts`):**

```typescript
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

**Package Scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 2. Testing Best Practices

**Test User Behavior, Not Implementation:**

```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

// Good - Tests behavior
describe('LoginForm', () => {
  it('submits form with username and password', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
  });

  it('shows error when username is empty', async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
  });
});

// Avoid - Tests implementation details
describe('LoginForm', () => {
  it('updates state when input changes', () => {
    const { container } = render(<LoginForm />);
    const input = container.querySelector('.username-input'); // Bad: implementation detail

    fireEvent.change(input, { target: { value: 'test' } }); // Bad: fireEvent instead of userEvent

    expect(input.value).toBe('test'); // Bad: testing state directly
  });
});
```

### 3. Testing Async Components

**With Suspense and `use()`:**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

describe('UserProfile', () => {
  it('displays user data after loading', async () => {
    const userPromise = Promise.resolve({ name: 'John Doe', email: 'john@example.com' });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userPromise={userPromise} />
      </Suspense>
    );

    // Initially shows loading
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

**Testing useEffect Data Fetching:**

```typescript
describe('UserList', () => {
  it('fetches and displays users', async () => {
    const mockUsers = [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' }
    ];

    vi.spyOn(api, 'fetchUsers').mockResolvedValue(mockUsers);

    render(<UserList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('handles fetch errors', async () => {
    vi.spyOn(api, 'fetchUsers').mockRejectedValue(new Error('Failed to fetch'));

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 4. Mocking in Vitest

**Mocking Modules:**

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
  createUser: vi.fn()
}));

// Mock with factory
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Use in test
import { fetchUser } from './api';

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
  });

  it('fetches user data', async () => {
    vi.mocked(fetchUser).mockResolvedValue({ name: 'John' });

    render(<Component />);

    await waitFor(() => {
      expect(fetchUser).toHaveBeenCalledWith('123');
    });
  });
});
```

**Mocking Timers:**

```typescript
describe('AutoSaveForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('auto-saves after 2 seconds', async () => {
    const user = userEvent.setup({ delay: null }); // Important for fake timers
    const onSave = vi.fn();

    render(<AutoSaveForm onSave={onSave} />);

    await user.type(screen.getByRole('textbox'), 'Hello');

    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(onSave).toHaveBeenCalledWith('Hello');
  });
});
```

### 5. Testing Hooks

**Using `renderHook` from `@testing-library/react`:**

```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('useUser', () => {
  it('fetches user data', async () => {
    vi.spyOn(api, 'fetchUser').mockResolvedValue({ name: 'John' });

    const { result } = renderHook(() => useUser('123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual({ name: 'John' });
    expect(result.current.error).toBe(null);
  });

  it('handles errors', async () => {
    vi.spyOn(api, 'fetchUser').mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useUser('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.user).toBe(null);
  });
});
```

### 6. Testing Context

```typescript
import { render, screen } from '@testing-library/react';

function renderWithTheme(ui: React.ReactElement, { theme = 'light' } = {}) {
  return render(
    <ThemeProvider initialTheme={theme}>
      {ui}
    </ThemeProvider>
  );
}

describe('ThemedButton', () => {
  it('renders with light theme', () => {
    renderWithTheme(<ThemedButton>Click me</ThemedButton>, { theme: 'light' });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-light');
  });

  it('renders with dark theme', () => {
    renderWithTheme(<ThemedButton>Click me</ThemedButton>, { theme: 'dark' });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-dark');
  });
});
```

### 7. Browser Mode (2025 Recommendation)

Vitest Browser Mode provides the most accurate testing environment:

```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright'
    }
  }
});
```

**Migration from DOM mode:**

```typescript
// Before (jsdom)
import { render, screen } from '@testing-library/react';

// After (browser mode)
import { render, screen } from 'vitest-browser-react';

describe('Component', () => {
  it('renders correctly', async () => {
    const { container } = render(<MyComponent />);

    // Use await expect.element() for assertions
    await expect.element(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### 8. Snapshot Testing

Use sparingly for stable UI:

```typescript
import { render } from '@testing-library/react';

describe('Alert', () => {
  it('matches snapshot for success variant', () => {
    const { container } = render(<Alert variant="success">Success!</Alert>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### 9. Coverage Best Practices

```typescript
// Exclude test files and types
/// <reference types="vitest" />
```

**Run with coverage:**

```bash
npm run test:coverage
```

**Set coverage thresholds (`vite.config.ts`):**

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
});
```

---

## Security Considerations

### 1. XSS (Cross-Site Scripting) Prevention

#### React's Built-in Protection

React automatically escapes values in JSX:

```jsx
// Safe - React escapes the value
function UserGreeting({ name }) {
  return <div>Hello, {name}!</div>; // Even if name contains <script>, it's escaped
}

// Safe - Attributes are escaped too
function UserProfile({ avatarUrl }) {
  return <img src={avatarUrl} alt="Avatar" />; // URL is escaped
}
```

#### Dangerous Patterns to Avoid

**`dangerouslySetInnerHTML` without sanitization:**

```jsx
// DANGEROUS - Never do this with user input!
function BlogPost({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

// SAFE - Sanitize with DOMPurify
import DOMPurify from 'dompurify';

function BlogPost({ content }) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

**JavaScript URLs:**

```jsx
// DANGEROUS - javascript: URLs can execute scripts
function Link({ url }) {
  return <a href={url}>Click me</a>;
}

// SAFE - Validate URL protocol
function Link({ url }) {
  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  if (!isValidUrl(url)) {
    console.warn('Invalid URL blocked:', url);
    return <span>Invalid link</span>;
  }

  return <a href={url}>Click me</a>;
}
```

**Direct DOM Manipulation:**

```jsx
// DANGEROUS - Bypasses React's protection
function Component({ userContent }) {
  useEffect(() => {
    document.getElementById('content').innerHTML = userContent; // XSS risk!
  }, [userContent]);

  return <div id="content"></div>;
}

// SAFE - Use React's rendering
function Component({ userContent }) {
  return <div>{userContent}</div>; // React escapes it
}
```

### 2. Content Security Policy (CSP)

Implement strict CSP headers:

```html
<!-- In HTML meta tag or HTTP header -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM_NONCE}';
  style-src 'self' 'nonce-{RANDOM_NONCE}';
  img-src 'self' https://cdn.example.com;
  font-src 'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
">
```

**For inline scripts (use nonces):**

```jsx
// Server-side: Generate nonce per request
const nonce = crypto.randomBytes(16).toString('base64');

// Pass nonce to React
function App({ nonce }) {
  return (
    <html>
      <head>
        <script nonce={nonce} src="/app.js"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  );
}
```

### 3. Authentication and Authorization

**HTTPOnly Cookies:**

```typescript
// Server-side: Set HTTPOnly cookie
response.cookie('session', token, {
  httpOnly: true,      // Prevents JavaScript access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 3600000      // 1 hour
});
```

**Secure Token Storage:**

```typescript
// BAD - localStorage is accessible to JavaScript (XSS risk)
localStorage.setItem('authToken', token);

// GOOD - Use HTTPOnly cookies (set by server)
// Or if you must use client-side storage:
// 1. Store in memory (lost on refresh)
const [authToken, setAuthToken] = useState<string | null>(null);

// 2. Use sessionStorage (cleared on tab close)
sessionStorage.setItem('tempToken', token);

// 3. Best: HTTPOnly cookies managed by server
```

**Protected Routes:**

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

### 4. Dependency Security

**Regular Updates:**

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# For breaking changes
npm audit fix --force
```

**Use Dependabot or Renovate:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
```

**Verify Third-Party Libraries:**

```bash
# Check package reputation
npm view react-some-library

# Check for known vulnerabilities
npx snyk test

# Use npm provenance
npm install --provenance
```

### 5. API Security

**Environment Variables:**

```typescript
// NEVER commit secrets to version control
// .env (gitignored)
VITE_API_URL=https://api.example.com
API_SECRET_KEY=secret123  // Server-side only!

// Client-side (Vite)
const apiUrl = import.meta.env.VITE_API_URL; // OK - public
// import.meta.env.API_SECRET_KEY is undefined in client

// Validate env vars at startup
if (!import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL is required');
}
```

**Secure API Calls:**

```typescript
// Add authentication
async function fetchData(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include', // Send cookies
    headers: {
      'Content-Type': 'application/json',
      // Don't put sensitive tokens in headers client-side
      // Use HTTPOnly cookies instead
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

**Rate Limiting (Client-side):**

```typescript
// Prevent API abuse
function useThrottledFetch<T>(fetchFn: () => Promise<T>, delay: number = 1000) {
  const lastCall = useRef<number>(0);

  return useCallback(async () => {
    const now = Date.now();
    if (now - lastCall.current < delay) {
      throw new Error('Too many requests');
    }

    lastCall.current = now;
    return fetchFn();
  }, [fetchFn, delay]);
}
```

### 6. File Upload Security

```typescript
function FileUpload() {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // 1. Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type');
      return;
    }

    // 2. Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large');
      return;
    }

    // 3. Validate file name (prevent path traversal)
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    // 4. Upload with proper content-type
    const formData = new FormData();
    formData.append('file', file, safeName);

    uploadFile(formData);
  };

  return (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleFileChange}
    />
  );
}
```

### 7. Prevent Clickjacking

```typescript
// Server-side: Set X-Frame-Options header
response.setHeader('X-Frame-Options', 'DENY');
// Or
response.setHeader('X-Frame-Options', 'SAMEORIGIN');

// Or use CSP
response.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
```

### 8. Input Validation

```typescript
// Client-side validation (UX) + Server-side validation (security)
function SignupForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const newErrors: Record<string, string> = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit to server (which validates again!)
    try {
      await api.signup({ email, password });
    } catch (error) {
      // Handle server validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      {errors.email && <span>{errors.email}</span>}

      <input name="password" type="password" required />
      {errors.password && <span>{errors.password}</span>}

      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### 9. Secure Defaults Checklist

- [ ] Use HTTPS in production
- [ ] Set secure HTTP headers (CSP, X-Frame-Options, HSTS)
- [ ] Use HTTPOnly cookies for authentication
- [ ] Validate all user inputs (client + server)
- [ ] Sanitize HTML before using `dangerouslySetInnerHTML`
- [ ] Validate URLs before rendering links
- [ ] Keep dependencies updated (npm audit)
- [ ] Use environment variables for configuration
- [ ] Implement proper error handling (don't leak sensitive info)
- [ ] Enable CORS only for trusted domains
- [ ] Use rate limiting for API endpoints
- [ ] Log security events for monitoring
- [ ] Implement proper access control
- [ ] Use security linters (ESLint security plugins)

---

## Recommendations Summary

### Immediate Actions for Existing Projects

1. **Upgrade to React 19:**
   ```bash
   npx codemod@latest react/19/migration-recipe
   npm install react@^19.0.0 react-dom@^19.0.0
   ```

2. **Enable React Compiler:**
   - Reduces manual memoization needs
   - Improves performance automatically
   - Can be enabled incrementally

3. **Adopt Vitest for Testing:**
   - Faster than Jest
   - Better TypeScript support
   - Modern developer experience

4. **Implement Security Headers:**
   - Content Security Policy
   - HTTPOnly cookies
   - Input validation

5. **Use TypeScript:**
   - Catch errors at compile-time
   - Better IDE support
   - Self-documenting code

### New Project Setup

1. **Use a Modern Framework:**
   - Next.js 15+ for full-stack apps
   - Vite for SPAs
   - Remix for edge-first apps

2. **Project Structure:**
   ```
   src/
   ├── components/      # Reusable UI components
   ├── hooks/          # Custom hooks
   ├── pages/          # Route components
   ├── services/       # API calls, business logic
   ├── utils/          # Helper functions
   ├── types/          # TypeScript types
   └── test/           # Test utilities
   ```

3. **Essential Dependencies:**
   ```json
   {
     "dependencies": {
       "react": "^19.0.0",
       "react-dom": "^19.0.0",
       "react-router-dom": "^6.20.0"
     },
     "devDependencies": {
       "@vitejs/plugin-react": "^4.2.0",
       "typescript": "^5.3.0",
       "vitest": "^1.0.0",
       "@testing-library/react": "^14.1.0",
       "@testing-library/user-event": "^14.5.0",
       "eslint": "^8.55.0",
       "prettier": "^3.1.0"
     }
   }
   ```

4. **Configuration Files:**
   - `tsconfig.json` - TypeScript config
   - `vite.config.ts` - Build + test config
   - `.eslintrc.js` - Linting rules
   - `.prettierrc` - Code formatting

### Best Practices Checklist

**Development:**
- [ ] Use functional components exclusively
- [ ] Create custom hooks for reusable logic
- [ ] Leverage React 19's new hooks (use, useActionState, useOptimistic)
- [ ] Minimize useEffect usage
- [ ] Use TypeScript for type safety
- [ ] Follow component composition patterns

**Performance:**
- [ ] Enable React Compiler
- [ ] Use Suspense for data fetching
- [ ] Implement lazy loading for routes
- [ ] Use virtualization for long lists
- [ ] Optimize images (WebP, lazy loading)
- [ ] Profile regularly with React DevTools

**Testing:**
- [ ] Use Vitest + React Testing Library
- [ ] Test user behavior, not implementation
- [ ] Achieve >80% code coverage
- [ ] Test async operations properly
- [ ] Mock external dependencies
- [ ] Use Browser Mode for accuracy

**Security:**
- [ ] Sanitize user-generated HTML
- [ ] Validate URLs before rendering
- [ ] Use HTTPOnly cookies for auth
- [ ] Implement CSP headers
- [ ] Keep dependencies updated
- [ ] Validate all inputs (client + server)
- [ ] Use environment variables for secrets

**Code Quality:**
- [ ] Set up ESLint with React rules
- [ ] Use Prettier for formatting
- [ ] Implement pre-commit hooks (Husky)
- [ ] Write meaningful commit messages
- [ ] Conduct code reviews
- [ ] Document complex logic

### Learning Resources

**Official Documentation:**
- [React 19 Documentation](https://react.dev)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev)

**Community Resources:**
- [React TypeScript Cheatsheet](https://github.com/typescript-cheatsheets/react)
- [React Testing Library Docs](https://testing-library.com/react)
- [React Patterns](https://www.patterns.dev/react)

**Tools:**
- React DevTools - Performance profiling
- ESLint - Code linting
- Prettier - Code formatting
- TypeScript - Type checking
- Vitest - Testing framework

---

## Conclusion

React 19 represents a significant evolution in React development, focusing on:

1. **Automatic Optimization**: The React Compiler eliminates most manual memoization
2. **Better Async Patterns**: New hooks make form handling and optimistic updates trivial
3. **Server-First Architecture**: Server Components and Actions reduce client-side complexity
4. **Improved DX**: Simplified APIs, better error messages, and reduced boilerplate

**Key Takeaways:**

- **Upgrade gradually**: React 19 supports incremental adoption
- **Embrace new patterns**: Learn the new hooks and server-side features
- **Prioritize security**: Implement proper validation, sanitization, and headers
- **Use modern tooling**: Vitest, TypeScript, and React Compiler improve productivity
- **Test thoroughly**: Invest in comprehensive testing for reliability
- **Monitor performance**: Profile regularly and optimize based on data

React 19 is production-ready and recommended for all new projects. Existing projects should plan migration to take advantage of performance improvements and developer experience enhancements.

---

## Sources

- [React v19 – React](https://react.dev/blog/2024/12/05/react-19)
- [React 19 Upgrade Guide – React](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 19 New Features and Migration Guide](https://www.ksolves.com/blog/reactjs/whats-new-in-react-19)
- [React 19 – New Hooks Explained with Examples](https://www.freecodecamp.org/news/react-19-new-hooks-explained-with-examples/)
- [React Design Patterns and Best Practices for 2025](https://www.telerik.com/blogs/react-design-patterns-best-practices)
- [React 19 Memoization: Is useMemo & useCallback No Longer Necessary?](https://dev.to/joodi/react-19-memoization-is-usememo-usecallback-no-longer-necessary-3ifn)
- [React Performance Optimization: Best Practices for 2025](https://dev.to/frontendtoolstech/react-performance-optimization-best-practices-for-2025-2g6b)
- [React 19.2 Brings Suspense Batching to Server Rendering](https://medium.com/@roman_fedyskyi/react-19-2-brings-suspense-batching-to-server-rendering-68cf3340bc5b)
- [React and TypeScript Trends in 2024](https://thiraphat-ps-dev.medium.com/react-and-typescript-trends-in-2024-what-to-expect-df32a5d9bd6f)
- [TypeScript Best Practices for 2024](https://www.solutionsindicator.com/blog/typescript-best-practices-2024/)
- [React Testing with Vitest & React Testing Library](https://vaskort.medium.com/bulletproof-react-testing-with-vitest-rtl-deeaabce9fef)
- [Vitest with React Testing Library](https://www.robinwieruch.de/vitest-react-testing-library/)
- [Are you still using Jest for Testing your React Apps in 2025?](https://medium.com/nerd-for-tech/are-you-still-using-jest-for-testing-your-react-apps-on-2025-07e5ea956465)
- [Secure Code Best Practices for React 2025](https://www.cyserch.com/blog/Secure-Code-Best-Practices-for-React-2024)
- [React Security Best Practices 2025](https://corgea.com/Learn/react-security-best-practices-2025)
- [React XSS Guide: Understanding and Prevention](https://www.stackhawk.com/blog/react-xss-guide-examples-and-prevention/)
- [Is React Vulnerable to XSS?](https://www.invicti.com/blog/web-security/is-react-vulnerable-to-xss)
