
export interface FollowedGameWithCount {
    game: Game;
    newPatchnoteCount: number;
}

export interface Game {
    id: number;
    apiId: number;
    title: string;
    description: string;
    imageUrl: string;
    releasedAt: string;
    lastUpdatedAt: string;
    extensions: string[];
    companies: Company[];
    genres: Genre[];
}

export interface Extension {
    id: number;
    apiId: number;
    title: string;
    releasedAt: string;
    game: string;
    imageUrl: string;
    lastUpdatedAt: string;
}

export interface Company {
    id: number;
    name : string;
}

export interface Genre {
    id: number;
    name: string;
}

export interface GameFilters {
    page?: number;
    title?: string;
    description?: string;
    'genres.name'?: string;
    'genres.name[]'?: string[];
    'companies.name'?: string;
    'releasedAt[before]'?: string;
    'releasedAt[strictly_before]'?: string;
    'releasedAt[after]'?: string;
    'releasedAt[strictly_after]'?: string;
    'lastUpdatedAt[before]'?: string;
    'lastUpdatedAt[strictly_before]'?: string;
    'lastUpdatedAt[after]'?: string;
    'lastUpdatedAt[strictly_after]'?: string;
    'order[title]'?: 'asc' | 'desc';
    'order[releasedAt]'?: 'asc' | 'desc';
    'order[lastUpdatedAt]'?: 'asc' | 'desc';
}