# Contributing to AgentOS

Plugins connect AgentOS to external services. Each plugin is a YAML config that describes how to talk to an API — AgentOS handles auth, execution, and response mapping automatically.

## Creating a Plugin

```bash
npm run new-plugin myservice           # API with full CRUD
npm run new-plugin myservice --readonly # API, read-only
npm run new-plugin myservice --local    # Local (no auth needed)
```

This generates everything you need: config, icon, and tests. Edit the generated `readme.md` with your API details and you're done.

## How It Works

A plugin is just a `readme.md` with YAML frontmatter:

```yaml
---
id: myservice
name: My Service
description: What it does
auth:
  type: api_key
  header: Authorization

actions:
  list:
    operation: read
    rest:
      method: GET
      url: https://api.example.com/items
      response:
        mapping:
          id: "[].id"
          title: "[].name"
---

# My Service

Setup instructions and documentation here.
```

**Key concepts:**

- **`operation`** — Every action declares what it does: `read`, `create`, `update`, or `delete`. This powers our security features and test requirements.

- **`auth`** — Declare the auth type and AgentOS injects credentials automatically. Never put secrets in configs.

- **Response mapping** — Transform API responses into a standard format. The `[].field` syntax maps arrays, `.field` maps single objects.

## Testing

Tests are auto-generated and validated by our linter. The system:

1. **Infers requirements from your config** — If your plugin has `auth`, tests must handle missing credentials gracefully. If it has `create` operations, tests must clean up test data.

2. **Enforces standards automatically** — The pre-commit hook runs the linter. If something's missing, it tells you what to add.

3. **Supports exemptions** — Edge cases can opt out with a documented reason in the YAML.

```bash
npm run lint:tests           # Check your tests
npm test plugins/myservice   # Run your tests
```

## Commands

```bash
npm run new-plugin <name>    # Create a new plugin
npm run lint:tests           # Validate test patterns
npm run validate             # Validate plugin schemas
npm test                     # Run all tests
```

## Git Hooks

Everything is validated before you can commit:

- **Schema validation** — Catches malformed YAML
- **Security checks** — Blocks credential exposure
- **Test linting** — Ensures tests follow standards

If the hook fails, it tells you exactly what to fix.

## Executors

Plugins support multiple backends:

| Executor | Use Case |
|----------|----------|
| `rest:` | REST APIs |
| `graphql:` | GraphQL APIs |
| `sql:` | Local databases |
| `swift:` | macOS native APIs |
| `command:` | Shell commands |

See existing plugins for examples: `linear` (GraphQL), `exa` (REST), `imessage` (SQL), `apple-contacts` (Swift).

## Philosophy

**We enforce, not instruct.** The scaffold generates correct code. The linter catches mistakes. The hooks block bad commits. You focus on the API integration — we handle the standards.

**Real credentials, real APIs.** Tests call actual APIs with your production credentials. No mocking. This catches real bugs.

**Graceful degradation.** Tests skip if credentials aren't configured. Contributors without API keys can still run the test suite.

**Clean up after yourself.** If tests create data, they delete it. The linter enforces this for any plugin with `create` operations.

## Reference

| Resource | Purpose |
|----------|---------|
| `tests/plugin.schema.json` | Schema for valid configs |
| `plugins/linear/` | GraphQL example |
| `plugins/exa/` | REST example |
| `plugins/goodreads/` | Local file example |
