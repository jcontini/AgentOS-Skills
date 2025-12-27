---
id: files
name: Files
description: Browse, read, write, and manage files and directories
icon: icon.svg
color: "#4A90D9"

schema:
  # File or directory info
  file_info:
    path:
      type: string
      required: true
      description: Full path to file or directory
    name:
      type: string
      required: true
      description: File or directory name
    type:
      type: string
      enum: [file, directory, symlink, other]
      required: true
      description: Type of filesystem entry
    size:
      type: number
      description: Size in bytes (files only)
    mime:
      type: string
      description: MIME type (files only)
    extension:
      type: string
      description: File extension without dot
    modified:
      type: string
      description: Last modified timestamp (ISO 8601)
    created:
      type: string
      description: Creation timestamp (ISO 8601)

  # Directory listing
  directory:
    path:
      type: string
      required: true
      description: Directory path
    entries:
      type: array
      items:
        type: object
        properties:
          name: { type: string }
          type: { type: string, enum: [file, directory, symlink] }
          size: { type: number }
      description: Directory contents

  # File contents
  file_contents:
    path:
      type: string
      required: true
    content:
      type: string
      description: File content (text files) or extraction result (PDF, DOCX)
    truncated:
      type: boolean
      description: True if content was truncated due to size

actions:
  open:
    label: "Open file, URL, or app"
    description: Open a file with default app, launch a URL, or start an application
    readonly: false
    params:
      target:
        type: string
        required: true
        description: File path, URL (http/https/maps://), or app name

  browse:
    label: "List directory"
    description: List directory contents (flat list with details)
    readonly: true
    params:
      path:
        type: string
        required: true
        description: Directory path (absolute or ~/ relative)
    returns: directory

  browse_tree:
    label: "Directory tree view"
    description: Show directory as a tree structure
    readonly: true
    params:
      path:
        type: string
        required: true
        description: Directory path
      depth:
        type: number
        default: 3
        description: Tree depth limit
    returns: directory

  read:
    label: "Read file"
    description: Read text file contents
    readonly: true
    params:
      path:
        type: string
        required: true
        description: File path
    returns: file_contents

  read_pdf:
    label: "Read PDF file"
    description: Extract text from PDF (requires pdftotext)
    readonly: true
    params:
      path:
        type: string
        required: true
        description: PDF file path
    returns: file_contents

  decrypt_pdf:
    label: "Decrypt PDF"
    description: Remove password protection from a PDF (requires qpdf)
    readonly: false
    params:
      path:
        type: string
        required: true
        description: Input PDF file path
      password:
        type: string
        required: true
        description: PDF password
      output:
        type: string
        required: true
        description: Output file path for decrypted PDF

  read_docx:
    label: "Read Word document"
    description: Extract text from DOCX (uses textutil on macOS)
    readonly: true
    params:
      path:
        type: string
        required: true
        description: DOCX file path
    returns: file_contents

  file_info:
    label: "Get file info"
    description: Get file MIME type and metadata
    readonly: true
    params:
      path:
        type: string
        required: true
        description: File path
    returns: file_info

  write:
    label: "Write file"
    description: Create or overwrite a file with content
    readonly: false
    params:
      path:
        type: string
        required: true
        description: File path (absolute path required)
      content:
        type: string
        required: true
        description: File content to write

  mkdir:
    label: "Create directory"
    description: Create a directory (and parent directories if needed)
    readonly: false
    params:
      path:
        type: string
        required: true
        description: Directory path to create

  move:
    label: "Move file or directory"
    description: Move a file or directory to a new location
    readonly: false
    params:
      from:
        type: string
        required: true
        description: Source path
      to:
        type: string
        required: true
        description: Destination path

  copy:
    label: "Copy file"
    description: Copy a file to a new location
    readonly: false
    params:
      from:
        type: string
        required: true
        description: Source path
      to:
        type: string
        required: true
        description: Destination path

  copy_recursive:
    label: "Copy directory"
    description: Copy a directory recursively
    readonly: false
    params:
      from:
        type: string
        required: true
        description: Source directory path
      to:
        type: string
        required: true
        description: Destination path

  delete:
    label: "Delete file"
    description: Delete a single file
    readonly: false
    params:
      path:
        type: string
        required: true
        description: File path to delete

  delete_recursive:
    label: "Delete directory"
    description: Delete a directory and all contents
    readonly: false
    params:
      path:
        type: string
        required: true
        description: Directory path to delete

  rename:
    label: "Rename file or directory"
    description: Rename a file or directory (same as move, provide full destination path)
    readonly: false
    params:
      path:
        type: string
        required: true
        description: Current path
      to:
        type: string
        required: true
        description: New path (full destination path)

---

# Files

Browse, read, write, and manage files and directories on the local filesystem.

## Connector

| Connector | Platform | Status |
|-----------|----------|--------|
| `macos` | macOS (CLI tools) | ✅ Ready |

**Note:** Linux/Windows could use the same CLI tools (ls, cat, cp, mv, rm, etc.) - might work cross-platform.

## Actions

### open
Open files, URLs, or apps with the system default handler.

```
Files.open(target: "/Users/joe/Documents/report.pdf")
Files.open(target: "https://google.com")
Files.open(target: "Safari")
```

### browse / browse_tree
List directory contents.

```
Files.browse(path: "/Users/joe/Documents")
Files.browse_tree(path: "~/projects", depth: 2)
```

### read / read_pdf / read_docx
Read file contents with format-specific actions.

```
Files.read(path: "/Users/joe/Documents/notes.md")
Files.read_pdf(path: "/Users/joe/Documents/report.pdf")
Files.read_docx(path: "/Users/joe/Documents/document.docx")
Files.file_info(path: "/path/to/file")
```

**Requirements:**
- PDF: `pdftotext` (`brew install poppler`)
- DOCX: `textutil` (built into macOS)
- Tree view: `tree` (`brew install tree`)

### write
Create or overwrite a file.

```
Files.write(path: "/Users/joe/Documents/report.html", content: "<html>...</html>")
Files.write(path: "/Users/joe/Documents/notes.md", content: "# Notes\n...")
```

### mkdir
Create directories (including parent directories).

```
Files.mkdir(path: "/Users/joe/new-folder")
Files.mkdir(path: "/Users/joe/a/b/c")
```

### move
Move files or directories.

```
Files.move(from: "/Users/joe/file.txt", to: "/Users/joe/Desktop/file.txt")
```

### copy / copy_recursive
Copy files or directories.

```
Files.copy(from: "file.txt", to: "file-backup.txt")
Files.copy_recursive(from: "my-folder", to: "my-folder-backup")
```

### delete / delete_recursive
Delete files or directories.

```
Files.delete(path: "/Users/joe/temp-file.txt")
Files.delete_recursive(path: "/Users/joe/temp-folder")
```

### rename
Rename a file or directory (provide full destination path).

```
Files.rename(path: "/Users/joe/old-name.txt", to: "/Users/joe/new-name.txt")
```

## Security

- **Firewall integration**: Write operations prompt for confirmation
- **Command executor**: CLI tools require user approval on first use
- **No shell**: All operations use safe command execution (no shell injection)

## Notes

- Use absolute paths (no `~` expansion without shell)
- Optional tools:
  - `tree` (`brew install tree`) - for tree view
  - `pdftotext` (`brew install poppler`) - for reading PDFs
  - `qpdf` (`brew install qpdf`) - for decrypting PDFs
