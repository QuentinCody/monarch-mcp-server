import type { ApiCatalog } from "@bio-mcp/shared/codemode/catalog";

export const monarchCatalog: ApiCatalog = {
    name: "Monarch Initiative API v3",
    baseUrl: "https://api.monarchinitiative.org/v3/api",
    version: "3.0",
    auth: "none",
    endpointCount: 20,
    notes:
        "- Cross-species gene-phenotype-disease knowledge graph\n" +
        "- Integrates OMIM, HPO, MONDO, ClinGen, MGI, ZFIN, WormBase, FlyBase\n" +
        "- No auth required, JSON responses\n" +
        "- Association categories use biolink model (e.g. biolink:GeneToPhenotypicFeatureAssociation)\n" +
        "- Entity IDs use CURIEs (e.g. HGNC:1100, MONDO:0007254, HP:0001250)\n" +
        "- Offset/limit pagination (default limit 20, max 500)\n" +
        "- For association queries, prefer monarch_association_search hand-built tool\n" +
        "- For entity details, prefer monarch_entity_lookup hand-built tool",
    endpoints: [
        // Associations
        {
            method: "GET",
            path: "/association",
            summary: "Search associations between genes, diseases, phenotypes with evidence. Core endpoint.",
            category: "associations",
            coveredByTool: "monarch_association_search",
            queryParams: [
                { name: "category", type: "string", required: false, description: "Association category (e.g. biolink:GeneToPhenotypicFeatureAssociation, biolink:DiseaseToPhenotypicFeatureAssociation, biolink:GeneToDiseaseAssociation)" },
                { name: "subject", type: "string", required: false, description: "Subject CURIE (e.g. HGNC:1100)" },
                { name: "object", type: "string", required: false, description: "Object CURIE (e.g. HP:0001250)" },
                { name: "predicate", type: "string", required: false, description: "Predicate filter (e.g. biolink:has_phenotype)" },
                { name: "subject_category", type: "string", required: false, description: "Subject category (e.g. biolink:Gene)" },
                { name: "object_category", type: "string", required: false, description: "Object category (e.g. biolink:PhenotypicFeature)" },
                { name: "limit", type: "number", required: false, description: "Results per page (default 20, max 500)" },
                { name: "offset", type: "number", required: false, description: "Offset for pagination" },
            ],
        },
        // Entity
        {
            method: "GET",
            path: "/entity/{id}",
            summary: "Get detailed entity information by CURIE (gene, disease, phenotype, etc.)",
            category: "entities",
            coveredByTool: "monarch_entity_lookup",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Entity CURIE (e.g. HGNC:1100, MONDO:0007254, HP:0001250)" },
            ],
        },
        // Search
        {
            method: "GET",
            path: "/search",
            summary: "Full-text search across all entities (genes, diseases, phenotypes)",
            category: "search",
            queryParams: [
                { name: "q", type: "string", required: true, description: "Search query" },
                { name: "category", type: "string", required: false, description: "Filter by entity category (e.g. biolink:Gene, biolink:Disease)" },
                { name: "limit", type: "number", required: false, description: "Max results (default 20)" },
                { name: "offset", type: "number", required: false, description: "Offset for pagination" },
            ],
        },
        // Similarity / Phenotype Comparison
        {
            method: "GET",
            path: "/sim/search",
            summary: "Search for similar entities based on phenotype profiles (cross-species phenotype comparison)",
            category: "similarity",
            coveredByTool: "monarch_phenotype_similarity",
            queryParams: [
                { name: "id", type: "string", required: true, description: "Comma-separated phenotype CURIEs (e.g. HP:0001250,HP:0001263)" },
                { name: "limit", type: "number", required: false, description: "Max results" },
            ],
        },
        // Association counts
        {
            method: "GET",
            path: "/association/counts",
            summary: "Get counts of associations by category for an entity",
            category: "associations",
            queryParams: [
                { name: "entity", type: "string", required: true, description: "Entity CURIE" },
            ],
        },
        // Gene-specific
        {
            method: "GET",
            path: "/bioentity/gene/{id}",
            summary: "Get gene-specific information including orthologs and function",
            category: "genes",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Gene CURIE (e.g. HGNC:1100)" },
            ],
        },
        {
            method: "GET",
            path: "/bioentity/gene/{id}/phenotypes",
            summary: "Get phenotypes associated with a gene",
            category: "genes",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Gene CURIE" },
            ],
            queryParams: [
                { name: "limit", type: "number", required: false, description: "Max results" },
            ],
        },
        {
            method: "GET",
            path: "/bioentity/gene/{id}/diseases",
            summary: "Get diseases associated with a gene",
            category: "genes",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Gene CURIE" },
            ],
            queryParams: [
                { name: "limit", type: "number", required: false, description: "Max results" },
            ],
        },
        // Disease-specific
        {
            method: "GET",
            path: "/bioentity/disease/{id}",
            summary: "Get disease-specific information",
            category: "diseases",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Disease CURIE (e.g. MONDO:0007254)" },
            ],
        },
        {
            method: "GET",
            path: "/bioentity/disease/{id}/genes",
            summary: "Get genes associated with a disease",
            category: "diseases",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Disease CURIE" },
            ],
            queryParams: [
                { name: "limit", type: "number", required: false, description: "Max results" },
            ],
        },
        {
            method: "GET",
            path: "/bioentity/disease/{id}/phenotypes",
            summary: "Get phenotypes associated with a disease",
            category: "diseases",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Disease CURIE" },
            ],
        },
        // Phenotype-specific
        {
            method: "GET",
            path: "/bioentity/phenotype/{id}",
            summary: "Get phenotype-specific information",
            category: "phenotypes",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Phenotype CURIE (e.g. HP:0001250)" },
            ],
        },
        {
            method: "GET",
            path: "/bioentity/phenotype/{id}/genes",
            summary: "Get genes associated with a phenotype",
            category: "phenotypes",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Phenotype CURIE" },
            ],
        },
        // Mapping/Resolution
        {
            method: "GET",
            path: "/entity/{id}/mappings",
            summary: "Get cross-reference mappings for an entity",
            category: "mappings",
            pathParams: [
                { name: "id", type: "string", required: true, description: "Entity CURIE" },
            ],
        },
        // Autocomplete
        {
            method: "GET",
            path: "/autocomplete",
            summary: "Autocomplete entity names (for search UI)",
            category: "search",
            queryParams: [
                { name: "q", type: "string", required: true, description: "Partial search query" },
            ],
        },
    ],
};
