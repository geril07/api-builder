# Query parameters stored as JSONB on the endpoint row

Query parameters are stored as a JSONB array directly on the `endpoints` table (`query_params` column) rather than in a separate `query_parameters` table. This matches the existing pattern of `authSchemeIds` and `requestBody`/`responseShape`, avoiding a new table, service layer, and relation for data that is always loaded and mutated as a group alongside its parent endpoint. The app-level `QueryParamDto` type constrains the shape; DB-level enforcement provides marginal value for a single-user design tool.
