import { describe, it, expect } from "vitest";
import { parseNoteIdsFromFile } from "../delete";

describe("parseNoteIdsFromFile", () => {
  it("parses LF-delimited note IDs", () => {
    const raw = "id-1\nid-2\nid-3\n";
    expect(parseNoteIdsFromFile(raw)).toEqual(["id-1", "id-2", "id-3"]);
  });

  it("handles CRLF line endings (Windows files / piped stdin)", () => {
    const raw = "id-1\r\nid-2\r\nid-3\r\n";
    expect(parseNoteIdsFromFile(raw)).toEqual(["id-1", "id-2", "id-3"]);
  });

  it("handles mixed line endings without leaking \\r into IDs", () => {
    const raw = "id-1\r\nid-2\nid-3\r\n";
    const ids = parseNoteIdsFromFile(raw);
    expect(ids).toEqual(["id-1", "id-2", "id-3"]);
    for (const id of ids) {
      expect(id).not.toContain("\r");
    }
  });

  it("skips blank lines and trims surrounding whitespace", () => {
    const raw = "  id-1  \r\n\r\n\tid-2\n   \n";
    expect(parseNoteIdsFromFile(raw)).toEqual(["id-1", "id-2"]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseNoteIdsFromFile("")).toEqual([]);
    expect(parseNoteIdsFromFile("\r\n\r\n")).toEqual([]);
  });
});
