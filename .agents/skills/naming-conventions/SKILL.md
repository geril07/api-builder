---
name: naming-conventions
description: Enforces naming conventions for identifiers, exports, and file names based on location and export scope. Use when creating, renaming, or refactoring identifiers, exports, or file names.
---

# Naming Conventions

## Quick start

Names should reflect their scope. Use the shortest name that's clear in context. Add scope when code crosses a module boundary, or when a same-module cross-file name would be ambiguous at the import site.

For this skill, a module is a domain or package boundary, not just a file. A name crosses a module boundary when it is exported from a public module entrypoint, imported from another domain/module, or exposed to external consumers.

```ts
// Before: ambiguous cross-module export
export const schema = z.object({...})

// After: self-scoped, clear at the import site
export const userSchema = z.object({...})
```

## Workflows

### Rules

1. **Inside a file** — use the shortest clear name (no prefix)
2. **Across module boundaries** — exports must carry domain scope unless the name is already self-scoped
3. **Across file boundaries within the same module** — add a scope prefix only when the local name would be ambiguous at the import site
4. **Self-scoped names** don't need additional prefixes because they embed their domain directly. Common patterns:
   - **verb + domain**: `createUser`, `parseAuthToken`, `formatInvoiceTotal`
   - **domain + role/type**: `UserCard`, `InvoiceStatus`, `AuthToken`

Use casing appropriate to the identifier kind: `userSchema` for values/functions and `UserSchema` for components, classes, and types.

**Note:** Export names reflect domain scope, not filename casing. A file `dashboard.tsx` in the `home/` directory uses `Dashboard` locally and exports `HomeDashboard` when scope is needed — the name comes from the domain concept, not the kebab-case filename.

**Default exports** undermine naming conventions because they defer the name to every import site. Prefer named exports so the export site controls the canonical name.

### Decision Order

1. If the name is already self-scoped for the relevant domain, use it.
2. If it crosses a module boundary, add domain scope.
3. If it stays inside one file, use the shortest clear name.
4. If it crosses files within the same module, add scope only when the name would be ambiguous at the import site.

## Advanced features

### Common Mistakes

| Mistake                                                                       | Fix                                                                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Over-scoping local variables (`userUserName`)                                 | Drop scope that's implied by context                                              |
| Under-scoping cross-module exports (`schema` exported from `users/schema.ts`) | Add module context unless the name is already self-scoped (`userSchema`)          |
| Adding scope "just in case" across files within the same module               | Only add scope when a name would be ambiguous at the import site                  |
| Using type-based suffixes for everything (`UserType`, `UserInterface`)        | Only add type suffixes when it disambiguates from a value with the same base name |
| Prefixing by directory name instead of domain concept (`UsersDirSchema`)      | Use domain-relevant prefixes (`userSchema`), not filesystem-derived ones          |
| Default exports with no canonical name                                        | Prefer named exports so the export site controls the name                         |
