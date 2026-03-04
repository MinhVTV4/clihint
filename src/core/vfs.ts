export type NodeType = 'file' | 'dir';

export interface VFSFile {
  type: 'file';
  name: string;
  content: string;
}

export interface VFSDirectory {
  type: 'dir';
  name: string;
  children: Record<string, VFSNode>;
}

export type VFSNode = VFSFile | VFSDirectory;

export interface VFSState {
  root: VFSDirectory;
  cwd: string; // Absolute path, e.g., '/home/user'
}

export const initialVFS: VFSState = {
  cwd: '/home/user',
  root: {
    type: 'dir',
    name: '',
    children: {
      'home': {
        type: 'dir',
        name: 'home',
        children: {
          'user': {
            type: 'dir',
            name: 'user',
            children: {}
          }
        }
      }
    }
  }
};

export const normalizePath = (path: string): string => {
  const parts = path.split('/').filter(p => p !== '' && p !== '.');
  const result: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else {
      result.push(part);
    }
  }
  return '/' + result.join('/');
};

export const resolvePath = (cwd: string, target: string): string => {
  if (target.startsWith('/')) return normalizePath(target);
  if (target.startsWith('~')) return normalizePath('/home/user' + target.slice(1));
  return normalizePath(cwd + '/' + target);
};

export const getNodeAtPath = (root: VFSDirectory, path: string): VFSNode | null => {
  if (path === '/') return root;
  const parts = path.split('/').filter(Boolean);
  let current: VFSNode = root;
  for (const part of parts) {
    if (current.type !== 'dir') return null;
    current = current.children[part];
    if (!current) return null;
  }
  return current;
};

export const getDisplayPath = (cwd: string): string => {
  if (cwd === '/home/user') return '~';
  if (cwd.startsWith('/home/user/')) return '~' + cwd.slice(10);
  return cwd;
};
