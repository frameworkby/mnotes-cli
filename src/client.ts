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
  };
}
