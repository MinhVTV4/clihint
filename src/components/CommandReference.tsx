import React, { useState } from 'react';
import { commands, CommandDefinition } from '../data/commands';
import { Search, ChevronDown, ChevronRight, Terminal as TerminalIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CommandItem = ({ cmd }: { cmd: CommandDefinition }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden bg-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-md">
            <TerminalIcon size={14} />
          </div>
          <div>
            <div className="font-mono text-sm font-medium text-gray-200">{cmd.name}</div>
            <div className="text-xs text-gray-500 line-clamp-1">{cmd.description}</div>
          </div>
        </div>
        {isOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t border-white/5 bg-black/20">
              <div className="mt-3 space-y-3">
                {cmd.options && cmd.options.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Options</div>
                    <div className="space-y-1.5">
                      {cmd.options.map((opt, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <code className="text-cyan-400 bg-cyan-400/10 px-1 rounded shrink-0">{opt.name}</code>
                          <span className="text-gray-400">{opt.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cmd.subcommands && cmd.subcommands.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Subcommands</div>
                    <div className="space-y-2">
                      {cmd.subcommands.map((sub, i) => (
                        <div key={i} className="bg-white/5 rounded p-2">
                          <div className="flex items-start gap-2 text-xs mb-1">
                            <code className="text-emerald-400 bg-emerald-400/10 px-1 rounded shrink-0">{cmd.name} {sub.name}</code>
                            <span className="text-gray-400">{sub.description}</span>
                          </div>
                          {sub.options && sub.options.length > 0 && (
                            <div className="pl-2 border-l border-white/10 mt-1.5 space-y-1">
                              {sub.options.map((opt, j) => (
                                <div key={j} className="flex items-start gap-2 text-[11px]">
                                  <code className="text-cyan-400/80 shrink-0">{opt.name}</code>
                                  <span className="text-gray-500">{opt.description}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!cmd.options || cmd.options.length === 0) && (!cmd.subcommands || cmd.subcommands.length === 0) && (
                  <div className="text-xs text-gray-500 italic">
                    Không có options hoặc subcommands.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CommandReference = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/10 shrink-0">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Tra cứu lệnh</h3>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm lệnh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {filteredCommands.length > 0 ? (
          filteredCommands.map((cmd) => (
            <CommandItem key={cmd.name} cmd={cmd} />
          ))
        ) : (
          <div className="text-center text-sm text-gray-500 mt-8">
            Không tìm thấy lệnh nào phù hợp.
          </div>
        )}
      </div>
    </div>
  );
};
