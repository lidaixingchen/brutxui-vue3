# Component Registry System

Brutx distributes React components through a **registry-based architecture**. Instead of installing one large npm package with every style and layout, users fetch the components they need directly into their local codebase.

---

## How it Works

Every component is defined as a static JSON file stored in `packages/registry/registry/[name].json`. 

When a user runs `npx brutx add [component]`, the CLI:
1. Resolves all dependencies and sub-components (`registryDependencies`) recursively using a DFS topological sort.
2. Fetches the JSON file from the GitHub remote registry (or reads it locally in offline mode).
3. Resolves import aliases (e.g., `@/lib/utils` and `@/components`) to match the user's custom workspace configuration.
4. Writes files to the local disk and triggers the project's package manager to install npm dependencies.

---

## Registry JSON Schema

Each registry item follows this TypeScript schema structure:

```json
{
  "name": "combobox",
  "type": "registry:ui",
  "dependencies": [
    "cmdk"
  ],
  "registryDependencies": [
    "button",
    "popover",
    "command"
  ],
  "files": [
    {
      "path": "components/ui/combobox.tsx",
      "content": "'use client';\n\nimport * as React from 'react';\n..."
    }
  ]
}
```

### Fields
- **`name`** *(string)*: Unique identifier of the component.
- **`type`** *(string)*: Type of registry item (usually `"registry:ui"`).
- **`dependencies`** *(string[])*: Third-party npm packages required by this component (e.g. `lucide-react`, `@radix-ui/react-slot`).
- **`registryDependencies`** *(string[])*: Other Brutx components required by this component.
- **`files`** *(Array)*: List of files to be written to the user's project, containing paths relative to the component alias and the raw file string content.

---

## Adding a New Component to the Registry

To add a new component dynamically:

1. Create your React component in `packages/ui/src/components/[name].tsx` or `packages/ui/src/components/ui/[name].tsx`.
2. Declare it inside the CLI `COMPONENTS` metadata constant within `packages/cli/src/lib/constants.ts`:
   ```typescript
   export const COMPONENTS = {
     // ...
     "new-component": {
       name: "new-component",
       dependencies: ["some-npm-package"]
     }
   }
   ```
3. Run the automated registry bundler script:
   ```bash
   pnpm --filter brutx-registry build
   ```
   This script will:
   - Read the template code.
   - Use regex to detect other Brutx components imported in the file and add them as `registryDependencies`.
   - Package everything into a static `.json` schema file inside `packages/registry/registry/`.
4. Commit your changes and push to GitHub. Once the registry is published, the component is available from the remote registry.
