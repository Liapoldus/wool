import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../..", import.meta.url));

describe("Go module major version", () => {
  it("separates the breaking Go API from the stable peer.v1 wire contract", async () => {
    const goMod = await readFile(`${root}/go.mod`, "utf8");
    const makefile = await readFile(`${root}/Makefile`, "utf8");
    const proto = await readFile(`${root}/proto/liapoldus/peer/v1/peer.proto`, "utf8");
    const readme = await readFile(`${root}/README.md`, "utf8");
    const agents = await readFile(`${root}/AGENTS.md`, "utf8");
    const site = await readFile(`${root}/docs/site/wool/index.md`, "utf8");

    expect(goMod).toMatch(/^module github\.com\/Liapoldus\/wool\/v3$/m);
    expect(goMod).not.toContain("pluginprotocol");
    expect(goMod).not.toContain("service-sdk");
    expect(goMod).not.toContain("plugin-sdk");
    expect(makefile).toContain("MODULE := github.com/Liapoldus/wool/v3");
    expect(proto).toContain("github.com/Liapoldus/wool/v3/infrastructure/peer/wire;wire");
    expect(proto).toContain("package liapoldus.peer.v1;");
    expect(readme).toContain("module major `v3`");
    expect(readme).toContain("liapoldus.peer.v1");
    for (const [name, document] of [
      ["README", readme],
      ["AGENTS", agents],
      ["site overview", site],
    ] as const) {
      expect(document, `${name} must name the independent Service SDK module`).toContain(
        "github.com/Liapoldus/service-sdk/v2",
      );
      expect(
        document.replaceAll("StudioPlugins", ""),
        `${name} must use Services for runtime entities`,
      ).not.toMatch(/\bplugins?\b/i);
    }
  });

  it("uses Wool release artifacts and the canonical documentation route", async () => {
    const release = await readFile(`${root}/.github/workflows/release.yml`, "utf8");
    const site = await readFile(`${root}/docs/site/wool/index.md`, "utf8");
    const siteSources = await readdir(`${root}/docs/site`);
    expect(release).toContain('"wool-v3.*"');
    expect(release).toContain('artifact="wool-${version}.tar.gz"');
    expect(release).toContain('output-file: wool-${{ steps.release_version.outputs.version }}.sbom.spdx.json');
    expect(release).toContain('sbom="wool-${WOOL_VERSION}.sbom.spdx.json"');
    expect(release).not.toContain("pluginprotocol");
    expect(siteSources).toContain("wool");
    expect(siteSources).not.toContain("pluginprotocol");
    expect(site).toContain("# Liapoldus Wool");
    expect(site).toContain("[Карта breaking-перехода](/wool/migration)");
  });

  it("keeps the migration report's current ownership and consumers on service terminology", async () => {
    const siteMigration = await readFile(`${root}/docs/site/wool/migration.md`, "utf8");
    const ownership = siteMigration.split("## 1. Who owns what now")[1]?.split("## 2. Removed package paths")[0] ?? "";
    const consumers = siteMigration.split("## 4. Consumer status and handoff")[1]?.split("## 5. Verifying the removal")[0] ?? "";

    expect(ownership).toContain("`service-sdk/`");
    expect(ownership).toContain("Wool `presentation/peer`");
    expect(ownership).toContain("service that owns the product contract");
    expect(ownership).not.toContain("plugin-sdk");
    expect(ownership).not.toContain("pluginprotocol");
    expect(consumers).toContain("`services/server`");
    expect(consumers).toContain("`services/forms-db`");
    expect(consumers).not.toContain("`plugins/server`");
    expect(consumers).not.toContain("`plugins/forms-db`");
  });
});
