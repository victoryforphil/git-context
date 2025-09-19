# GitHub Repository Indexer - Architecture Design

## System Overview

The GitHub Repository Indexer is a client-side Next.js application that processes GitHub URLs and generates AI-friendly markdown context. The architecture prioritizes simplicity, performance, and user experience while avoiding server-side complexity.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client-Side Application                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   UI Components │  │  State Management│  │   Utils     │ │
│  │  - Input Form   │  │  - Repository    │  │ - URL Parser│ │
│  │  - File Tree    │  │    Data          │  │ - Markdown  │ │
│  │  - Output View  │  │  - UI State      │  │   Generator │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   API Layer     │  │   Data Layer     │  │  Cache      │ │
│  │  - GitHub API   │  │  - File Tree     │  │ - Repository│ │
│  │  - Rate Limiter │  │    Builder       │  │   Data      │ │
│  │  - Error Handler│  │  - URL Converter │  │ - API Cache │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    External APIs                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │   GitHub API    │  │  Raw Content     │                  │
│  │  - Repository   │  │  - File Contents │                  │
│  │    Metadata     │  │  - Direct Access │                  │
│  │  - File Tree    │  │                  │                  │
│  └─────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### 1. Core UI Components
```typescript
// Main application page
src/app/page.tsx
├── RepositoryInput     // URL input and validation
├── ProcessingIndicator // Loading states and progress
├── FileTreeDisplay     // Interactive file tree
├── MarkdownOutput      // Generated context display
└── ExportControls      // Copy/download functionality
```

#### 2. UI Component Library (Shadcn/UI)
```typescript
src/components/ui/
├── button.tsx         // Reusable button component
├── input.tsx          // Form input component
├── card.tsx           // Content container
├── progress.tsx       // Progress indicators
└── toast.tsx          // Notification system
```

#### 3. Custom Components
```typescript
src/components/
├── FileTreeNode.tsx   // Individual tree node
├── URLValidator.tsx   // Input validation
├── MarkdownPreview.tsx// Formatted markdown display
└── ErrorBoundary.tsx  // Error handling
```

### Data Layer

#### 1. Types and Interfaces
```typescript
// src/types/github.ts
interface GitHubRepository {
  name: string
  owner: string
  branch: string
  path?: string
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  url?: string
  rawUrl?: string
  children?: FileNode[]
}

interface ProcessingResult {
  repository: GitHubRepository
  fileTree: FileNode
  markdown: string
  metadata: {
    totalFiles: number
    totalDirectories: number
    depth: number
    processedAt: Date
  }
}
```

#### 2. Data Processing Services
```typescript
// src/services/
├── githubApi.ts       // GitHub API interactions
├── urlParser.ts       // URL parsing and validation
├── fileTreeBuilder.ts // Build hierarchical structure
├── markdownGenerator.ts // Generate output markdown
└── cacheManager.ts    // Client-side caching
```

### API Integration Layer

#### 1. GitHub API Service
```typescript
class GitHubApiService {
  // Repository metadata
  async getRepository(owner: string, repo: string): Promise<Repository>
  
  // Directory contents
  async getDirectoryContents(owner: string, repo: string, path: string, branch: string): Promise<FileNode[]>
  
  // Recursive tree fetching
  async getFileTree(owner: string, repo: string, path: string, branch: string, maxDepth: number): Promise<FileNode>
  
  // Rate limiting
  private async rateLimitCheck(): Promise<void>
}
```

#### 2. URL Processing
```typescript
class URLProcessor {
  // Parse GitHub URLs
  parseGitHubUrl(url: string): GitHubRepository | null
  
  // Convert to raw URLs
  convertToRawUrl(blobUrl: string): string
  
  // Validate URL format
  validateUrl(url: string): boolean
}
```

### State Management

#### 1. Application State (React Context/useState)
```typescript
interface AppState {
  // Input state
  inputUrl: string
  isValidUrl: boolean
  
  // Processing state
  isProcessing: boolean
  progress: number
  currentStep: string
  
  // Results state
  repository: GitHubRepository | null
  fileTree: FileNode | null
  generatedMarkdown: string
  
  // Error state
  error: string | null
  
  // Settings
  maxDepth: number
  includeHidden: boolean
  fileFilters: string[]
}
```

#### 2. Cache Management
```typescript
interface CacheEntry {
  key: string
  data: any
  timestamp: number
  ttl: number
}

class CacheManager {
  set(key: string, data: any, ttl: number): void
  get(key: string): any | null
  clear(): void
  cleanup(): void // Remove expired entries
}
```

## Data Flow

### 1. URL Processing Flow
```
User Input → URL Validation → Parse Repository Info → Check Cache → Fetch from GitHub API
```

### 2. File Tree Building Flow
```
Repository Root → Recursive Directory Traversal → Build File Nodes → Convert URLs → Cache Results
```

### 3. Markdown Generation Flow
```
File Tree → Template Processing → Format Markdown → Add Metadata → Generate Output
```

## API Strategy

### GitHub API Usage

#### 1. API Endpoints
- **Repository Info**: `GET /repos/{owner}/{repo}`
- **Directory Contents**: `GET /repos/{owner}/{repo}/contents/{path}`
- **Rate Limit Check**: `GET /rate_limit`

#### 2. Rate Limiting Strategy
- Check rate limits before each request
- Implement exponential backoff for rate limit errors
- Cache responses to minimize API calls
- Show rate limit status to users

#### 3. Error Handling
- Network errors: Retry with backoff
- Rate limit errors: Wait and retry
- Authentication errors: Prompt for token
- Repository errors: Clear error messages

### Authentication Strategy

#### 1. Optional GitHub Token
- Store in localStorage (with user consent)
- Increase rate limits from 60 to 5000 requests/hour
- Access private repositories (if token has permissions)

#### 2. Unauthenticated Access
- Default mode for public repositories
- Clear rate limit warnings
- Graceful degradation when limits exceeded

## Performance Optimization

### 1. Client-Side Optimizations
- **Lazy Loading**: Load file tree nodes on demand
- **Virtual Scrolling**: Handle large file trees efficiently
- **Debounced Input**: Reduce unnecessary processing
- **Memoization**: Cache computed values

### 2. Network Optimizations
- **Request Batching**: Combine multiple API calls
- **Parallel Processing**: Fetch multiple directories simultaneously
- **Response Caching**: Store API responses locally
- **Compression**: Use gzip for large responses

### 3. Memory Management
- **Garbage Collection**: Clean up unused objects
- **Memory Monitoring**: Track memory usage
- **Data Streaming**: Process large datasets incrementally
- **Cache Limits**: Prevent unlimited cache growth

## Security Considerations

### 1. Data Privacy
- No server-side storage of repository data
- Local-only processing and caching
- Optional GitHub token storage (user controlled)

### 2. API Security
- HTTPS-only communications
- Proper error handling to avoid information leakage
- Rate limiting respect to avoid API abuse

### 3. Input Validation
- Strict URL validation and sanitization
- XSS prevention in markdown output
- CSRF protection for any form submissions

## Deployment Strategy

### 1. Static Site Generation
- Next.js static export for optimal performance
- CDN deployment (Vercel, Netlify, etc.)
- No server-side dependencies

### 2. Environment Configuration
- Development, staging, and production environments
- Environment-specific API configurations
- Feature flags for gradual rollouts

### 3. Monitoring and Analytics
- Error tracking (Sentry, etc.)
- Usage analytics (privacy-focused)
- Performance monitoring
- User feedback collection

## Scalability Considerations

### 1. Client-Side Scaling
- Efficient algorithms for large repositories
- Progressive loading and rendering
- Memory usage optimization
- Browser compatibility testing

### 2. API Scaling
- Multiple GitHub API endpoints
- Fallback strategies for API failures
- Load balancing across different tokens (future)

### 3. Feature Scaling
- Modular architecture for easy feature addition
- Plugin system for custom processors
- Extensible output formats
- Multi-platform support preparation