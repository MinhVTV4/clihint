import { Course } from '../core/types';
import { bashBasics } from './courses/bash-basics';
import { fileManipulation } from './courses/file-manipulation';
import { advancedFileManagement } from './courses/advanced-file-management';
import { gitMastery } from './courses/git-mastery';
import { linuxBasics } from './courses/linux-basics';
import { processManagement } from './courses/process-management';

export const courses: Course[] = [
  bashBasics,
  linuxBasics,
  fileManipulation,
  advancedFileManagement,
  processManagement,
  gitMastery
];
