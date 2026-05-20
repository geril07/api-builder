# i18n: no dots in translation keys

next-intl uses `.` as the namespace nesting separator. A key like `"entityType.resource"` is interpreted as `{ entityType: { resource: "..." } }` and raises `INVALID_KEY`.

## Problem

```json
{
  "Editor": {
    "entityType.resource": "resource"
  }
}
```

## Fix

Use a nested object instead:

```json
{
  "Editor": {
    "entityType": {
      "resource": "resource"
    }
  }
}
```

Access still uses the dotted path — `t('entityType.resource')` — but the JSON must nest the object.
