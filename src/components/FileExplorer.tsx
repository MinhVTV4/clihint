import React, { useState } from 'react';
import { VFSNode, VFSDirectory, VFSFile } from '../core/vfs';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileExplorerProps {
  node: VFSNode;
  name: string;
  depth?: number;
  currentPath: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ node, name, depth = 0, currentPath }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === 'file') {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-md transition-colors text-sm",
          "hover:bg-white/5 text-gray-400"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <FileText size={14} className="text-gray-500 shrink-0" />
        <span className="truncate">{name}</span>
      </div>
    );
  }

  const dirNode = node as VFSDirectory;
  const childrenNames = Object.keys(dirNode.children).sort((a, b) => {
    // Directories first
    const aIsDir = dirNode.children[a].type === 'dir';
    const bIsDir = dirNode.children[b].type === 'dir';
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  return (
    <div>
      <div 
        className={cn(
          "flex items-center gap-1.5 py-1 px-2 rounded-md transition-colors text-sm cursor-pointer select-none",
          "hover:bg-white/5 text-gray-300"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {childrenNames.length > 0 ? (
            isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />
          ) : (
            <div className="w-1 h-1 rounded-full bg-gray-600" />
          )}
        </div>
        {isOpen ? (
          <FolderOpen size={14} className="text-emerald-500 shrink-0" />
        ) : (
          <Folder size={14} className="text-emerald-500 shrink-0" />
        )}
        <span className="truncate font-medium">{name}</span>
      </div>
      
      <AnimatePresence initial={false}>
        {isOpen && childrenNames.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {childrenNames.map(childName => (
              <FileExplorer 
                key={childName} 
                node={dirNode.children[childName]} 
                name={childName} 
                depth={depth + 1} 
                currentPath={`${currentPath}/${childName}`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
