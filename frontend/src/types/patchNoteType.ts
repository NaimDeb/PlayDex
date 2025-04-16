export interface PatchnoteFormData {
    title: string;
    content: string;
    // Todo : check if date works
    releasedAt: Date;
    importance: 'minor' | 'major' | 'hotfix';
    game: string;
    smallDescription: string;
}

export interface Patchnote {
    id: number;
    title: string;
    content: string;
    releasedAt: Date;
    importance: 'minor' | 'major' | 'hotfix';
    game: string;
    smallDescription: string;
}

export interface Modification {
    id: string;
    changes: string;
    modifiedAt: Date;
}

export interface PatchnotePatchData {
    id: number;
    title?: string;
    content?: string;
    releasedAt?: Date;
    importance?: 'minor' | 'major' | 'hotfix';
    smallDescription?: string;
}
