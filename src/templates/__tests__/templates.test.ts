import { describe, it, expect } from "vitest";
import { generateCodexTemplate } from "../codex";
import { generateOpenClawTemplate } from "../openclaw";

const opts = { url: "http://localhost:3000", workspaceId: "ws-test-123" };

const codex = generateCodexTemplate(opts);
const openclaw = generateOpenClawTemplate(opts);

// ============================================================
// codex.ts
// ============================================================

describe("generateCodexTemplate: version marker", () => {
  it("contains v7 marker", () => {
    expect(codex).toContain("<!-- m-notes instructions v7 -->");
  });
});

describe("generateCodexTemplate: three layers", () => {
  it("names all three layers", () => {
    expect(codex).toContain("Raw sources");
    expect(codex).toContain("The wiki");
    expect(codex).toContain("The schema");
  });
});

describe("generateCodexTemplate: page-type enum", () => {
  it("includes all five page types", () => {
    expect(codex).toContain("concept");
    expect(codex).toContain("entity");
    expect(codex).toContain("source-summary");
    expect(codex).toContain("comparison");
    expect(codex).toContain("overview");
  });
});

describe("generateCodexTemplate: frontmatter keys", () => {
  it("includes all required frontmatter keys", () => {
    expect(codex).toContain("title:");
    expect(codex).toContain("type:");
    expect(codex).toContain("sources:");
    expect(codex).toContain("related:");
    expect(codex).toContain("created:");
    expect(codex).toContain("updated:");
    expect(codex).toContain("confidence:");
  });
});

describe("generateCodexTemplate: ingest loop benchmark", () => {
  it("specifies 10–15 pages", () => {
    expect(codex).toContain("10–15");
  });
});

describe("generateCodexTemplate: query loop", () => {
  it("mentions filing answers back as notes", () => {
    expect(codex).toMatch(/file.*back.*note|file it back as a new note/i);
  });

  it("references the compounding loop", () => {
    expect(codex).toContain("compounding loop");
  });
});

describe("generateCodexTemplate: promotion rule with page-type vocabulary", () => {
  it("references page-type vocabulary in promotion context", () => {
    expect(codex).toMatch(/concept|entity|source-summary/);
    expect(codex).toContain("recalled 3+");
  });
});

describe("generateCodexTemplate: human/LLM division", () => {
  it("mentions grunt work", () => {
    expect(codex).toContain("grunt work");
  });
});

// ============================================================
// openclaw.ts
// ============================================================

describe("generateOpenClawTemplate: version marker", () => {
  it("contains v7 marker", () => {
    expect(openclaw).toContain("<!-- m-notes instructions v7 -->");
  });
});

describe("generateOpenClawTemplate: three layers", () => {
  it("names all three layers", () => {
    expect(openclaw).toContain("Raw sources");
    expect(openclaw).toContain("The wiki");
    expect(openclaw).toContain("The schema");
  });
});

describe("generateOpenClawTemplate: page-type enum", () => {
  it("includes all five page types", () => {
    expect(openclaw).toContain("concept");
    expect(openclaw).toContain("entity");
    expect(openclaw).toContain("source-summary");
    expect(openclaw).toContain("comparison");
    expect(openclaw).toContain("overview");
  });
});

describe("generateOpenClawTemplate: frontmatter keys", () => {
  it("includes all required frontmatter keys", () => {
    expect(openclaw).toContain("title:");
    expect(openclaw).toContain("type:");
    expect(openclaw).toContain("sources:");
    expect(openclaw).toContain("related:");
    expect(openclaw).toContain("created:");
    expect(openclaw).toContain("updated:");
    expect(openclaw).toContain("confidence:");
  });
});

describe("generateOpenClawTemplate: ingest loop benchmark", () => {
  it("specifies 10–15 pages", () => {
    expect(openclaw).toContain("10–15");
  });
});

describe("generateOpenClawTemplate: query loop", () => {
  it("mentions filing answers back as notes", () => {
    expect(openclaw).toMatch(/file.*back.*note|file it back as a new note/i);
  });

  it("references the compounding loop", () => {
    expect(openclaw).toContain("compounding loop");
  });
});

describe("generateOpenClawTemplate: promotion rule with page-type vocabulary", () => {
  it("references page-type vocabulary in promotion context", () => {
    expect(openclaw).toMatch(/concept|entity|source-summary/);
    expect(openclaw).toContain("recalled 3+");
  });
});

describe("generateOpenClawTemplate: human/LLM division", () => {
  it("mentions grunt work", () => {
    expect(openclaw).toContain("grunt work");
  });
});
