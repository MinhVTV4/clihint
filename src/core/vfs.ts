export type NodeType = 'file' | 'dir';

export interface VFSMetadata {
  permissions: string; // e.g., 'rwxr-xr-x'
  owner: string;
  group: string;
  createdAt: number;
  modifiedAt: number;
}

export interface VFSFile {
  type: 'file';
  name: string;
  content: string;
  meta: VFSMetadata;
}

export interface VFSDirectory {
  type: 'dir';
  name: string;
  children: Record<string, VFSNode>;
  meta: VFSMetadata;
}

export type VFSNode = VFSFile | VFSDirectory;

export interface Process {
  pid: number;
  user: string;
  command: string;
  cpu: number;
  mem: number;
  status: 'R' | 'S' | 'Z';
}

export interface VFSState {
  root: VFSDirectory;
  cwd: string; // Absolute path, e.g., '/home/user'
  processes?: Process[];
  installedPackages?: string[];
  currentUser?: string;
}

export const createMetadata = (type: NodeType, permissions?: string): VFSMetadata => {
  const now = Date.now();
  return {
    permissions: permissions || (type === 'dir' ? 'rwxr-xr-x' : 'rw-r--r--'),
    owner: 'user',
    group: 'user',
    createdAt: now,
    modifiedAt: now,
  };
};

export const initialVFS: VFSState = {
  cwd: '/home/user',
  currentUser: 'user',
  processes: [
    { pid: 1, user: 'root', command: '/sbin/init', cpu: 0.1, mem: 0.5, status: 'S' },
    { pid: 42, user: 'user', command: 'bash', cpu: 0.0, mem: 0.2, status: 'S' },
  ],
  installedPackages: ['coreutils', 'bash'],
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
            children: {},
            meta: createMetadata('dir')
          }
        },
        meta: createMetadata('dir')
      }
    },
    meta: createMetadata('dir')
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
