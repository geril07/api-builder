When using `next/link` with a shadcn Base UI component that accepts a `render` prop (e.g. `BreadcrumbLink`), pass `href` inside the `render` element, not as a separate prop:

```tsx
// Good
<BreadcrumbLink render={<Link href="/dashboard" />}>
  API Designs
</BreadcrumbLink>

// Bad — TypeScript error (href required by Link)
<BreadcrumbLink render={<Link />} href="/dashboard">
  API Designs
</BreadcrumbLink>
```

This applies to any Base UI component using `useRender` where you need Next.js client-side navigation.
