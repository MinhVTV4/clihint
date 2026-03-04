import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { getSuggestions, Suggestion } from '../core/fuzzySearch';
import { courses } from '../data/missions';
import { commands } from '../data/commands';
import { initialVFS, VFSState, getDisplayPath } from '../core/vfs';
import { executeCommand } from '../core/commandExecutor';
import { Course, Mission } from '../core/types';

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'system' | 'success';
  content: string;
}

export const useTerminal = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 'init-1', type: 'system', content: 'Chào mừng đến với HintShell Web Emulator.' },
    { id: 'init-2', type: 'system', content: 'Gõ "help" để xem danh sách các lệnh có sẵn.' },
    { id: 'init-3', type: 'system', content: 'Hãy gõ một lệnh để bắt đầu hành trình của bạn.' }
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  
  const [currentCourseIndex, setCurrentCourseIndex] = useState(() => {
    const saved = localStorage.getItem('hintshell_course');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [currentMissionIndex, setCurrentMissionIndex] = useState(() => {
    const saved = localStorage.getItem('hintshell_mission');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('hintshell_course', currentCourseIndex.toString());
    localStorage.setItem('hintshell_mission', currentMissionIndex.toString());
  }, [currentCourseIndex, currentMissionIndex]);
  
  const [vfs, setVfs] = useState<VFSState>(() => {
    const saved = localStorage.getItem('hintshell_vfs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved VFS', e);
      }
    }
    return initialVFS;
  });

  // History state
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('hintshell_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved history', e);
      }
    }
    return [];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isBrowsingHistory, setIsBrowsingHistory] = useState(false);

  useEffect(() => {
    localStorage.setItem('hintshell_history', JSON.stringify(commandHistory));
  }, [commandHistory]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const currentCourse = courses[currentCourseIndex];
  const currentMission = currentCourse.missions[currentMissionIndex];

  // Apply VFS setup when mission changes, but only if we didn't just load from localStorage
  // Actually, we should always run setupVFS to ensure required files exist, 
  // but we shouldn't overwrite user's progress if they already created files.
  // setupVFS usually just adds files, so it's mostly safe to run.
  useEffect(() => {
    if (currentMission && currentMission.setupVFS) {
      setVfs(prev => {
        const next = currentMission.setupVFS!(prev);
        localStorage.setItem('hintshell_vfs', JSON.stringify(next));
        return next;
      });
    }
  }, [currentMission]);

  useEffect(() => {
    localStorage.setItem('hintshell_vfs', JSON.stringify(vfs));
  }, [vfs]);

  useEffect(() => {
    setSuggestions(getSuggestions(input, vfs));
    setSelectedSuggestionIndex(0);
  }, [input, vfs]);

  const handleInputChange = (val: string) => {
    setInput(val);
    setHistoryIndex(-1);
    setIsBrowsingHistory(false);
  };

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    if (trimmedCmd !== commandHistory[commandHistory.length - 1]) {
      setCommandHistory(prev => [...prev, trimmedCmd]);
    }
    setHistoryIndex(-1);
    setIsBrowsingHistory(false);

    const newLines: TerminalLine[] = [
      ...lines,
      { id: Date.now().toString(), type: 'input', content: trimmedCmd }
    ];

    let isSuccess = false;
    let nextVfs = vfs;

    if (trimmedCmd === 'clear') {
      if (currentMission && currentMission.validate(nextVfs, trimmedCmd)) {
        isSuccess = true;
        newLines.length = 0; // Clear previous lines
        newLines.push({ id: Date.now().toString(), type: 'success', content: currentMission.successMessage });
      } else {
        setLines([]);
        setInput('');
        return;
      }
    } else {
      const { output: outputContent, newVfs } = executeCommand(trimmedCmd, vfs);
      nextVfs = newVfs;
      setVfs(newVfs);
      
      if (outputContent) {
        newLines.push({ id: (Date.now() + 1).toString(), type: 'output', content: outputContent });
      }
    }

    // Check mission using the new validation engine
    if (trimmedCmd !== 'clear' && currentMission && currentMission.validate(nextVfs, trimmedCmd)) {
      newLines.push({ id: (Date.now() + 2).toString(), type: 'success', content: currentMission.successMessage });
      isSuccess = true;
    }

    if (isSuccess) {
      if (currentMissionIndex < currentCourse.missions.length - 1) {
        setCurrentMissionIndex(prev => prev + 1);
      } else {
        newLines.push({ id: (Date.now() + 3).toString(), type: 'system', content: `🎉 Chúc mừng! Bạn đã hoàn thành khóa học: ${currentCourse.title}` });
      }
    }

    setLines(newLines);
    setInput('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!isBrowsingHistory && suggestions.length > 0 && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        handleInputChange(suggestions[selectedSuggestionIndex].text);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isBrowsingHistory && input.length > 0 && suggestions.length > 0) {
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (commandHistory.length > 0) {
        setIsBrowsingHistory(true);
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isBrowsingHistory && input.length > 0 && suggestions.length > 0) {
        setSelectedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (isBrowsingHistory && historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setIsBrowsingHistory(false);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const changeCourse = (index: number) => {
    if (index >= 0 && index < courses.length) {
      setCurrentCourseIndex(index);
      setCurrentMissionIndex(0);
      setVfs(initialVFS); // Reset VFS when changing course
      setLines([
        { id: Date.now().toString(), type: 'system', content: `Đã chuyển sang khóa học: ${courses[index].title}` }
      ]);
      setInput('');
    }
  };

  const resetCourse = () => {
    setCurrentMissionIndex(0);
    setVfs(initialVFS);
    setLines([
      { id: Date.now().toString(), type: 'system', content: `Đã làm mới khóa học: ${currentCourse.title}` }
    ]);
    setInput('');
  };

  const resetApp = () => {
    localStorage.clear();
    setCurrentCourseIndex(0);
    setCurrentMissionIndex(0);
    setVfs(initialVFS);
    setCommandHistory([]);
    setLines([
      { id: Date.now().toString(), type: 'system', content: 'Đã khôi phục toàn bộ ứng dụng về trạng thái ban đầu.' }
    ]);
    setInput('');
  };

  return {
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
    totalMissions: currentCourse.missions.length,
    displayPath: getDisplayPath(vfs.cwd),
    isBrowsingHistory,
    courses,
    currentCourseIndex,
    changeCourse,
    resetCourse,
    resetApp,
    vfs
  };
};
