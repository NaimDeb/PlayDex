# Contributing to PlayDex Frontend

## Code Standards

### Language
- **Code Comments**: English
- **User-Facing Text**: French (or use i18n keys)
- **Variable Names**: English, camelCase
- **File Names**: PascalCase for components, camelCase for utilities

### TypeScript
- **Always use TypeScript** - No `.js` or `.jsx` files
- **Avoid `any`** - Use `unknown` if type is truly dynamic
- **Type all props** - Create `ComponentNameProps` interface
- **Type all API responses** - Define types in `src/types/`

### Naming Conventions

#### Files
```
Components:     Button.tsx, GameCard.tsx
Pages:          page.tsx, layout.tsx
Utilities:      utils.ts, navigation.ts
Types:          gameType.ts, authType.ts
Constants:      app.constants.ts
```

#### Variables
```typescript
// Constants (uppercase with underscores)
const MAX_GAME_ID = 120000;
const MS_PER_DAY = 86400000;

// Functions (camelCase, verb first)
function formatDateDifference(date: Date): string
function navigateToSearch(router: Router, query: string): void

// Components (PascalCase)
export function GameCard({ game }: GameCardProps) {}

// Hooks (camelCase, start with 'use')
function useAuth() {}
function usePagination() {}

// Types/Interfaces (PascalCase, end with Type or Props)
interface GameType {}
interface ButtonProps {}
```

---

## Component Guidelines

### Component Structure
```tsx
/**
 * Brief description of component
 * @example
 * <ComponentName prop1="value" />
 */

'use client'; // Only if needed

import React from 'react';
import { /* dependencies */ } from 'library';
import { /* types */ } from '@/types';
import { /* utils */ } from '@/lib/utils';

interface ComponentNameProps {
  /** Prop description */
  propName: string;
  /** Optional prop */
  optionalProp?: number;
}

export function ComponentName({ propName, optionalProp = 10 }: ComponentNameProps) {
  // Hooks first
  const [state, setState] = useState();
  const value = useMemo(() => {}, [deps]);

  // Event handlers
  const handleClick = useCallback(() => {
    // ...
  }, [deps]);

  // Render logic
  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage />;

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### When to Create a Component

**Create a new component when**:
- Code is used in 3+ places (DRY principle)
- Component has clear single responsibility
- Component is complex (>100 lines)
- Component improves readability

**Don't create a component when**:
- Used only once
- Just wraps a single element
- Adds unnecessary abstraction

### Component Categories

1. **Shared Components** (`src/components/shared/`)
   - Generic, reusable across app
   - No domain logic
   - Well-documented
   - Examples: Alert, Pagination, ConfirmDialog

2. **UI Components** (`src/components/ui/`)
   - Low-level primitives (shadcn/ui)
   - Don't modify these directly
   - Regenerate with CLI if needed

3. **Domain Components** (`src/components/{Domain}/`)
   - Feature-specific
   - Can have variants
   - Examples: GameCard, SearchFilters

---

## Styling Guidelines

### Tailwind CSS First
```tsx
// Good: Use Tailwind utilities
<div className="flex items-center gap-4 p-6 bg-off-gray rounded-lg">

// Avoid: Inline styles
<div style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>

// Exception: Dynamic values or complex CSS
<div style={{ clipPath: `polygon(${points})` }}>
```

### Color Usage
```tsx
// Good: Use custom colors from config
className="bg-primary text-off-white"

// Good: Use semantic colors
className="bg-green-500"  // For success states

// Avoid: Hardcoded hex colors
className="bg-[#4D40FF]"

// Never: Inline hex colors
style={{ backgroundColor: '#4D40FF' }}
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="flex flex-col md:flex-row lg:gap-8">

// Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
```

### Custom Classes
```css
/* globals.css - Only for animations or complex patterns */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in;
}
```

---

## State Management

### Local State
```tsx
// Simple state
const [count, setCount] = useState(0);

// Complex state
const [state, setState] = useState({
  loading: false,
  data: null,
  error: null,
});

// Or use reducer for complex logic
const [state, dispatch] = useReducer(reducer, initialState);
```

### Context (Shared State)
```tsx
// When to use Context:
// - Shared across many components
// - Avoid prop drilling
// - Authentication, theme, user preferences

// Pattern:
export function ProviderName({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);

  const value = useMemo(() => ({
    ...state,
    actions: {
      update: (data) => setState(data),
    },
  }), [state]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useProviderName() {
  const context = useContext(Context);
  if (!context) throw new Error('Must be used within Provider');
  return context;
}
```

---

## Data Fetching

### Server Components (Preferred)
```tsx
// Good: Async server component
export default async function Page() {
  const data = await fetchData();
  return <Display data={data} />;
}

// Benefits: Better SEO, smaller bundle, faster initial load
```

### Client Components (Interactive)
```tsx
'use client';

// For interactive features
export function SearchPage() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults(query).then(setResults);
  }, [query]);

  return <Results data={results} />;
}
```

### API Calls
```tsx
// Use service layer
import gameService from '@/lib/api/gameService';

// Good: Centralized error handling
try {
  const data = await gameService.getGame(id);
} catch (error) {
  showErrorToast(error.message);
}

// Avoid: Direct axios calls
const res = await axios.get('/api/games');
```

---

## Constants & Configuration

### Always Use Constants
```tsx
// Bad: Magic numbers
setTimeout(onChange, 400);
const randomId = Math.floor(Math.random() * 120000);

// Good: Named constants
import { INPUT_DEBOUNCE_DELAY, MAX_GAME_ID } from '@/constants';

setTimeout(onChange, INPUT_DEBOUNCE_DELAY);
const randomId = Math.floor(Math.random() * MAX_GAME_ID);
```

### Creating Constants
```typescript
// src/constants/domain.constants.ts

/**
 * Domain-specific constants
 * @module constants/domain
 */

/** Brief description */
export const CONSTANT_NAME = value;

// Export from index
// src/constants/index.ts
export * from './domain.constants';
```

---

## Documentation

### JSDoc Comments

#### Functions
```typescript
/**
 * Brief description of what function does
 * More detailed explanation if needed
 * @param paramName - Parameter description
 * @param optionalParam - Optional parameter (default: value)
 * @returns Return value description
 * @throws {ErrorType} When error occurs
 * @example
 * functionName('example', 123);
 * // Returns: "expected output"
 */
export function functionName(paramName: string, optionalParam: number = 10): string {
  // ...
}
```

#### Components
```tsx
/**
 * Component description and purpose
 *
 * @example
 * <ComponentName
 *   title="Example"
 *   onSave={(data) => console.log(data)}
 * />
 */
export function ComponentName({ title, onSave }: ComponentNameProps) {
  // ...
}
```

#### Interfaces
```typescript
/**
 * Represents a game in the system
 */
interface GameType {
  /** Unique game identifier */
  id: string;
  /** Display name of the game */
  title: string;
  /** Optional description (nullable) */
  description?: string;
}
```

---

## Error Handling

### Try-Catch Pattern
```tsx
try {
  await riskyOperation();
} catch (error) {
  // Log to console (development)
  console.error('Operation failed:', error);

  // Show user-friendly message
  showToast({
    title: 'Error',
    message: error instanceof Error ? error.message : 'Unknown error',
    severity: 'error',
  });
}
```

### Error Boundaries
```tsx
// For catching React errors
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

## Performance

### Memoization
```tsx
// Expensive calculations
const value = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Callbacks passed as props
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Components
const MemoizedComponent = memo(Component);
```

### Code Splitting
```tsx
// Dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

### Image Optimization
```tsx
import Image from 'next/image';

<Image
  src={imageUrl}
  alt="Description"
  width={300}
  height={200}
  placeholder="blur"
  loading="lazy"
/>
```

---

## Testing

### Unit Tests (Future)
```typescript
// utils.test.ts
import { formatDateDifference } from './utils';

describe('formatDateDifference', () => {
  it('returns "Il y a 1 jour" for yesterday', () => {
    const yesterday = new Date(Date.now() - MS_PER_DAY);
    expect(formatDateDifference(yesterday)).toBe('Il y a 1 jour');
  });
});
```

### Component Tests (Future)
```tsx
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

## Git Workflow

### Branch Naming
```
feature/add-user-notifications
fix/search-filter-bug
refactor/simplify-auth-logic
docs/update-readme
```

### Commit Messages
```
Format: <type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code refactoring
- docs: Documentation
- style: Code style (formatting, missing semicolons, etc.)
- test: Adding tests
- chore: Build process or auxiliary tool changes

Examples:
feat(game): add follow button to game cards
fix(auth): resolve login redirect issue
refactor(utils): extract date formatting to shared utility
docs(readme): add PWA setup instructions
```

### Pull Requests
- Clear title describing the change
- Description with context and reasoning
- Screenshots for UI changes
- Link to related issues
- Request review from team members

---

## Code Review Checklist

### Before Creating PR
- [ ] Code follows style guide
- [ ] All new code has JSDoc comments
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Constants used instead of magic numbers
- [ ] TypeScript types defined
- [ ] Responsive design tested
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] App builds successfully

### Reviewing PRs
- [ ] Code is readable and maintainable
- [ ] Logic is sound
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
- [ ] Security implications considered
- [ ] Tests added/updated (when applicable)

---

## Common Mistakes to Avoid

### ❌ Don't
```tsx
// Using window.location
window.location.href = '/profile';

// Using any type
const data: any = fetchData();

// Magic numbers
if (count > 120000) { ... }

// Hardcoded strings (use i18n keys)
<button>Se connecter</button>

// Inline event handlers for complex logic
<button onClick={() => { /* 20 lines of code */ }}>
```

### ✅ Do
```tsx
// Use Next.js router
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/profile');

// Type properly
const data: UserData = await fetchData();

// Use constants
import { MAX_GAME_ID } from '@/constants';
if (count > MAX_GAME_ID) { ... }

// Use translations
const t = useTranslations('auth');
<button>{t('login')}</button>

// Extract complex handlers
const handleSubmit = useCallback(() => {
  // Complex logic here
}, [deps]);
<button onClick={handleSubmit}>
```

---

## Questions?

- Check `ARCHITECTURE.md` for codebase structure
- Check `REFACTORING.md` for recent changes
- Ask in team chat
- Open a discussion issue on GitHub
