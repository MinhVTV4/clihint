import Fuse from 'fuse.js';
import { commands } from '../data/commands';
import { VFSState, getNodeAtPath } from './vfs';

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
      const currentNode = getNodeAtPath(vfs.root, vfs.cwd);
      
      if (currentNode && currentNode.type === 'dir') {
        const children = Object.values(currentNode.children);
        let candidates = children;
        
        if (isCd) {
          candidates = candidates.filter(c => c.type === 'dir');
        }

        const prefix = parts.slice(0, -1).join(' ') + ' ';
        
        const fileSuggestions: Suggestion[] = candidates.map(c => ({
          text: prefix + c.name,
          description: c.type === 'dir' ? 'Thư mục' : 'Tập tin',
          type: c.type === 'dir' ? 'Thư mục' : 'File'
        }));

        if (searchTerm) {
          const fileFuse = new Fuse(fileSuggestions, { keys: ['text'], threshold: 0.4 });
          const fileResults = fileFuse.search(input).map(r => r.item);
          if (fileResults.length > 0) return fileResults.slice(0, 6);
        } else {
          return fileSuggestions.slice(0, 6);
        }
      }
    }
  }

  const results = fuse.search(input);
  return results.map(r => r.item).slice(0, 6);
};
