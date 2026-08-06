/**
 * Emit a GA4GH Phenopacket from Monarch/HPO phenotype work.
 *
 * Monarch results are ad-hoc JSON that only this fleet understands. A
 * Phenopacket is the standard container for the same phenotype + disease
 * content, so a result can be handed to external clinical tooling directly.
 */
import type { McpServer } from "@bio-mcp/shared/mcp";
import {
	type Phenopacket,
	PhenopacketError,
	toPhenopacket,
	validatePhenopacket,
} from "@bio-mcp/shared/phenopacket/phenopacket";
import { z } from "zod";

const ontologyTermSchema = z.object({
	id: z
		.string()
		.min(1)
		.describe("CURIE, e.g. 'HP:0001250' or 'MONDO:0005027'."),
	label: z.string().optional().describe("Human-readable term label."),
});

const phenotypeSchema = ontologyTermSchema.extend({
	excluded: z
		.boolean()
		.optional()
		.describe("True when the feature was explicitly ruled out."),
});

type OntologyTermInput = z.infer<typeof ontologyTermSchema>;
type PhenotypeInput = z.infer<typeof phenotypeSchema>;

interface PhenopacketArgs {
	id: string;
	subject_id?: string;
	sex?: "MALE" | "FEMALE" | "OTHER_SEX" | "UNKNOWN_SEX";
	phenotype_terms?: PhenotypeInput[];
	disease_terms?: OntologyTermInput[];
	ontology_versions?: { prefix: string; version: string }[];
}

function versionsByPrefix(
	entries: { prefix: string; version: string }[] | undefined,
): Record<string, string> | undefined {
	if (!entries?.length) return undefined;
	const byPrefix: Record<string, string> = {};
	for (const entry of entries) byPrefix[entry.prefix] = entry.version;
	return byPrefix;
}

function toTerm(term: OntologyTermInput) {
	return { id: term.id, ...(term.label ? { label: term.label } : {}) };
}

export function buildPacket(args: PhenopacketArgs, created: string): Phenopacket {
	return toPhenopacket({
		id: args.id,
		created,
		createdBy: "monarch-mcp-server",
		...(args.subject_id
			? {
					subject: {
						id: args.subject_id,
						...(args.sex ? { sex: args.sex } : {}),
					},
				}
			: {}),
		phenotypicFeatures: (args.phenotype_terms ?? []).map((term) => ({
			type: toTerm(term),
			...(term.excluded === undefined ? {} : { excluded: term.excluded }),
		})),
		diseases: (args.disease_terms ?? []).map((term) => ({ term: toTerm(term) })),
		...(versionsByPrefix(args.ontology_versions)
			? { ontologyVersions: versionsByPrefix(args.ontology_versions) }
			: {}),
	});
}

export function registerPhenopacket(server: McpServer): void {
	const definition = {
		title: "Build a GA4GH Phenopacket",
		description:
			"Assemble phenotype and disease terms into a GA4GH Phenopacket v2 document — the standard " +
			"interchange format for clinical phenotype data. Every ontology referenced (HP, MONDO, OMIM, " +
			"ORPHA, …) is automatically declared in metaData.resources, which is what makes the CURIEs " +
			"resolvable by an external consumer. Use this when handing phenotype findings to tooling " +
			"outside this fleet.",
		inputSchema: {
			id: z.string().min(1).describe("Identifier for this phenopacket."),
			subject_id: z.string().optional().describe("Identifier for the subject."),
			sex: z
				.enum(["MALE", "FEMALE", "OTHER_SEX", "UNKNOWN_SEX"])
				.optional()
				.describe("Subject sex, using the Phenopacket vocabulary."),
			phenotype_terms: z
				.array(phenotypeSchema)
				.optional()
				.describe("Phenotypic features, normally HPO terms."),
			disease_terms: z
				.array(ontologyTermSchema)
				.optional()
				.describe("Diagnosed diseases, normally MONDO / OMIM / ORPHA terms."),
			// An array, not z.record: under zod v4 a record input schema fails to
			// serialize into JSON Schema, and the MCP server drops the whole tool
			// from tools/list without erroring — it registers and is then invisible.
			ontology_versions: z
				.array(
					z.object({
						prefix: z.string().describe("CURIE prefix, e.g. 'HP'."),
						version: z.string().describe("Ontology version, e.g. '2024-04-26'."),
					}),
				)
				.optional()
				.describe("Ontology versions, one entry per CURIE prefix."),
		},
	};

	const invoke = async (args: Record<string, unknown>) => {
		const typed = args as unknown as PhenopacketArgs;
		try {
			const packet = buildPacket(typed, new Date().toISOString());
			const problems = validatePhenopacket(packet);
			if (problems.length > 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error: invalid phenopacket — ${problems.join("; ")}`,
						},
					],
					structuredContent: {
						success: false,
						error: {
							code: "INVALID_PHENOPACKET",
							message: problems.join("; "),
						},
					},
					isError: true,
				};
			}
			const ontologies = packet.metaData.resources
				.map((resource) => resource.namespacePrefix)
				.join(", ");
			return {
				content: [
					{
						type: "text" as const,
						text: `Phenopacket ${packet.id}: ${packet.phenotypicFeatures?.length ?? 0} phenotypic feature(s), ${packet.diseases?.length ?? 0} disease(s), ontologies declared: ${ontologies || "none"}.`,
					},
				],
				structuredContent: { success: true, data: packet, _meta: {} },
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const code =
				error instanceof PhenopacketError ? error.code : "PHENOPACKET_FAILED";
			return {
				content: [{ type: "text" as const, text: `Error: ${message}` }],
				structuredContent: { success: false, error: { code, message } },
				isError: true,
			};
		}
	};

	server.registerTool("mcp_monarch_phenopacket", definition, invoke);
	server.registerTool("monarch_phenopacket", definition, invoke);
}
