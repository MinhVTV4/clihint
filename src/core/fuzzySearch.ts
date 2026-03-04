import Fuse from 'fuse.js';
import { commands } from '../data/commands';
import { VFSState, getNodeAtPath, resolvePath, VFSDirectory } from './vfs';

export interface Suggestion {
  text: string;
  description: string;
  type: 'Lệnh chính' | 'Lệnh phụ' | 'Tham số' | 'Thư mục' | 'File';
}

const flattenCommands = (): Suggestion[] => {
  const flat: Suggestion[] = [];
  commands.forEach(cmd => {
    flat.push({ text: cmd.name, description: cmd.description, type: 'Lệnh chính' });
    if (cmd.options) {
      cmd.options.forEach(opt => {
        flat.push({ text: `${cmd.name} ${opt.name}`, description: opt.description, type: 'Tham số' });
      });
    }
    if (cmd.subcommands) {
      cmd.subcommands.forEach(sub => {
        flat.push({ text: `${cmd.name} ${sub.name}`, description: sub.description, type: 'Lệnh phụ' });
        if (sub.options) {
          sub.options.forEach(opt => {
            flat.push({ text: `${cmd.name} ${sub.name} ${opt.name}`, description: opt.description, type: 'Tham số' });
          });
        }
      });
    }
  });
  return flat;
};

const allSuggestions = flattenCommands();

const fuse = new Fuse(allSuggestions, {
  keys: ['text', 'description'],
  threshold: 0.4,
  distance: 100,
});

export const getSuggestions = (input: string, vfs?: VFSState): Suggestion[] => {
  if (!input.trim()) {
    return commands.map(c => ({ text: c.name, description: c.description, type: 'Lệnh chính' as const })).slice(0, 5);
  }

  // Context-aware suggestions based on VFS
  if (vfs) {
    const parts = input.split(' ');
    const cmd = parts[0];
    const isCd = cmd === 'cd';
    const isFileCmd = ['ls', 'rm', 'touch', 'cat', 'mkdir', 'cp', 'mv', 'chmod', 'chown', 'less', 'find', 'grep', 'head', 'tail'].includes(cmd);

    if ((isCd || isFileCmd) && parts.length >= 2) {
      const searchTerm = parts[parts.length - 1];
      
      // Resolve the directory to search in
      let searchDir = vfs.cwd;
      let filePrefix = '';
      
      if (searchTerm.includes('/')) {
        const lastSlashIndex = searchTerm.lastIndexOf('/');
        const dirPart = searchTerm.substring(0, lastSlashIndex);
        filePrefix = searchTerm.substring(lastSlashIndex + 1);
        searchDir = resolvePath(vfs.cwd, dirPart || '/');
      } else {
        filePrefix = searchTerm;
      }

      const currentNode = getNodeAtPath(vfs.root, searchDir);
      
      if (currentNode && currentNode.type === 'dir') {
        const children = Object.values(currentNode.children);
        let candidates = children;
        
        if (isCd) {
          candidates = candidates.filter(c => c.type === 'dir');
        }

        const prefix = parts.slice(0, -1).join(' ') + ' ';
        const pathPrefix = searchTerm.includes('/') ? searchTerm.substring(0, searchTerm.lastIndexOf('/') + 1) : '';
        
        const fileSuggestions: Suggestion[] = candidates
          .filter(c => c.name.startsWith(filePrefix))
          .map(c => ({
            text: prefix + pathPrefix + c.name + (c.type === 'dir' ? '/' : ''),
            description: c.type === 'dir' ? 'Thư mục' : 'Tập tin',
            type: c.type === 'dir' ? 'Thư mục' : 'File'
          }));

        if (fileSuggestions.length > 0) {
          return fileSuggestions.slice(0, 6);
        }
      }
    }
  }

  const results = fuse.search(input);
  return results.map(r => r.item).slice(0, 6);
};
