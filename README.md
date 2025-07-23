# Cursor Memories

A powerful CLI tool for storing and searching development memories, insights, and patterns using Cursor Rules, Supabase, and OpenAI embeddings.

## Diagram
<img width="1200" height="630" alt="Facebook post - 1" src="https://github.com/user-attachments/assets/66b4c754-e681-4118-81e9-749af86adf66" />

## Documentation

[Read the full documentation on Notion](https://green-moon-f98.notion.site/DIY-Cursor-Memory-System-2346c9afe28880e4bed9e86b0b2a9c10)

## Features

- 🧠 **Memory Storage**: Store development insights, patterns, and solutions
- 🔍 **Semantic Search**: Find memories using natural language queries with OpenAI embeddings
- 🏷️ **Categorization**: Organize memories by categories (Architecture, Database, Security, etc.)
- 🛠️ **Tech Stack Tagging**: Tag memories with relevant technologies
- 📊 **Repository Organization**: Group memories by project/repository
- ⚡ **Fast CLI**: Quick commands for adding and searching memories
- 🔐 **Secure**: Uses Supabase for secure data storage

## Pre-requisite

### 1.1 Create Supabase Organization & Project

1. Go to [supabase.com](https://supabase.com/)
2. Sign in → Create new organization → Choose free tier
3. Create new project:
   - Name: `project-name`
   - Set database password
   - Choose region
   - Wait ~2–3 mins

### 1.2 Enable Vector Extension

- Go to `Database → Extensions`
- Enable the `vector` extension

### 1.3 Create `memories` Table

```sql
CREATE TABLE memories (
  id SERIAL PRIMARY KEY,
  repo TEXT NOT NULL,
  category TEXT NOT NULL,
  tech_stack TEXT[] DEFAULT '{}',
  title TEXT NOT NULL,
  document TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Create Index for Vector Search:**

```sql
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 1.4 Create Search RPC Function

Create function named `search_memories`:

**Arguments:**

- `query_embedding VECTOR`
- `match_threshold DOUBLE PRECISION`
- `match_count INTEGER`
- `filter_repo TEXT`
- `filter_category TEXT`
- `filter_tech_stack TEXT[]`

**Function Definition:**

```sql
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.repo,
    memories.category,
    memories.tech_stack,
    memories.title,
    memories.document,
    memories.embedding,
    memories.created_at
  FROM memories
  WHERE (filter_repo IS NULL OR memories.repo = filter_repo)
    AND (filter_category IS NULL OR memories.category = filter_category)
    AND (filter_tech_stack IS NULL OR memories.tech_stack @> filter_tech_stack)
    AND (1 - (query_embedding <=> memories.embedding)) > match_threshold
  ORDER BY (1 - (query_embedding <=> memories.embedding)) DESC
  LIMIT match_count;
END;
```

### 1.5 Get API Credentials

- Go to `Settings → API`
- Copy your **Project URL**
- Copy your **Service Role Key**
  ⚠️ Keep this **secret**, continue

## Installation

```bash
npm install -g cursor-memories
```

## Quick Start

1. **Setup your environment**:

   ```bash
   memories setup
   ```

   This will prompt you for your Supabase and OpenAI credentials and save them in the package directory.

## Cursor Integration

Cursor Memories is designed to work seamlessly with Cursor's AI agents. The agents automatically store and retrieve development memories to provide context-aware assistance.

### How It Works

- **Automatic Storage**: When you work with Cursor agents, they automatically store important insights, patterns, and solutions as memories
- **Context Retrieval**: Agents search through your stored memories to provide relevant context for current tasks
- **Semantic Matching**: Uses OpenAI embeddings to find memories that semantically match your current work
- **Repository Awareness**: Memories are organized by repository, so agents can provide project-specific insights

### Agent Commands

The agents use the following commands internally:

- `memories add` - Store new development insights
- `memories search` - Retrieve relevant memories for context

## Commands

### Setup

```bash
memories setup
```

Interactive setup for environment variables (Supabase URL, API keys).

### Add Memory

```bash
memories add --repo="repo-name" --category="Category" --tech_stack="Tech,Stack" --title="Memory Title" --document="Memory content"
```

**Options:**

- `--repo, -r`: Repository name
- `--category, -c`: Category (Database, Architecture, Components, API, Performance, Security, Testing, DevOps, UX, Business, Debugging, Patterns)
- `--tech_stack`: Comma-separated list of technologies
- `--title, -t`: Memory title
- `--document, -d`: Memory content (use `__NEWLINE__` for line breaks)

### Search Memories

```bash
memories search --query="search terms" --repo="repo-name" --category="Category" --full
```

**Options:**

- `--query, -q`: Search query
- `--repo, -r`: Filter by repository
- `--category, -c`: Filter by category
- `--tech_stack, -t`: Filter by tech stack
- `--threshold`: Similarity threshold (0.0-1.0, default: 0.3)
- `--limit`: Maximum results (default: 10)
- `--full`: Show full details for all results

## Environment Variables

The setup script will automatically create a `.env` file in the package directory with your configuration:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

**Note**: The `.env` file is saved in the package directory (not your current project) so that the `memories` command works from any directory.

## Categories

- **Architecture**: System design, high-level patterns
- **Components**: UI patterns, reusable components
- **Database**: SQL, migrations, query optimization
- **API**: Endpoint design, request/response patterns
- **Performance**: Optimization techniques, bottleneck solutions
- **Security**: Authentication, authorization, vulnerability fixes
- **Testing**: Test patterns, debugging approaches
- **DevOps**: Deployment, infrastructure, CI/CD
- **UX**: User experience patterns and insights
- **Business**: Domain logic, workflow patterns
- **Debugging**: Troubleshooting techniques, error solutions
- **Patterns**: Reusable code patterns and best practices

## Examples

### Store a Database Pattern

```bash
memories add \
  --repo="ecommerce-app" \
  --category="Database" \
  --tech_stack="PostgreSQL,Node.js" \
  --title="Connection Pooling Pattern" \
  --document="Implemented connection pooling using pg-pool to handle high concurrent database connections. Configured with max: 20, idleTimeoutMillis: 30000, and connectionTimeoutMillis: 2000. This reduced connection overhead by 60% and improved response times by 40%."
```

### Search for Performance Insights

```bash
memories search --query="performance optimization database" --category="Performance" --full
```

### Find Architecture Patterns

```bash
memories search --query="microservices architecture" --repo="backend-services" --full
```

## Limitations

### Single Supabase Project

This package is designed to work with **one Supabase project at a time**. The global installation stores environment variables in the package directory, which means:

- All memories are stored in a single Supabase database
- You can only connect to one Supabase project per installation
- Environment variables are shared across all repositories

### Solutions for Multiple Projects

If you need to work with multiple Supabase projects or want to keep memories separate:

1. **Fork the Repository**: Create your own fork and customize it for your specific needs
2. **Clone Locally**: Clone the repository locally and use it as a standalone tool
3. **Multiple Installations**: Install different versions in different directories

### Example: Local Installation

```bash
# Clone the repository locally
git clone https://github.com/yourusername/cursor-memories.git my-memories
cd my-memories

# Install dependencies
npm install

# Link locally
npm link

# Setup for your specific project
memories setup
```

This approach allows you to have separate memory databases for different projects or organizations.

## Requirements

- Node.js 18.0.0 or higher
- Supabase account and project
- OpenAI API key (optional, for semantic search)

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/cursor-memories.git
cd cursor-memories

# Install dependencies
npm install

# Link for development
npm link

# Run commands
memories setup
memories add --help
memories search --help
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/cursor-memories/issues)
- Documentation: [GitHub Wiki](https://github.com/yourusername/cursor-memories/wiki)
