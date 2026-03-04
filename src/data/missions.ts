import { Course } from '../core/types';
import { bashBasics } from './courses/bash-basics';
import { fileManipulation } from './courses/file-manipulation';
import { advancedFileManagement } from './courses/advanced-file-management';
import { gitMastery } from './courses/git-mastery';
import { linuxBasics } from './courses/linux-basics';
import { processManagement } from './courses/process-management';
import { networkingBasics } from './courses/networking-basics';
import { packageManagement } from './courses/package-management';
import { ctfChallenge } from './courses/ctf-challenge';
import { sandboxMode } from './courses/sandbox';

export const courses: Course[] = [
  sandboxMode,
  bashBasics,
  linuxBasics,
  fileManipulation,
  advancedFileManagement,
  processManagement,
  networkingBasics,
  packageManagement,
  gitMastery,
  ctfChallenge
];
