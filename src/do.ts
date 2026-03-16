import { RestStagingDO } from "@bio-mcp/shared/staging/rest-staging-do";
import type { SchemaHints } from "@bio-mcp/shared/staging/schema-inference";

export class MonarchDataDO extends RestStagingDO {
    protected getSchemaHints(data: unknown): SchemaHints | undefined {
        if (!data || typeof data !== "object") return undefined;

        const obj = data as Record<string, unknown>;

        // Association results
        if (Array.isArray(obj.items) || Array.isArray(obj.associations)) {
            const items = (obj.items || obj.associations) as Record<string, unknown>[];
            if (items.length > 0) {
                const sample = items[0];
                if (sample && ("subject" in sample || "predicate" in sample || "category" in sample)) {
                    return {
                        tableName: "associations",
                        indexes: ["category", "predicate"],
                    };
                }
            }
        }

        // Entity search results
        if (Array.isArray(obj.items)) {
            const items = obj.items as Record<string, unknown>[];
            if (items.length > 0 && items[0] && "id" in items[0] && "name" in items[0]) {
                return {
                    tableName: "entities",
                    indexes: ["id", "name", "category"],
                };
            }
        }

        // Similarity results
        if (Array.isArray(data)) {
            const sample = (data as Record<string, unknown>[])[0];
            if (sample && ("score" in sample || "similarity" in sample)) {
                return {
                    tableName: "similarity_results",
                    indexes: ["score"],
                };
            }
        }

        return undefined;
    }
}
