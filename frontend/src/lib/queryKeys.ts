export const queryKeys = {
  visits: {
    all: ['visits'] as const,
    list: (pageSize: number) => ['visits', 'list', pageSize] as const,
    detail: (id: string) => ['visits', 'detail', id] as const,
    stats: () => ['visits', 'stats'] as const,
    latest: () => ['visits', 'latest'] as const,
    page: (skip: number, limit: number) => ['visits', 'page', skip, limit] as const,
  },
  reference: {
    all: ['reference'] as const,
    teams: () => ['reference', 'teams'] as const,
    arenas: () => ['reference', 'arenas'] as const,
  },
} as const;
