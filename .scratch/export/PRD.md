Status: done

# PRD: Export

## Problem Statement

Developers designing REST APIs inside API Builder need to take their modeled API Design and convert it into a standard artifact they can use in downstream tooling — editors, code generators, CI pipelines, and documentation platforms.

## Solution

Export an API Design to OpenAPI (YAML and JSON). The generated artifact is displayed inline in the product for inspection, with copy and download actions to move it into external workflows.

## User Stories

1. As an API designer, I want to export my API Design as an OpenAPI YAML file, so that I can use it in code generation tools.
2. As an API designer, I want to export my API Design as an OpenAPI JSON file, so that I can integrate it with JSON-based tooling.
3. As an API designer, I want to see the generated OpenAPI output before copying or downloading it, so that I can verify it matches my design.
4. As an API designer, I want to copy the generated OpenAPI to my clipboard, so that I can paste it into another editor or platform.
5. As an API designer, I want to download the generated OpenAPI as a file, so that I can commit it to version control or upload it to a gateway.
6. As an API designer, I want the export action to be prominently accessible from the API Design editor, so that I don't have to hunt for it.

## Implementation Decisions

- Export converts the API Design's Resources and Endpoints into a valid OpenAPI 3.x specification.
- Both YAML and JSON output formats are supported.
- The generated artifact is shown in a read-only preview panel, separate from the editable canvas.
- Copy action copies the full output to the system clipboard.
- Download action triggers a file download with the appropriate file extension (`.yaml` or `.json`).
- Export uses "Export API design" as the user-facing label (not "Export design") to clarify it applies to the full artifact.

## Testing Decisions

- Test export triggers from the API Design editor.
- Test that generated OpenAPI includes all modeled Resources and Endpoints with correct structure.
- Test both YAML and JSON output formats produce valid OpenAPI specs.
- Test that the output is visible in the UI before copy/download.
- Test copy action places correct content on the clipboard.
- Test download action produces a file with correct content and extension.
- Tests should validate the output spec against OpenAPI schema, not just string matching.

## Out of Scope

- Postman collection export.
- cURL snippet export.
- TypeScript client library generation.
- Hosted public API documentation site.
- Automated deployment to API gateways.
- Export customization (selecting which Resources/Endpoints to include).
- Scheduled or automated exports.

## Further Notes

- Export actions should have stronger visual weight than routine edit actions to signal importance.
- The generated output preview must be clearly read-only and visually separated from the editable canvas.
- Consider adding a "Copy" button and "Download" button as sibling actions on the export panel.
