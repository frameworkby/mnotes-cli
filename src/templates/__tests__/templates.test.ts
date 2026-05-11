import { describe, it, expect } from "vitest";
import { generateClaudeCodeTemplate } from "../claude-code";
import { generateCodexTemplate } from "../codex";
import { generateOpenClawTemplate } from "../openclaw";

const opts = { url: "http://localhost:3000", workspaceId: "ws-test-123" };

const claudeCode = generateClaudeCodeTemplate(opts);
const codex = generateCodexTemplate(opts);
const openclaw = generateOpenClawTemplate(opts);

// ============================================================
// claude-code.ts
// ============================================================

describe("generateClaudeCodeTemplate: version marker", () => {
  it("contains v7 marker", () => {
    expect(claudeCode).toContain("<!-- m-notes instructions v7 -->");
  });
});

describe("generateClaudeCodeTemplate: three layers", () => {
  it("names 'Raw sources' layer", () => {
    expect(claudeCode).toContain("Raw sources");
  });

  it("names 'The wiki' layer", () => {
    expect(claudeCode).toContain("The wiki");
  });

  it("names 'The schema' layer", () => {
    expect(claudeCode).toContain("The schema");
  });
});

describe("generateClaudeCodeTemplate: page-type enum", () => {
  it("includes 'concept' page type", () => {
    expect(claudeCode).toContain("`concept`");
  });

  it("includes 'entity' page type", () => {
    expect(claudeCode).toContain("`entity`");
  });

  it("includes 'source-summary' page type", () => {
    expect(claudeCode).toContain("`source-summary`");
  });

  it("includes 'comparison' page type", () => {
    expect(claudeCode).toContain("`comparison`");
  });

  it("includes 'overview' page type", () => {
    expect(claudeCode).toContain("`overview`");
  });
});

describe("generateClaudeCodeTemplate: frontmatter spec", () => {
  it("includes 'title' key", () => {
    expect(claudeCode).toContain("title:");
  });

  it("includes 'type' key", () => {
    expect(claudeCode).toContain("type:");
  });

  it("includes 'sources' key", () => {
    expect(claudeCode).toContain("sources:");
  });

  it("includes 'related' key", () => {
    expect(claudeCode).toContain("related:");
  });

  it("includes 'created' key", () => {
    expect(claudeCode).toContain("created:");
  });

  it("includes 'updated' key", () => {
    expect(claudeCode).toContain("updated:");
  });

  it("includes 'confidence' key", () => {
    expect(claudeCode).toContain("confidence:");
  });
});

describe("generateClaudeCodeTemplate: ingest loop benchmark", () => {
  it("specifies 10–15 pages benchmark", () => {
    expect(claudeCode).toContain("10–15");
  });

  it("calls out that a single source touches 10–15 pages, not 3", () => {
    expect(claudeCode).toMatch(/10.15 pages, not 3/);
  });
});

describe("generateClaudeCodeTemplate: query loop", () => {
  it("has a Query Loop section", () => {
    expect(claudeCode).toContain("Query Loop");
  });

  it("instructs filing answers back as notes", () => {
    expect(claudeCode).toMatch(/file.*back.*note|file it back as a new note/i);
  });

  it("references the compounding loop", () => {
    expect(claudeCode).toContain("compounding loop");
  });
});

describe("generateClaudeCodeTemplate: promotion rule", () => {
  it("mentions promotion after 3+ recalls", () => {
    expect(claudeCode).toContain("recalled 3+");
  });

  it("uses page-type vocabulary in promotion rule", () => {
    // Should mention at least one page type in the promotion context
    expect(claudeCode).toMatch(/concept.*entity|entity.*concept|source-summary/);
  });
});

describe("generateClaudeCodeTemplate: human/LLM division", () => {
  it("states human curates sources", () => {
    expect(claudeCode).toContain("human curates sources");
  });

  it("states agent does the grunt work", () => {
    expect(claudeCode).toContain("grunt work");
  });
});

describe("generateClaudeCodeTemplate: wiki log + index (preserved from v6)", () => {
  it("preserves wiki log append step in ingest loop", () => {
    expect(claudeCode).toContain("mnotes wiki log append");
  });

  it("preserves wiki index refresh step in ingest loop", () => {
    expect(claudeCode).toContain("mnotes wiki index refresh");
  });
});

describe("generateClaudeCodeTemplate: kb categories distinct from page types", () => {
  it("explicitly labels kb categories as fast-capture", () => {
    expect(claudeCode).toContain("fast-capture");
  });
});

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
