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

export interface Course {
  id: string;
  title: string;
  description: string;
  prerequisites?: string[];
  missions: Mission[];
}
