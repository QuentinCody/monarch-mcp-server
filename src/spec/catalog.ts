import type { ApiCatalog } from "@bio-mcp/shared/codemode/catalog";

export const monarchCatalog: ApiCatalog = {
    name: "Monarch Initiative API v3",
    baseUrl: "https://api.monarchinitiative.org/v3/api",
    version: "3.0",
    auth: "none",
    endpointCount: 10,
    notes:
        "- Cross-species gene-phenotype-disease knowledge graph\n" +
        "- Integrates OMIM, HPO, MONDO, ClinGen, MGI, ZFIN, WormBase, FlyBase\n" +
        "- No auth required, JSON responses\n" +
        "- Entity IDs use CURIEs (e.g. HGNC:1100, MONDO:0007254, HP:0001250)\n" +
        "- Offset/limit pagination (default limit 20, max 500)\n" +
        "- Code Mode only — use monarch_search + monarch_execute for all queries\n" +
        "\n" +
        "ASSOCIATION CATEGORIES (Monarch v3 biolink model):\n" +
        "  Gene→Disease: biolink:CausalGeneToDiseaseAssociation, biolink:CorrelatedGeneToDiseaseAssociation\n" +
        "  Gene→Phenotype: biolink:GeneToPhenotypicFeatureAssociation\n" +
        "  Disease→Phenotype: biolink:DiseaseToPhenotypicFeatureAssociation\n" +
        "  Gene→Gene (orthologs): biolink:GeneToGeneHomologyAssociation\n" +
        "  WARNING: 'biolink:GeneToDiseaseAssociation' does NOT work in v3 — use Causal or Correlated variants above\n" +
        "\n" +
        "COMMON WORKFLOWS:\n" +
        "  Gene profile: /search?q=DPYD&category=biolink:Gene → get CURIE → /entity/{curie} for details\n" +
        "  Gene→phenotypes: /association?subject=HGNC:3012&category=biolink:GeneToPhenotypicFeatureAssociation\n" +
        "  Gene→diseases: /association?subject=HGNC:3012&category=biolink:CausalGeneToDiseaseAssociation\n" +
        "  Disease→phenotypes: /association?subject=MONDO:0010130&category=biolink:DiseaseToPhenotypicFeatureAssociation\n" +
        "  Orthologs: /association?subject=HGNC:3012&category=biolink:GeneToGeneHomologyAssociation",
    endpoints: [
        // Associations
        {
            method: "GET",
            path: "/association",
            summary: "Search associations between genes, diseases, phenotypes with evidence. Core endpoint.",
            category: "associations",
            queryParams: [
                { name: "category", type: "string", required: false, description: "Association category. IMPORTANT: Use biolink:CausalGeneToDiseaseAssociation or biolink:CorrelatedGeneToDiseaseAssociation for gene-disease (NOT biolink:GeneToDiseaseAssociation which returns 422). Other valid: biolink:GeneToPhenotypicFeatureAssociation, biolink:DiseaseToPhenotypicFeatureAssociation, biolink:GeneToGeneHomologyAssociation" },
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
            queryParams: [
                { name: "id", type: "string", required: true, description: "Comma-separated phenotype CURIEs (e.g. HP:0001250,HP:0001263)" },
                { name: "limit", type: "number", required: false, description: "Max results" },
            ],
        },
        // Association counts — NOTE: This endpoint may return 404 in some Monarch v3 deployments.
        // If it fails, use /association with category filters and count the results instead.
        {
            method: "GET",
            path: "/association/counts",
            summary: "Get counts of associations by category for an entity. NOTE: May return 404 — if so, query /association with limit=1 per category to get totals from the response metadata.",
            category: "associations",
            queryParams: [
                { name: "entity", type: "string", required: true, description: "Entity CURIE" },
            ],
        },
        // In Monarch v3, use /association with subject/object/category filters for gene queries.
        // The /bioentity endpoints are deprecated in v3.
        // Example: gene→disease = /association?subject=HGNC:1100&category=biolink:CausalGeneToDiseaseAssociation
        // Example: gene→phenotypes = /association?subject=HGNC:1100&category=biolink:GeneToPhenotypicFeatureAssociation
        // Example: gene→orthologs = /association?subject=HGNC:1100&category=biolink:GeneToGeneHomologyAssociation
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
