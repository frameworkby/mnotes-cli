export interface NoteListItem {
  id: string;
  title: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface FolderListItem {
  id: string;
  name: string;
  parentId: string | null;
  isRoot: boolean;
  noteCount: number;
}

export interface FolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  isRoot: boolean;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentNoteItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  tags: string[];
  folder: { id: string; name: string } | null;
}

export interface TaggedNoteItem {
  id: string;
  title: string;
  tags: string[];
  folder: { id: string; name: string | null } | null;
  updatedAt: string;
}

export interface UploadResult {
  embed: string;
  fileUrl: string;
  key: string;
  warning?: string;
}

export function createClient(baseUrl: string, apiKey: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  return {
    async listNotes(opts?: {
      workspaceId?: string;
      folderId?: string;
      cursor?: string;
      limit?: number;
    }): Promise<PaginatedResponse<NoteListItem>> {
      const params = new URLSearchParams();
      if (opts?.workspaceId) params.set("workspaceId", opts.workspaceId);
      if (opts?.folderId) params.set("folderId", opts.folderId);
      if (opts?.cursor) params.set("cursor", opts.cursor);
      if (opts?.limit) params.set("limit", String(opts.limit));
      const qs = params.toString();
      return request<PaginatedResponse<NoteListItem>>(
        "GET",
        `/api/v1/notes${qs ? `?${qs}` : ""}`
      );
    },

    async getNote(id: string): Promise<{ data: Note }> {
      return request<{ data: Note }>("GET", `/api/v1/notes/${encodeURIComponent(id)}`);
    },

    async searchNotes(opts: {
      query: string;
      mode?: "fulltext" | "semantic";
      workspaceId?: string;
    }): Promise<{ data: { results: SearchResult[] } }> {
      return request<{ data: { results: SearchResult[] } }>("POST", "/api/v1/notes/search", opts);
    },

    async createNote(opts: {
      title: string;
      content?: string;
      folderId?: string;
      workspaceId?: string;
    }): Promise<{ data: { id: string; title: string } }> {
      return request<{ data: { id: string; title: string } }>(
        "POST",
        "/api/v1/notes",
        opts
      );
    },

    async updateNote(
      id: string,
      opts: { title?: string; content?: string }
    ): Promise<{ data: { id: string; title: string } }> {
      return request<{ data: { id: string; title: string } }>(
        "PUT",
        `/api/v1/notes/${encodeURIComponent(id)}`,
        opts
      );
    },

    async deleteNote(id: string): Promise<{ data: { id: string } }> {
      return request<{ data: { id: string } }>(
        "DELETE",
        `/api/v1/notes/${encodeURIComponent(id)}`
      );
    },

    async listWorkspaces(): Promise<{
      data: Array<{
        id: string;
        name: string;
        slug: string;
        isDefault: boolean;
      }>;
    }> {
      return request<{
        data: Array<{
          id: string;
          name: string;
          slug: string;
          isDefault: boolean;
        }>;
      }>("GET", "/api/v1/workspaces");
    },

    async recallKnowledge(opts: {
      query: string;
      workspaceId?: string;
      tags?: string[];
      limit?: number;
    }): Promise<{
      data: {
        results: Array<{
          id: string;
          title: string;
          key: string | null;
          excerpt: string;
          importance: number | null;
          tags: string[];
          semanticScore: number;
          freshnessScore: number;
          finalScore: number;
        }>;
      };
    }> {
      return request("POST", "/api/v1/knowledge/recall", {
        query: opts.query,
        workspaceId: opts.workspaceId,
        tags: opts.tags,
        limit: opts.limit,
      });
    },

    async queryGraph(opts?: {
      workspaceId?: string;
      query?: string;
      nodeType?: string;
      neighbors?: string;
      depth?: number;
      limit?: number;
    }): Promise<{
      data: {
        nodes: Array<{
          id: string;
          noteId: string | null;
          label: string;
          nodeType: string;
          depth?: number;
        }>;
        edges: Array<{
          id: string;
          sourceId: string;
          targetId: string;
          edgeType: string;
          weight: number;
        }>;
      };
    }> {
      const params = new URLSearchParams();
      if (opts?.workspaceId) params.set("workspaceId", opts.workspaceId);
      if (opts?.query) params.set("query", opts.query);
      if (opts?.nodeType) params.set("nodeType", opts.nodeType);
      if (opts?.neighbors) params.set("neighbors", opts.neighbors);
      if (opts?.depth) params.set("depth", String(opts.depth));
      if (opts?.limit) params.set("limit", String(opts.limit));
      const qs = params.toString();
      return request("GET", `/api/v1/graph${qs ? `?${qs}` : ""}`);
    },

    // ── Folders ────────────────────────────────────────────────────────

    async listFolders(opts: {
      workspaceId: string;
      cursor?: string;
      limit?: number;
    }): Promise<{ folders: FolderListItem[]; nextCursor: string | null }> {
      const params = new URLSearchParams();
      params.set("workspaceId", opts.workspaceId);
      if (opts.cursor) params.set("cursor", opts.cursor);
      if (opts.limit) params.set("limit", String(opts.limit));
      return request<{ folders: FolderListItem[]; nextCursor: string | null }>(
        "GET",
        `/api/v1/folders?${params.toString()}`,
      );
    },

    async getWorkspaceSummary(workspaceId: string): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId });
      return request<unknown>("GET", `/api/v1/folders/summary?${params.toString()}`);
    },

    async createFolder(opts: {
      name: string;
      parentId?: string;
      workspaceId: string;
    }): Promise<FolderRecord> {
      return request<FolderRecord>("POST", "/api/v1/folders", opts);
    },

    async renameFolder(id: string, name: string): Promise<FolderRecord> {
      return request<FolderRecord>(
        "PATCH",
        `/api/v1/folders/${encodeURIComponent(id)}`,
        { name },
      );
    },

    async deleteFolder(id: string): Promise<{ deleted: string }> {
      return request<{ deleted: string }>(
        "DELETE",
        `/api/v1/folders/${encodeURIComponent(id)}`,
      );
    },

    async moveFolder(id: string, parentId: string | null): Promise<FolderRecord> {
      return request<FolderRecord>(
        "POST",
        `/api/v1/folders/${encodeURIComponent(id)}/move`,
        { parentId },
      );
    },

    async getRecentNotes(opts: {
      since: string;
      workspaceId: string;
      limit?: number;
    }): Promise<RecentNoteItem[]> {
      const params = new URLSearchParams();
      params.set("since", opts.since);
      params.set("workspaceId", opts.workspaceId);
      if (opts.limit) params.set("limit", String(opts.limit));
      return request<RecentNoteItem[]>(
        "GET",
        `/api/v1/notes/recent?${params.toString()}`,
      );
    },

    async searchByTags(opts: {
      tags: string[];
      workspaceId: string;
      match?: "any" | "all";
      limit?: number;
    }): Promise<TaggedNoteItem[]> {
      const params = new URLSearchParams();
      // Send repeated `tags` params for clarity; the API accepts both repeated
      // and CSV forms. Repeated is unambiguous when tag values themselves
      // contain commas.
      for (const t of opts.tags) params.append("tags", t);
      params.set("workspaceId", opts.workspaceId);
      if (opts.match) params.set("match", opts.match);
      if (opts.limit) params.set("limit", String(opts.limit));
      return request<TaggedNoteItem[]>(
        "GET",
        `/api/v1/notes/search-by-tags?${params.toString()}`,
      );
    },

    async uploadFile(opts: {
      filename: string;
      content: string;
      mimeType: string;
      noteId?: string;
    }): Promise<UploadResult> {
      return request<UploadResult>("POST", "/api/v1/files", opts);
    },

    async createWorkspace(name: string): Promise<{
      data: {
        id: string;
        name: string;
        slug: string;
        isDefault: boolean;
      };
    }> {
      return request<{
        data: {
          id: string;
          name: string;
          slug: string;
          isDefault: boolean;
        };
      }>("POST", "/api/v1/workspaces", { name });
    },
  };
}
