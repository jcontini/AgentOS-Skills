---
id: exa
name: Exa
description: Semantic web search and content extraction for research
category: search
icon: https://www.google.com/s2/favicons?domain=exa.ai&sz=64
color: "#5436DA"
protocol: shell

auth:
  type: api_key
  header: x-api-key
  help_url: https://dashboard.exa.ai/api-keys

requires:
  - curl
  - jq

actions:
  search:
    description: Search the web using semantic/neural search, returns URLs and optionally content
    params:
      query:
        type: string
        required: true
        description: Natural language search query
      num_results:
        type: integer
        default: 10
        description: Number of results (1-100)
      type:
        type: string
        default: "auto"
        description: "Search type: auto, neural, or keyword"
      include_text:
        type: boolean
        default: true
        description: Include page text content in results
      livecrawl:
        type: string
        default: "always"
        description: "Freshness: always, preferred, fallback, never"
      include_domains:
        type: string
        description: Comma-separated domains to limit search to
      exclude_domains:
        type: string
        description: Comma-separated domains to exclude
    run: |
      # Build JSON payload
      PAYLOAD=$(jq -n \
        --arg query "$PARAM_QUERY" \
        --argjson num "${PARAM_NUM_RESULTS:-10}" \
        --arg type "${PARAM_TYPE:-auto}" \
        --argjson text "${PARAM_INCLUDE_TEXT:-true}" \
        --arg livecrawl "${PARAM_LIVECRAWL:-always}" \
        --arg include "$PARAM_INCLUDE_DOMAINS" \
        --arg exclude "$PARAM_EXCLUDE_DOMAINS" \
        '{
          query: $query,
          numResults: $num,
          type: $type
        }
        + (if $text then {contents: {text: true, livecrawl: $livecrawl}} else {} end)
        + (if $include != "" then {includeDomains: ($include | split(",") | map(gsub("^\\s+|\\s+$"; "")))} else {} end)
        + (if $exclude != "" then {excludeDomains: ($exclude | split(",") | map(gsub("^\\s+|\\s+$"; "")))} else {} end)')
      
      curl -s -X POST "https://api.exa.ai/search" \
        -H "x-api-key: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" | jq .

  search_urls:
    description: Quick search returning just URLs (no content, faster/cheaper)
    params:
      query:
        type: string
        required: true
        description: Natural language search query
      num_results:
        type: integer
        default: 10
        description: Number of results (1-100)
      type:
        type: string
        default: "auto"
        description: "Search type: auto, neural, or keyword"
    run: |
      curl -s -X POST "https://api.exa.ai/search" \
        -H "x-api-key: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"query\": \"$PARAM_QUERY\",
          \"numResults\": ${PARAM_NUM_RESULTS:-10},
          \"type\": \"${PARAM_TYPE:-auto}\"
        }" | jq -r '.results[] | "\(.title)\n  \(.url)\n"'

  extract:
    description: Extract content from specific URLs
    params:
      urls:
        type: string
        required: true
        description: Comma-separated URLs to extract content from
      livecrawl:
        type: string
        default: "always"
        description: "Freshness: always (recommended), fallback, never"
    run: |
      # Convert comma-separated URLs to JSON array
      URLS_JSON=$(echo "$PARAM_URLS" | jq -R 'split(",") | map(gsub("^\\s+|\\s+$"; ""))')
      
      curl -s -X POST "https://api.exa.ai/contents" \
        -H "x-api-key: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"urls\": $URLS_JSON,
          \"text\": true,
          \"livecrawl\": \"${PARAM_LIVECRAWL:-always}\"
        }" | jq .

  find_similar:
    description: Find pages similar to a given URL
    params:
      url:
        type: string
        required: true
        description: URL to find similar pages for
      num_results:
        type: integer
        default: 10
        description: Number of results (1-100)
      include_text:
        type: boolean
        default: true
        description: Include page text content in results
    run: |
      PAYLOAD=$(jq -n \
        --arg url "$PARAM_URL" \
        --argjson num "${PARAM_NUM_RESULTS:-10}" \
        --argjson text "${PARAM_INCLUDE_TEXT:-true}" \
        '{
          url: $url,
          numResults: $num
        }
        + (if $text then {contents: {text: true, livecrawl: "always"}} else {} end)')
      
      curl -s -X POST "https://api.exa.ai/findSimilar" \
        -H "x-api-key: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" | jq .
---

# Exa

Semantic web search and content extraction. Exa uses neural search to find content by meaning, not just keywords—great for research, finding niche content, and extracting clean page text.

## Requirements

This skill requires `curl` and `jq` (usually pre-installed on macOS).

## Actions

### search
Full semantic search with page content included. Best for research queries.

**Parameters:**
- `query` (required): Natural language search query
- `num_results` (optional): Number of results, default 10 (max 100)
- `type` (optional): `auto`, `neural`, or `keyword` - default `auto`
- `include_text` (optional): Include page content, default `true`
- `livecrawl` (optional): `always`, `preferred`, `fallback`, `never` - default `always`
- `include_domains` (optional): Comma-separated domains to limit search
- `exclude_domains` (optional): Comma-separated domains to exclude

**Examples:**
```
use-skill(skill: "exa", action: "search", params: {query: "best practices for building MCP servers"})
use-skill(skill: "exa", action: "search", params: {query: "rust async patterns", num_results: 5})
use-skill(skill: "exa", action: "search", params: {query: "AI news", include_domains: "techcrunch.com,theverge.com"})
```

### search_urls
Quick search returning just URLs and titles (no content). Faster and cheaper.

**Parameters:**
- `query` (required): Natural language search query
- `num_results` (optional): Number of results, default 10
- `type` (optional): `auto`, `neural`, or `keyword`

**Example:**
```
use-skill(skill: "exa", action: "search_urls", params: {query: "tauri desktop app tutorials"})
```

### extract
Extract clean text content from specific URLs. Use when you already know the URLs.

**Parameters:**
- `urls` (required): Comma-separated URLs to extract
- `livecrawl` (optional): `always` (recommended), `fallback`, `never`

**Example:**
```
use-skill(skill: "exa", action: "extract", params: {urls: "https://docs.exa.ai/reference/search,https://exa.ai/blog/neural-search"})
```

### find_similar
Find pages similar to a given URL. Great for discovering related content.

**Parameters:**
- `url` (required): URL to find similar pages for
- `num_results` (optional): Number of results, default 10
- `include_text` (optional): Include content, default `true`

**Example:**
```
use-skill(skill: "exa", action: "find_similar", params: {url: "https://anthropic.com/claude"})
```

## Search Types

- **auto** (recommended): Let Exa choose the best approach
- **neural**: Semantic/meaning-based search—best for niche, conceptual queries
- **keyword**: Traditional keyword matching—best for specific terms, names

## Tips

- **Always use `livecrawl: "always"`** for fresh content
- **Exa excels at semantic search** - natural language queries work great
- **Use `search_urls` first** if you just need to find pages, then `extract` for specific ones
- **Neural search** is best for "how to", "best practices", conceptual queries
- **Keyword search** is better for specific product names, error messages, exact phrases

## Pricing

Exa charges per request:
- Search: ~$0.003/request (URLs only) or ~$0.004/request (with content)
- Contents/Extract: ~$0.001/URL

## Full API Docs

https://docs.exa.ai
