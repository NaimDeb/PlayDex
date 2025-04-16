
export interface Game {
    id: number;
    apiId: number;
    title: string;
    description: string;
    imageUrl: string;
    releasedAt: string;
    lastUpdatedAt: string;
    extensions: string[];
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