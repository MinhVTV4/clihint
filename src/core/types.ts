import { VFSState } from './vfs';

export interface Mission {
  id: string;
  title: string;
  description: string;
  successMessage: string;
  solution?: string;
  setupVFS?: (vfs: VFSState) => VFSState;
  validate: (vfs: VFSState, lastCommand: string) => boolean;
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'sandbox';

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  prerequisites?: string[];
  missions: Mission[];
}
