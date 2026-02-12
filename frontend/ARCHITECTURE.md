# PlayDex Frontend Architecture

## Overview

PlayDex is built with Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS. This document explains the codebase structure and architectural decisions.

## Technology Stack

### Core
- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript 5**: Type safety
- **Tailwind CSS 4**: Utility-first CSS

### UI Libraries
- **HeroUI**: Component library (buttons, cards, toasts, skeletons)
- **Radix UI**: Unstyled, accessible components (dialogs, dropdowns, etc.)
- **Lucide React**: Icon library
- **Framer Motion**: Animations

### Data & Forms
- **Axios**: HTTP client
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **@uiw/react-md-editor**: Markdown editor for patchnotes

### Development
- **ESLint**: Code linting
- **PostCSS**: CSS processing

---

## Directory Structure

```
frontend/
├── public/                   # Static assets
│   ├── manifest.json        # PWA manifest
│   ├── logo.webp            # App logo
│   ├── hero.png             # Hero image
│   └── *.svg                # Icons
│
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout with providers
│   │   ├── page.tsx         # Homepage
│   │   ├── globals.css      # Global styles & CSS variables
│   │   ├── article/         # Game detail pages
│   │   ├── login/           # Authentication pages
│   │   ├── profile/         # User profile pages
│   │   ├── search/          # Search & filter pages
│   │   └── dashboard/       # Admin dashboard
│   │
│   ├── components/          # React components
│   │   ├── shared/          # Reusable components
│   │   │   ├── Alert.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── DebouncedInput.tsx
│   │   ├── ui/              # shadcn/ui components (Radix-based)
│   │   ├── ArticleCard/     # Game card variants
│   │   ├── ArticlePage/     # Game detail sections
│   │   ├── Search/          # Search components
│   │   ├── FlashMessage/    # Toast notifications
│   │   ├── Header.tsx       # App header
│   │   └── Footer.tsx       # App footer
│   │
│   ├── lib/                 # Utility libraries
│   │   ├── api/             # API services
│   │   │   ├── apiClient.ts
│   │   │   ├── gameService.ts
│   │   │   ├── authService.ts
│   │   │   └── userService.ts
│   │   ├── utils.ts         # General utilities
│   │   ├── navigation.ts    # Next.js navigation helpers
│   │   ├── authUtils.ts     # Auth utilities
│   │   └── gameSlug.ts      # URL slug generation
│   │
│   ├── providers/           # React Context providers
│   │   ├── AuthProvider.tsx
│   │   └── FollowedGamesProvider.tsx
│   │
│   ├── constants/           # App-wide constants
│   │   ├── app.constants.ts
│   │   ├── date.constants.ts
│   │   ├── game.constants.ts
│   │   ├── patchnote.constants.ts
│   │   └── index.ts
│   │
│   ├── i18n/                # Internationalization
│   │   ├── config.ts
│   │   └── locales/
│   │       ├── fr.json      # French translations
│   │       └── en.json      # English translations
│   │
│   └── types/               # TypeScript types
│       ├── gameType.ts
│       ├── authType.ts
│       └── patchNoteType.ts
│
├── REFACTORING.md           # What was changed
├── ARCHITECTURE.md          # This file
├── CONTRIBUTING.md          # Coding standards
├── README_I18N.md           # i18n setup guide
├── README_PWA.md            # PWA setup guide
├── package.json
├── tailwind.config.js
├── next.config.ts
└── tsconfig.json
```

---

## Architecture Patterns

### 1. Component Organization

#### Shared Components
**Location**: `src/components/shared/`
**Purpose**: Reusable UI components used across multiple pages
**Examples**: Alert, Pagination, ConfirmDialog

**When to create shared components**:
- Component is used in 3+ places
- Component has clear, single responsibility
- Component is generic (not domain-specific)

#### UI Components
**Location**: `src/components/ui/`
**Purpose**: Low-level, unstyled components from shadcn/ui (Radix UI)
**Examples**: Button, Dialog, Card, Input

**Note**: These are generated components. Don't modify directly.

#### Domain Components
**Location**: `src/components/{Domain}/`
**Purpose**: Domain-specific components
**Examples**: `ArticleCard/`, `Search/`, `ArticlePage/`

**When to create domain components**:
- Component is specific to one feature area
- Component may have multiple variants
- Component is complex and deserves its own directory

### 2. State Management

#### Local State
Use React hooks (`useState`, `useReducer`) for:
- Component-specific state
- Form state
- UI state (modals, dropdowns, etc.)

#### Context Providers
Use React Context for:
- **AuthProvider**: User authentication state
- **FollowedGamesProvider**: User's followed games
- **FlashMessageProvider**: Toast notifications

**Location**: `src/providers/`

**Pattern**:
```tsx
export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);
  const value = useMemo(() => ({ ...state, actions }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

#### Server State
Use Next.js server components and `fetch` for:
- Initial page data
- Static data
- SEO-critical data

### 3. API Layer

**Location**: `src/lib/api/`

#### Services Pattern
Each domain has its own service:
- `gameService.ts` - Game CRUD operations
- `authService.ts` - Authentication
- `userService.ts` - User operations

**Pattern**:
```typescript
// apiClient.ts - Shared axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/ld+json' },
});

// gameService.ts - Domain service
const gameService = {
  getGameById: async (id: string): Promise<Game> => {
    const res = await apiClient.get(`/games/${id}`);
    return res.data;
  },
  // ... more methods
};
```

### 4. Styling Strategy

#### Tailwind First
Use Tailwind utility classes for:
- Layout (flex, grid, spacing)
- Colors (bg-*, text-*)
- Typography
- Responsive design

#### Custom CSS Classes
Use custom classes in `globals.css` for:
- Animations (@keyframes)
- Complex utilities (.buff, .debuff)
- Component-specific styles (.admin-table, .pagination-btn)

#### CSS Variables
Use CSS custom properties for:
- Theme colors (--color-primary, --color-off-black)
- Radix UI design tokens (--background, --foreground, etc.)

**Access in Tailwind**: Use `bg-primary`, `text-off-white` (defined in tailwind.config.js)

### 5. Routing & Navigation

#### File-based Routing
Next.js App Router uses directory structure for routes:
```
app/
  page.tsx              → /
  article/
    [slug]/
      page.tsx          → /article/:slug
      patchnote/
        [id]/
          page.tsx      → /article/:slug/patchnote/:id
```

#### Navigation Helpers
**Location**: `src/lib/navigation.ts`

Use helpers instead of `window.location`:
```typescript
import { navigateToSearch } from '@/lib/navigation';
const router = useRouter();
navigateToSearch(router, 'jeux', 'minecraft');
```

### 6. Constants & Configuration

**Location**: `src/constants/`

#### Constants Pattern
```typescript
// app.constants.ts
export const MAX_GAME_ID = 120000;
export const DEFAULT_PAGE_SIZE = 20;

// Usage
import { MAX_GAME_ID } from '@/constants';
```

**Benefits**:
- Single source of truth
- Easy to update
- Type-safe
- Documented with JSDoc

### 7. TypeScript Patterns

#### Type Definitions
**Location**: `src/types/`

**Naming conventions**:
- Interfaces: `GameType`, `PatchnoteType`
- Enums: `IgdbImageFormat`, `PatchnoteType`
- Props: `ComponentNameProps`

#### Type Safety
- All API responses typed
- All component props typed
- No `any` types (use `unknown` if truly dynamic)

### 8. Data Fetching

#### Server Components (Preferred)
```tsx
// app/article/[slug]/page.tsx
export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const game = await gameService.getGameById(slug);
  return <GameDetails game={game} />;
}
```

#### Client Components (Interactive)
```tsx
'use client';

export default function SearchPage() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    gameService.search(query).then(setResults);
  }, [query]);

  return <SearchResults results={results} />;
}
```

---

## Design Patterns

### 1. Composition over Inheritance
```tsx
// Good: Compose smaller components
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardContent>{children}</CardContent>
</Card>

// Avoid: Large monolithic components
```

### 2. Render Props / Children as Function
```tsx
<DebouncedInput
  value={search}
  onChange={setSearch}
  render={(value) => <SearchResults query={value} />}
/>
```

### 3. Custom Hooks
**Location**: `src/hooks/` (future)

Extract complex logic:
```tsx
function usePagination(totalItems: number, itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  return { currentPage, totalPages, setCurrentPage };
}
```

---

## Performance Considerations

### 1. Code Splitting
- Use dynamic imports for large components
- Use Next.js automatic code splitting (page-based)

### 2. Image Optimization
- Use Next.js `<Image>` component
- Specify width/height
- Use appropriate formats (webp for photos)

### 3. Memoization
```tsx
const value = useMemo(() => ({ state, actions }), [state]);
const handleClick = useCallback(() => {...}, [deps]);
const MemoizedComponent = memo(Component);
```

### 4. Bundle Size
- Tree-shaking enabled (proper imports)
- Tailwind purging configured
- No unused dependencies

---

## Security

### 1. Authentication
- JWT tokens stored in httpOnly cookies
- CSRF protection
- No sensitive data in localStorage

### 2. XSS Prevention
- React auto-escapes
- Use `dangerouslySetInnerHTML` only for markdown (sanitized)
- Validate user inputs

### 3. API Security
- API calls through `apiClient` (centralized auth)
- CORS configured on backend
- Rate limiting on backend

---

## Testing Strategy (Future)

### Unit Tests
- Utilities (`utils.ts`, `navigation.ts`)
- Constants validation
- Type guards

### Component Tests
- Shared components
- Complex interactions
- Form validation

### E2E Tests
- Critical user flows (login, game follow, patchnote create)
- Navigation
- Search & filters

---

## Deployment

### Build Process
```bash
npm run build     # Production build
npm run start     # Production server
npm run dev       # Development server
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.playdex.com
```

### CI/CD
- Build on push to `main`
- Run lint and type checks
- Deploy to Vercel/Netlify

---

## Future Enhancements

### Planned
- [ ] Internationalization (i18n ready)
- [ ] Progressive Web App (PWA ready)
- [ ] Dark mode toggle
- [ ] Advanced search filters
- [ ] User notifications system

### Under Consideration
- [ ] Server-side rendering for better SEO
- [ ] GraphQL migration
- [ ] Storybook for component documentation
- [ ] Automated testing suite
- [ ] Performance monitoring (Sentry, LogRocket)

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
