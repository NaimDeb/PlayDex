export interface PatchnoteFormData {
  title: string;
  content: string;
  // Todo : check if date works
  releasedAt: Date;
  importance: "minor" | "major" | "hotfix";
  game: string;
  smallDescription: string;
}

export interface Patchnote {
  id: number;
  title: string;
  content: string;
  releasedAt: Date;
  importance: "minor" | "major" | "hotfix";
  game: string | { title: string; id: number };
  smallDescription: string;
  createdBy?: {
    id: number;
    username: string;
    isBanned?: boolean;
    banReason?: string;
    bannedUntil?: string;
  };
  createdAt?: Date;
}

export interface Modification {
  id: number;
  difference: Array<[number, string]>;
  createdAt: Date;
  user: {
    id: number;
    username: string;
    isBanned?: boolean;
    banReason?: string;
    bannedUntil?: string;
  };
  patchnote?: Patchnote;
  reportCount?: number;
}

export interface PatchnotePatchData {
  id: number;
  title?: string;
  content?: string;
  releasedAt?: Date;
  importance?: "minor" | "major" | "hotfix";
  smallDescription?: string;
}
