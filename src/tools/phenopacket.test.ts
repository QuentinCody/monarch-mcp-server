import { describe, expect, it } from "vitest";
import { validatePhenopacket } from "@bio-mcp/shared/phenopacket/phenopacket";
import { buildPacket } from "./phenopacket";

const CREATED = "2026-08-04T12:00:00Z";

describe("buildPacket", () => {
	it("produces a packet that passes structural validation", () => {
		const packet = buildPacket(
			{
				id: "case-1",
				subject_id: "patient-1",
				sex: "FEMALE",
				phenotype_terms: [{ id: "HP:0001250", label: "Seizure" }],
				disease_terms: [{ id: "MONDO:0005027", label: "epilepsy" }],
			},
			CREATED,
		);
		expect(validatePhenopacket(packet)).toEqual([]);
	});

	it("declares every ontology the terms reference", () => {
		const packet = buildPacket(
			{
				id: "case-2",
				phenotype_terms: [{ id: "HP:0001250" }],
				disease_terms: [{ id: "OMIM:143100" }],
			},
			CREATED,
		);
		expect(packet.metaData.resources.map((r) => r.namespacePrefix)).toEqual([
			"HP",
			"OMIM",
		]);
	});

	it("attributes the packet to this server", () => {
		expect(buildPacket({ id: "c" }, CREATED).metaData.createdBy).toBe(
			"monarch-mcp-server",
		);
	});

	it("carries the subject and sex through", () => {
		const packet = buildPacket(
			{ id: "c", subject_id: "p1", sex: "MALE" },
			CREATED,
		);
		expect(packet.subject).toEqual({ id: "p1", sex: "MALE" });
	});

	it("omits the subject entirely when no subject id was given", () => {
		expect(buildPacket({ id: "c" }, CREATED).subject).toBeUndefined();
	});

	it("preserves an excluded phenotype rather than dropping it", () => {
		const packet = buildPacket(
			{ id: "c", phenotype_terms: [{ id: "HP:0001250", excluded: true }] },
			CREATED,
		);
		expect(packet.phenotypicFeatures?.[0].excluded).toBe(true);
	});

	it("omits a label key when no label was supplied", () => {
		const packet = buildPacket(
			{ id: "c", phenotype_terms: [{ id: "HP:0001250" }] },
			CREATED,
		);
		expect(packet.phenotypicFeatures?.[0].type).toEqual({ id: "HP:0001250" });
	});

	it("applies supplied ontology versions", () => {
		const packet = buildPacket(
			{
				id: "c",
				phenotype_terms: [{ id: "HP:0001250" }],
				ontology_versions: [{ prefix: "HP", version: "2024-04-26" }],
			},
			CREATED,
		);
		expect(packet.metaData.resources[0].version).toBe("2024-04-26");
	});

	it("refuses a term from an ontology it cannot declare", () => {
		expect(() =>
			buildPacket({ id: "c", phenotype_terms: [{ id: "WAT:1" }] }, CREATED),
		).toThrow(/must declare every ontology/);
	});
});
