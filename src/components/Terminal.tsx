import React, { useEffect, useRef, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { Terminal as TerminalIcon, CheckCircle2, Command, ChevronDown, Lightbulb, Copy, Check, RotateCcw, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { FileExplorer } from './FileExplorer';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TerminalApp = () => {
  const {
    lines,
    input,
    handleInputChange,
    suggestions,
    selectedSuggestionIndex,
    onKeyDown,
    inputRef,
    currentCourse,
    currentMission,
    currentMissionIndex,
    totalMissions,
    displayPath,
    isBrowsingHistory,
    courses,
    currentCourseIndex,
    changeCourse,
    resetCourse,
    resetApp,
    vfs
  } = useTerminal();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleClear = () => {
    handleInputChange('clear');
    onKeyDown({ key: 'Enter', preventDefault: () => {} } as any);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, input]);

  useEffect(() => {
    setShowSolution(false);
  }, [currentMissionIndex, currentCourseIndex]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300 font-mono flex flex-col md:flex-row p-4 md:p-8 gap-6 transition-all duration-300">
      
      {/* Left Panel: Missions */}
      <div className={cn(
        "flex-shrink-0 flex flex-col gap-4 transition-all duration-300",
        isFullscreen ? "w-0 opacity-0 overflow-hidden md:w-0" : "w-full md:w-80 opacity-100"
      )}>
        <div className="bg-[#141414] border border-white/10 rounded-xl p-5 shadow-lg relative">
          
          {/* Course Selector */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div 
              className="flex items-center gap-2 text-emerald-400 cursor-pointer hover:bg-white/5 p-2 rounded-lg -ml-2 transition-colors flex-1"
              onClick={() => setIsCourseMenuOpen(!isCourseMenuOpen)}
            >
              <TerminalIcon size={20} />
              <h2 className="font-semibold text-sm uppercase tracking-wider truncate">{currentCourse.title}</h2>
              <ChevronDown size={16} className={cn("transition-transform ml-auto", isCourseMenuOpen && "rotate-180")} />
            </div>
            <button
              onClick={resetCourse}
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              title="Làm mới khóa học"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <AnimatePresence>
            {isCourseMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-16 left-0 w-full bg-[#1A1B1E] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {courses.map((course, idx) => (
                  <div
                    key={course.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-white/5 transition-colors border-l-2",
                      idx === currentCourseIndex ? "border-emerald-500 bg-emerald-500/10" : "border-transparent"
                    )}
                    onClick={() => {
                      changeCourse(idx);
                      setIsCourseMenuOpen(false);
                    }}
                  >
                    <h4 className={cn("font-medium text-sm mb-1", idx === currentCourseIndex ? "text-emerald-400" : "text-gray-200")}>
                      {course.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{course.description}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Nhiệm vụ {currentMissionIndex + 1}/{totalMissions}</span>
              <div className="flex gap-1">
                {Array.from({ length: totalMissions }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 w-4 rounded-full transition-colors",
                      i < currentMissionIndex ? "bg-emerald-500" : 
                      i === currentMissionIndex ? "bg-emerald-500/50" : "bg-white/10"
                    )}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentMission?.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 rounded-lg p-4 border border-white/5"
              >
                <h3 className="text-white font-medium mb-2">{currentMission?.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {currentMission?.description}
                </p>
                
                {currentMission?.solution && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => setShowSolution(!showSolution)}
                      className="flex items-center gap-2 text-xs text-emerald-400/80 hover:text-emerald-400 transition-colors"
                    >
                      <Lightbulb size={14} />
                      {showSolution ? 'Ẩn lời giải' : 'Xem lời giải'}
                    </button>
                    
                    <AnimatePresence>
                      {showSolution && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 bg-black/40 rounded p-2 text-xs font-mono text-emerald-300 border border-emerald-500/20 relative group">
                            {currentMission.solution}
                            <button
                              onClick={() => handleCopy(currentMission.solution!)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                              title="Copy solution"
                            >
                              {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-xl p-5 shadow-lg flex-1">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-semibold">Cây Thư Mục</h3>
          <div className="overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
            <FileExplorer node={vfs.root} name="/" currentPath="" />
          </div>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-semibold">Hướng dẫn</h3>
          <ul className="text-sm text-gray-400 space-y-3">
            <li className="flex items-start gap-2">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white border border-white/20">Tab</kbd>
              <span>Điền nhanh gợi ý</span>
            </li>
            <li className="flex items-start gap-2">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white border border-white/20">↑</kbd>
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white border border-white/20">↓</kbd>
              <span>Chọn gợi ý / Lịch sử</span>
            </li>
            <li className="flex items-start gap-2">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white border border-white/20">Enter</kbd>
              <span>Chạy lệnh</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Panel: Terminal */}
      <div className="flex-1 bg-[#050505] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Terminal Header */}
        <div className="h-10 bg-[#141414] border-b border-white/10 flex items-center px-4 justify-between">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="text-xs text-gray-500 font-medium flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Command size={14} />
            <span>user@hintshell:{displayPath}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={resetApp}
              className="p-1.5 rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Khôi phục ứng dụng (Reset All)"
            >
              <RotateCcw size={14} />
            </button>
            <button 
              onClick={handleClear}
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              title="Xóa màn hình (clear)"
            >
              <Trash2 size={14} />
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              title={isFullscreen ? "Thu nhỏ" : "Phóng to"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          ref={containerRef}
          className="flex-1 p-4 overflow-y-auto scroll-smooth font-mono text-sm"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line) => (
            <div key={line.id} className="mb-2">
              {line.type === 'system' && (
                <div className="text-gray-500 italic">{line.content}</div>
              )}
              {line.type === 'input' && (
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">➜</span>
                  <span className="text-cyan-400 shrink-0">{displayPath}</span>
                  <SyntaxHighlighter command={line.content} />
                </div>
              )}
              {line.type === 'output' && (
                <div className="text-gray-300 whitespace-pre-wrap break-all pl-6">
                  {line.content}
                </div>
              )}
              {line.type === 'success' && (
                <div className="flex items-center gap-2 text-emerald-400 mt-1 pl-6">
                  <CheckCircle2 size={16} />
                  <span>{line.content}</span>
                </div>
              )}
            </div>
          ))}

          {/* Active Input Line */}
          <div className="flex items-start gap-2 relative mt-2">
            <span className="text-emerald-400 shrink-0 mt-0.5">➜</span>
            <span className="text-cyan-400 shrink-0 mt-0.5">{displayPath}</span>
            <div className="relative flex-1">
              <div className="absolute inset-0 pointer-events-none text-transparent">
                <SyntaxHighlighter command={input} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full bg-transparent outline-none text-transparent caret-white"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
              
              {/* Hint Panel Overlay */}
              <AnimatePresence>
                {!isBrowsingHistory && input.length > 0 && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-full max-w-md bg-[#1A1B1E] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
                  >
                    <div className="py-1">
                      {suggestions.map((s, idx) => (
                        <div
                          key={`${s.text}-${idx}`}
                          className={cn(
                            "px-3 py-2 flex flex-col gap-0.5 cursor-pointer transition-colors",
                            idx === selectedSuggestionIndex ? "bg-emerald-500/20 border-l-2 border-emerald-500" : "hover:bg-white/5 border-l-2 border-transparent"
                          )}
                          onClick={() => {
                            handleInputChange(s.text);
                            inputRef.current?.focus();
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium",
                              idx === selectedSuggestionIndex ? "text-emerald-400" : "text-gray-200"
                            )}>{s.text}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400 uppercase tracking-wider">
                              {s.type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 truncate">{s.description}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
