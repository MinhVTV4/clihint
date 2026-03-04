import { VFSState, resolvePath, getNodeAtPath, VFSNode, VFSDirectory, VFSFile, createMetadata } from './vfs';
import { commands } from '../data/commands';

export interface CommandResult {
  output: string;
  newVfs: VFSState;
}

export const parseArgs = (cmdStr: string): string[] => {
  const args: string[] = [];
  let currentArg = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < cmdStr.length; i++) {
    const char = cmdStr[i];

    if (inQuotes) {
      if (char === quoteChar) {
        inQuotes = false;
      } else {
        currentArg += char;
      }
    } else {
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
      } else if (/\s/.test(char)) {
        if (currentArg.length > 0) {
          args.push(currentArg);
          currentArg = '';
        }
      } else {
        currentArg += char;
      }
    }
  }

  if (currentArg.length > 0) {
    args.push(currentArg);
  }

  return args;
};

export const executeCommand = (cmdStr: string, vfs: VFSState): CommandResult => {
  let redirectTarget = '';
  let redirectAppend = false;
  let baseCmdStr = cmdStr;

  const appendMatch = cmdStr.match(/(.*?)\s+>>\s+((?:["'].*?["'])|(?:\S+))$/);
  if (appendMatch) {
    baseCmdStr = appendMatch[1];
    redirectTarget = appendMatch[2].replace(/^["'](.*)["']$/, '$1');
    redirectAppend = true;
  } else {
    const writeMatch = cmdStr.match(/(.*?)\s+>\s+((?:["'].*?["'])|(?:\S+))$/);
    if (writeMatch) {
      baseCmdStr = writeMatch[1];
      redirectTarget = writeMatch[2].replace(/^["'](.*)["']$/, '$1');
    }
  }

  const args = parseArgs(baseCmdStr);
  if (args.length === 0) return { output: '', newVfs: vfs };
  
  const cmd = args[0];
  const newVfs = { ...vfs };

  // Deep clone helper for VFS mutation
  const cloneVFS = (v: VFSState): VFSState => JSON.parse(JSON.stringify(v));

  let output = '';
  let clonedVfs = cloneVFS(vfs);

  switch (cmd) {
    case 'pwd':
      output = vfs.cwd;
      break;
      
    case 'ls': {
      const options = args.filter(a => a.startsWith('-'));
      const showHidden = options.some(o => o.includes('a'));
      const isLongFormat = options.some(o => o.includes('l'));
      
      const targetArg = args.find(a => !a.startsWith('-') && a !== 'ls');
      const targetPath = targetArg ? resolvePath(vfs.cwd, targetArg) : vfs.cwd;
      
      const node = getNodeAtPath(vfs.root, targetPath);
      if (!node) {
        output = `ls: cannot access '${targetArg || targetPath}': No such file or directory`;
        break;
      }
      if (node.type === 'file') {
        output = node.name;
        break;
      }
      
      let childrenNames = Object.keys(node.children).sort();
      if (!showHidden) {
        childrenNames = childrenNames.filter(name => !name.startsWith('.'));
      }
      
      if (childrenNames.length === 0) {
        output = '';
        break;
      }
      
      if (isLongFormat) {
        output = childrenNames.map(name => {
          const child = node.children[name];
          const typeChar = child.type === 'dir' ? 'd' : '-';
          const size = child.type === 'file' ? child.content.length.toString().padStart(4) : '4096';
          const perms = child.meta?.permissions || (child.type === 'dir' ? 'rwxr-xr-x' : 'rw-r--r--');
          const owner = child.meta?.owner || 'user';
          const group = child.meta?.group || 'user';
          const date = new Date(child.meta?.modifiedAt || Date.now());
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          return `${typeChar}${perms} 1 ${owner} ${group} ${size} ${dateStr} ${name}`;
        }).join('\n');
      } else {
        output = childrenNames.join('  ');
      }
      break;
    }
    
    case 'cd': {
      const target = args[1] || '~';
      const targetPath = resolvePath(vfs.cwd, target);
      const node = getNodeAtPath(vfs.root, targetPath);
      
      if (!node) {
        output = `cd: ${target}: No such file or directory`;
      } else if (node.type !== 'dir') {
        output = `cd: ${target}: Not a directory`;
      } else {
        clonedVfs.cwd = targetPath;
      }
      break;
    }
    
    case 'mkdir': {
      if (!args[1]) {
        output = 'mkdir: missing operand';
        break;
      }
      
      const targetPath = resolvePath(vfs.cwd, args[1]);
      const parentPath = resolvePath(targetPath, '..');
      const dirName = targetPath.split('/').pop()!;
      
      const parentNode = getNodeAtPath(clonedVfs.root, parentPath);
      
      if (!parentNode || parentNode.type !== 'dir') {
        output = `mkdir: cannot create directory '${args[1]}': No such file or directory`;
      } else if (parentNode.children[dirName]) {
        output = `mkdir: cannot create directory '${args[1]}': File exists`;
      } else {
        parentNode.children[dirName] = { type: 'dir', name: dirName, children: {}, meta: createMetadata('dir') };
      }
      break;
    }
    
    case 'rm': {
      if (!args[1]) {
        output = 'rm: missing operand';
        break;
      }
      
      const targetArg = args.find(a => !a.startsWith('-') && a !== 'rm');
      if (!targetArg) {
        output = 'rm: missing operand';
        break;
      }
      
      const targetPath = resolvePath(vfs.cwd, targetArg);
      if (targetPath === '/' || targetPath === '/home' || targetPath === '/home/user') {
        output = `rm: cannot remove '${targetArg}': Permission denied`;
        break;
      }
      
      const parentPath = resolvePath(targetPath, '..');
      const fileName = targetPath.split('/').pop()!;
      
      const parentNode = getNodeAtPath(clonedVfs.root, parentPath);
      
      if (!parentNode || parentNode.type !== 'dir' || !parentNode.children[fileName]) {
        output = `rm: cannot remove '${targetArg}': No such file or directory`;
        break;
      }
      
      const targetNode = parentNode.children[fileName];
      const currentUser = clonedVfs.currentUser || 'user';
      if (targetNode.meta && targetNode.meta.owner !== currentUser && currentUser !== 'root') {
        output = `rm: cannot remove '${targetArg}': Permission denied`;
        break;
      }
      
      const isRecursive = args.filter(a => a.startsWith('-')).some(o => o.includes('r'));
      if (targetNode.type === 'dir' && !isRecursive) {
        output = `rm: cannot remove '${targetArg}': Is a directory`;
        break;
      }

      delete parentNode.children[fileName];
      break;
    }
    
    case 'touch': {
      if (!args[1]) {
        output = 'touch: missing file operand';
        break;
      }
      
      const targetPath = resolvePath(vfs.cwd, args[1]);
      const parentPath = resolvePath(targetPath, '..');
      const fileName = targetPath.split('/').pop()!;
      
      const parentNode = getNodeAtPath(clonedVfs.root, parentPath);
      
      if (!parentNode || parentNode.type !== 'dir') {
        output = `touch: cannot touch '${args[1]}': No such file or directory`;
      } else if (!parentNode.children[fileName]) {
        parentNode.children[fileName] = { type: 'file', name: fileName, content: '', meta: createMetadata('file') };
      } else {
        // Update modifiedAt
        if (parentNode.children[fileName].meta) {
          parentNode.children[fileName].meta.modifiedAt = Date.now();
        }
      }
      break;
    }
    
    case 'echo': {
      const text = args.slice(1).join(' ').replace(/^["'](.*)["']$/, '$1');
      output = text;
      break;
    }

    case 'su': {
      if (!args[1]) {
        output = 'su: user name required';
        break;
      }
      const targetUser = args[1];
      const password = args[2];
      
      if (targetUser === 'admin' && password === 'pwned2026') {
        clonedVfs.currentUser = 'admin';
        output = `Switched to user admin`;
      } else if (targetUser === 'root' && password === 'root') {
        clonedVfs.currentUser = 'root';
        output = `Switched to user root`;
      } else if (targetUser === 'user') {
        clonedVfs.currentUser = 'user';
        output = `Switched to user user`;
      } else {
        output = `su: Authentication failure`;
      }
      break;
    }

    case 'cat': {
      if (!args[1]) {
        output = 'cat: missing file operand';
        break;
      }
      const targetPath = resolvePath(vfs.cwd, args[1]);
      const node = getNodeAtPath(clonedVfs.root, targetPath);
      if (!node) {
        output = `cat: ${args[1]}: No such file or directory`;
      } else if (node.type === 'dir') {
        output = `cat: ${args[1]}: Is a directory`;
      } else {
        output = node.content;
      }
      break;
    }

    case 'grep': {
      const options = args.filter(a => a.startsWith('-'));
      const isIgnoreCase = options.includes('-i');
      const patternArg = args.find(a => !a.startsWith('-') && a !== 'grep');
      const fileArg = args.find(a => !a.startsWith('-') && a !== 'grep' && a !== patternArg);

      if (!patternArg || !fileArg) {
        output = 'grep: missing pattern or file operand';
        break;
      }

      const pattern = patternArg.replace(/^["'](.*)["']$/, '$1');
      const targetPath = resolvePath(vfs.cwd, fileArg);
      const node = getNodeAtPath(clonedVfs.root, targetPath);

      if (!node) {
        output = `grep: ${fileArg}: No such file or directory`;
      } else if (node.type === 'dir') {
        output = `grep: ${fileArg}: Is a directory`;
      } else {
        const lines = node.content.split('\n');
        const regex = new RegExp(pattern, isIgnoreCase ? 'i' : '');
        output = lines.filter(l => regex.test(l)).join('\n');
      }
      break;
    }

    case 'head': {
      if (!args[1]) {
        output = 'head: missing file operand';
        break;
      }
      const targetPath = resolvePath(vfs.cwd, args[1]);
      const node = getNodeAtPath(clonedVfs.root, targetPath);
      if (!node) {
        output = `head: cannot open '${args[1]}' for reading: No such file or directory`;
      } else if (node.type === 'dir') {
        output = `head: error reading '${args[1]}': Is a directory`;
      } else {
        output = node.content.split('\n').slice(0, 10).join('\n');
      }
      break;
    }

    case 'tail': {
      if (!args[1]) {
        output = 'tail: missing file operand';
        break;
      }
      const targetPath = resolvePath(vfs.cwd, args[1]);
      const node = getNodeAtPath(clonedVfs.root, targetPath);
      if (!node) {
        output = `tail: cannot open '${args[1]}' for reading: No such file or directory`;
      } else if (node.type === 'dir') {
        output = `tail: error reading '${args[1]}': Is a directory`;
      } else {
        const lines = node.content.split('\n');
        output = lines.slice(Math.max(lines.length - 10, 0)).join('\n');
      }
      break;
    }

    case 'cp': {
      const isRecursive = args.filter(a => a.startsWith('-')).some(o => o.includes('r'));
      const srcArg = args.find(a => !a.startsWith('-') && a !== 'cp');
      const destArg = args.find(a => !a.startsWith('-') && a !== 'cp' && a !== srcArg);

      if (!srcArg || !destArg) {
        output = 'cp: missing file operand';
        break;
      }

      const srcPath = resolvePath(vfs.cwd, srcArg);
      const destPath = resolvePath(vfs.cwd, destArg);
      
      const srcNode = getNodeAtPath(clonedVfs.root, srcPath);
      if (!srcNode) {
        output = `cp: cannot stat '${srcArg}': No such file or directory`;
        break;
      }

      if (srcNode.type === 'dir' && !isRecursive) {
        output = `cp: -r not specified; omitting directory '${srcArg}'`;
        break;
      }

      const destParentPath = resolvePath(destPath, '..');
      const destName = destPath.split('/').pop()!;
      const destParentNode = getNodeAtPath(clonedVfs.root, destParentPath);

      if (!destParentNode || destParentNode.type !== 'dir') {
        output = `cp: cannot create regular file '${destArg}': No such file or directory`;
        break;
      }

      // Simple deep copy
      const copyNode = JSON.parse(JSON.stringify(srcNode));
      copyNode.name = destName;
      destParentNode.children[destName] = copyNode;
      break;
    }

    case 'mv': {
      const srcArg = args.find(a => !a.startsWith('-') && a !== 'mv');
      const destArg = args.find(a => !a.startsWith('-') && a !== 'mv' && a !== srcArg);

      if (!srcArg || !destArg) {
        output = 'mv: missing file operand';
        break;
      }

      const srcPath = resolvePath(vfs.cwd, srcArg);
      const destPath = resolvePath(vfs.cwd, destArg);
      
      const srcNode = getNodeAtPath(clonedVfs.root, srcPath);
      if (!srcNode) {
        output = `mv: cannot stat '${srcArg}': No such file or directory`;
        break;
      }

      const srcParentPath = resolvePath(srcPath, '..');
      const srcName = srcPath.split('/').pop()!;
      const srcParentNode = getNodeAtPath(clonedVfs.root, srcParentPath);

      const destParentPath = resolvePath(destPath, '..');
      let destName = destPath.split('/').pop()!;
      let destParentNode = getNodeAtPath(clonedVfs.root, destParentPath);

      if (!destParentNode || destParentNode.type !== 'dir') {
        output = `mv: cannot move '${srcArg}' to '${destArg}': No such file or directory`;
        break;
      }

      // If dest is an existing directory, move inside it
      const destExistingNode = getNodeAtPath(clonedVfs.root, destPath);
      if (destExistingNode && destExistingNode.type === 'dir') {
        destParentNode = destExistingNode;
        destName = srcName;
      }

      if (srcParentNode && srcParentNode.type === 'dir') {
        destParentNode.children[destName] = srcNode;
        srcNode.name = destName;
        delete srcParentNode.children[srcName];
      }
      break;
    }
    
    case 'find': {
      const startPathArg = args[1] && !args[1].startsWith('-') ? args[1] : '.';
      const nameFlagIndex = args.indexOf('-name');
      const searchName = nameFlagIndex !== -1 && args[nameFlagIndex + 1] ? args[nameFlagIndex + 1] : null;

      if (!searchName) {
        output = 'find: missing -name argument';
        break;
      }

      const startPath = resolvePath(vfs.cwd, startPathArg);
      const startNode = getNodeAtPath(clonedVfs.root, startPath);

      if (!startNode || startNode.type !== 'dir') {
        output = `find: '${startPathArg}': No such file or directory`;
        break;
      }

      const results: string[] = [];
      const searchDir = (node: VFSDirectory, currentPath: string) => {
        for (const childName in node.children) {
          const child = node.children[childName];
          const childPath = currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`;
          
          if (childName === searchName) {
            results.push(childPath);
          }
          
          if (child.type === 'dir') {
            searchDir(child, childPath);
          }
        }
      };

      searchDir(startNode, startPath);
      output = results.length > 0 ? results.join('\n') : '';
      break;
    }

    case 'help': {
      output = 'Các lệnh có sẵn:\n' + commands.map(c => `  ${c.name.padEnd(10)} - ${c.description}`).join('\n');
      break;
    }

    case 'chmod': {
      if (!args[1] || !args[2]) {
        output = `chmod: missing operand`;
        break;
      }
      const targetPath = resolvePath(vfs.cwd, args[2]);
      const node = getNodeAtPath(clonedVfs.root, targetPath);
      if (!node) {
        output = `chmod: cannot access '${args[2]}': No such file or directory`;
      } else {
        if (node.meta) {
          // Simple simulation of chmod +x
          if (args[1] === '+x') {
            const perms = node.meta.permissions;
            node.meta.permissions = perms.substring(0, 3) + 'x' + perms.substring(4);
          } else {
            // Very basic simulation for other modes
            node.meta.permissions = args[1];
          }
          node.meta.modifiedAt = Date.now();
        }
        output = '';
      }
      break;
    }

    case 'chown': {
      if (!args[1] || !args[2]) {
        output = `chown: missing operand`;
        break;
      }
      const targetPath = resolvePath(vfs.cwd, args[2]);
      const node = getNodeAtPath(clonedVfs.root, targetPath);
      if (!node) {
        output = `chown: cannot access '${args[2]}': No such file or directory`;
      } else {
        if (node.meta) {
          const ownerGroup = args[1].split(':');
          node.meta.owner = ownerGroup[0];
          if (ownerGroup[1]) {
            node.meta.group = ownerGroup[1];
          }
          node.meta.modifiedAt = Date.now();
        }
        output = '';
      }
      break;
    }

    case 'ps': {
      const processes = clonedVfs.processes || [];
      const showAll = args.includes('aux') || args.includes('-ef');
      
      let header = '  PID TTY          TIME CMD';
      if (showAll) {
        header = 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND';
      }
      
      const psOutput = processes
        .filter(p => showAll || p.user === 'user')
        .map(p => {
          if (showAll) {
            return `${p.user.padEnd(8)} ${p.pid.toString().padStart(7)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)}  12345  6789 pts/0    ${p.status.padEnd(4)} 00:00   0:00 ${p.command}`;
          } else {
            return `${p.pid.toString().padStart(5)} pts/0    00:00:00 ${p.command}`;
          }
        });
        
      output = [header, ...psOutput].join('\n');
      break;
    }

    case 'kill': {
      if (!args[1]) {
        output = 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]';
        break;
      }
      
      const targetPid = parseInt(args[args.length - 1], 10);
      if (isNaN(targetPid)) {
        output = `kill: ${args[args.length - 1]}: arguments must be process or job IDs`;
        break;
      }
      
      if (clonedVfs.processes) {
        const initialLength = clonedVfs.processes.length;
        clonedVfs.processes = clonedVfs.processes.filter(p => p.pid !== targetPid);
        if (clonedVfs.processes.length === initialLength) {
          output = `kill: (${targetPid}) - No such process`;
        } else {
          output = '';
        }
      } else {
        output = `kill: (${targetPid}) - No such process`;
      }
      break;
    }

    case 'top': {
      const processes = clonedVfs.processes || [];
      const totalCpu = processes.reduce((acc, p) => acc + p.cpu, 0);
      const totalMem = processes.reduce((acc, p) => acc + p.mem, 0);
      
      const header1 = `top - ${new Date().toLocaleTimeString()} up 1 day,  1:23,  1 user,  load average: 0.00, 0.01, 0.05`;
      const header2 = `Tasks: ${processes.length} total,   1 running, ${processes.length - 1} sleeping,   0 stopped,   0 zombie`;
      const header3 = `%Cpu(s):  ${totalCpu.toFixed(1)} us,  0.1 sy,  0.0 ni, ${(100 - totalCpu).toFixed(1)} id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st`;
      const header4 = `MiB Mem :   8192.0 total,   4096.0 free,   ${(totalMem * 81.92).toFixed(1)} used,   4096.0 buff/cache`;
      const header5 = `MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   4096.0 avail Mem `;
      const emptyLine = '';
      const tableHeader = '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND';
      
      const psOutput = processes
        .sort((a, b) => b.cpu - a.cpu)
        .map(p => {
          return `${p.pid.toString().padStart(5)} ${p.user.padEnd(8)}  20   0   12345   6789   1234 ${p.status}  ${p.cpu.toFixed(1).padStart(4)}  ${p.mem.toFixed(1).padStart(4)}   0:00.00 ${p.command}`;
        });
        
      output = [header1, header2, header3, header4, header5, emptyLine, tableHeader, ...psOutput].join('\n');
      break;
    }

    case 'less': {
      if (!args[1]) {
        output = 'missing filename';
        break;
      }
      const targetPath = resolvePath(vfs.cwd, args[1]);
      const node = getNodeAtPath(clonedVfs.root, targetPath);
      if (!node) {
        output = `${args[1]}: No such file or directory`;
      } else if (node.type === 'dir') {
        output = `${args[1]} is a directory`;
      } else {
        output = node.content; // In a real terminal this would open an interactive pager
      }
      break;
    }
    
    case 'whoami': {
      output = clonedVfs.currentUser || 'user';
      break;
    }

    case 'date': {
      output = new Date().toString();
      break;
    }

    case 'uptime': {
      output = ` 10:00:00 up 1 day,  2:34,  1 user,  load average: 0.00, 0.01, 0.05`;
      break;
    }

    case 'uname': {
      const isAll = args.includes('-a');
      if (isAll) {
        output = `Linux virtual-machine 5.15.0-generic #1 SMP Tue Mar 4 10:00:00 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux`;
      } else {
        output = `Linux`;
      }
      break;
    }

    case 'wc': {
      const fileArg = args.find(a => !a.startsWith('-') && a !== 'wc');
      if (!fileArg) {
        output = 'wc: missing operand';
        break;
      }
      
      const targetPath = resolvePath(vfs.cwd, fileArg);
      const node = getNodeAtPath(clonedVfs.root, targetPath);
      
      if (!node) {
        output = `wc: ${fileArg}: No such file or directory`;
      } else if (node.type === 'dir') {
        output = `wc: ${fileArg}: Is a directory\n      0       0       0 ${fileArg}`;
      } else {
        const lines = node.content.split('\n').length;
        const words = node.content.split(/\s+/).filter(w => w.length > 0).length;
        const bytes = node.content.length;
        
        const options = args.filter(a => a.startsWith('-'));
        let res = [];
        if (options.length === 0) {
           res = [lines, words, bytes];
        } else {
           if (options.some(o => o.includes('l'))) res.push(lines);
           if (options.some(o => o.includes('w'))) res.push(words);
           if (options.some(o => o.includes('c'))) res.push(bytes);
        }
        output = ` ${res.join(' ')} ${fileArg}`;
      }
      break;
    }

    case 'df': {
      const isHuman = args.includes('-h');
      if (isHuman) {
        output = `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        20G  5.0G   15G  25% /\ntmpfs           500M     0  500M   0% /dev/shm`;
      } else {
        output = `Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/sda1       20480000 5120000  15360000  25% /\ntmpfs             512000       0    512000   0% /dev/shm`;
      }
      break;
    }

    case 'free': {
      const isHuman = args.includes('-h');
      if (isHuman) {
        output = `               total        used        free      shared  buff/cache   available\nMem:           8.0G        2.5G        3.0G        100M        2.5G        5.0G\nSwap:          2.0G          0B        2.0G`;
      } else {
        output = `               total        used        free      shared  buff/cache   available\nMem:         8192000     2560000     3072000      102400     2560000     5120000\nSwap:        2097152           0     2097152`;
      }
      break;
    }
    
      case 'ping': {
      let target = args[1];
      let timeout = 5; // Default timeout

      if (args[1] === '-w' && args[2]) {
        timeout = parseInt(args[2], 10);
        target = args[3];
      } else if (args[2] === '-w' && args[3]) {
        timeout = parseInt(args[3], 10);
      }

      if (!target) {
        output = 'ping: usage error: Destination address required';
        break;
      }
      output = `PING ${target} (192.168.1.1): 56 data bytes\n64 bytes from 192.168.1.1: icmp_seq=0 ttl=64 time=1.234 ms\n64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=1.102 ms\n64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=1.123 ms\n--- ${target} ping statistics ---\n3 packets transmitted, 3 packets received, 0.0% packet loss\n(Timeout set to ${timeout} seconds)`;
      break;
    }

    case 'curl': {
      if (!args[1]) {
        output = 'curl: try \'curl --help\' for more information';
        break;
      }
      if (args[1].includes('api.github.com')) {
        output = '{\n  "login": "octocat",\n  "id": 1,\n  "type": "User"\n}';
      } else {
        output = `<html>\n  <body>\n    <h1>Welcome to ${args[1]}</h1>\n  </body>\n</html>`;
      }
      break;
    }

    case 'wget': {
      if (!args[1]) {
        output = 'wget: missing URL';
        break;
      }
      const fileName = args[1].split('/').pop() || 'index.html';
      const cwdNode = getNodeAtPath(clonedVfs.root, vfs.cwd);
      if (cwdNode && cwdNode.type === 'dir') {
        cwdNode.children[fileName] = { 
          type: 'file', 
          name: fileName, 
          content: `Downloaded content from ${args[1]}`, 
          meta: createMetadata('file') 
        };
        output = `Resolving ${args[1]}... 192.168.1.100\nConnecting to ${args[1]}|192.168.1.100|:443... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 1024 (1.0K) [text/html]\nSaving to: '${fileName}'\n\n     0K .                                                     100% 1.00M=0.001s\n\n2026-03-04 00:00:00 (1.00 MB/s) - '${fileName}' saved [1024/1024]`;
      }
      break;
    }

    case 'apt': {
      if (args[1] === 'update') {
        output = 'Hit:1 http://archive.ubuntu.com/ubuntu focal InRelease\nGet:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease [114 kB]\nFetched 114 kB in 1s (114 kB/s)\nReading package lists... Done';
      } else if (args[1] === 'install' && args[2]) {
        if (!clonedVfs.installedPackages) clonedVfs.installedPackages = [];
        if (clonedVfs.installedPackages.includes(args[2])) {
          output = `${args[2]} is already the newest version.`;
        } else {
          clonedVfs.installedPackages.push(args[2]);
          output = `Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  ${args[2]}\n0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\nInst ${args[2]} (1.0.0 ubuntu1)\nConf ${args[2]} (1.0.0 ubuntu1)`;
        }
      } else {
        output = 'apt: usage: apt [update|install package]';
      }
      break;
    }

    case 'git': {
      const gitDir = getNodeAtPath(clonedVfs.root, resolvePath(vfs.cwd, '.git'));
      
      if (args[1] === 'init') {
        if (gitDir) {
          output = 'Reinitialized existing Git repository';
        } else {
          const cwdNode = getNodeAtPath(clonedVfs.root, vfs.cwd);
          if (cwdNode && cwdNode.type === 'dir') {
            cwdNode.children['.git'] = { type: 'dir', name: '.git', children: {}, meta: createMetadata('dir') };
            output = `Initialized empty Git repository in ${vfs.cwd}/.git/`;
          }
        }
      } else if (!gitDir) {
        output = 'fatal: not a git repository (or any of the parent directories): .git';
      } else if (args[1] === 'status') {
        const cwdNode = getNodeAtPath(clonedVfs.root, vfs.cwd);
        if (cwdNode && cwdNode.type === 'dir') {
          const files = Object.keys(cwdNode.children).filter(name => name !== '.git');
          if (files.length > 0) {
            output = `On branch main\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\t${files.join('\n\t')}\n\nnothing added to commit but untracked files present (use "git add" to track)`;
          } else {
            output = 'On branch main\nnothing to commit, working tree clean';
          }
        }
      } else if (args[1] === 'add') {
        output = ''; // Silent on success
      } else if (args[1] === 'commit') {
        let message = '';
        if (args[2] === '-m' && args[3]) {
          message = args[3];
        } else {
          message = args.slice(2).join(' ').replace(/^["'](.*)["']$/, '$1');
        }
        output = `[main (root-commit) a1b2c3d] ${message}\n 2 files changed, 2 insertions(+)`;
      } else if (args[1] === 'checkout') {
        if (args[2] === '-b') {
          output = `Switched to a new branch '${args[3]}'`;
        } else {
          output = `Switched to branch '${args[2]}'`;
        }
      } else if (args[1] === 'log') {
        output = `commit a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 (HEAD -> main)\nAuthor: User <user@example.com>\nDate:   Mon Mar 03 10:00:00 2026 +0700\n\n    Initial commit`;
      } else if (args[1] === 'branch') {
        if (args[2]) {
          output = ''; // Silent on branch creation
        } else {
          output = `* main\n  feature-login`;
        }
      } else {
        output = `Thực thi lệnh git: ${args.slice(1).join(' ')}`;
      }
      break;
    }

    case 'npm': {
      const cwdNode = getNodeAtPath(clonedVfs.root, vfs.cwd);
      if (!cwdNode || cwdNode.type !== 'dir') {
        output = 'npm: error: current directory not found';
        break;
      }

      const subcommand = args[1];

      if (!subcommand) {
        output = `
npm <command>

Usage:

npm install        install all the dependencies in your project
npm install <foo>  add the <foo> dependency to your project
npm test           run this project's tests
npm run <foo>      run the script named <foo>
npm <command> -h   quick help on <command>
`;
        break;
      }

      if (subcommand === 'init') {
        const isYes = args.includes('-y');
        if (cwdNode.children['package.json']) {
          output = 'npm ERR! package.json already exists';
        } else {
          const defaultPackageJson = {
            name: vfs.cwd.split('/').pop() || 'my-project',
            version: '1.0.0',
            description: '',
            main: 'index.js',
            scripts: {
              test: 'echo "Error: no test specified" && exit 1'
            },
            keywords: [],
            author: '',
            license: 'ISC'
          };
          cwdNode.children['package.json'] = {
            type: 'file',
            name: 'package.json',
            content: JSON.stringify(defaultPackageJson, null, 2),
            meta: createMetadata('file')
          };
          output = `Wrote to ${vfs.cwd}/package.json:\n\n${JSON.stringify(defaultPackageJson, null, 2)}`;
        }
      } else if (subcommand === 'install' || subcommand === 'i') {
        const packages = args.slice(2).filter(a => !a.startsWith('-'));
        
        if (!cwdNode.children['package.json']) {
          output = 'npm ERR! code ENOENT\nnpm ERR! syscall open\nnpm ERR! path ' + vfs.cwd + '/package.json\nnpm ERR! errno -2\nnpm ERR! enoent ENOENT: no such file or directory, open \'' + vfs.cwd + '/package.json\'';
          break;
        }

        const packageJsonFile = cwdNode.children['package.json'];
        if (packageJsonFile.type !== 'file') {
          output = 'npm ERR! package.json is not a file';
          break;
        }

        let packageJson;
        try {
          packageJson = JSON.parse(packageJsonFile.content);
        } catch (e) {
          output = 'npm ERR! Failed to parse package.json';
          break;
        }

        if (!packageJson.dependencies) {
          packageJson.dependencies = {};
        }

        if (packages.length > 0) {
          packages.forEach(pkg => {
            packageJson.dependencies[pkg] = '^1.0.0';
          });
          packageJsonFile.content = JSON.stringify(packageJson, null, 2);
          
          if (!cwdNode.children['node_modules']) {
            cwdNode.children['node_modules'] = { type: 'dir', name: 'node_modules', children: {}, meta: createMetadata('dir') };
          }
          
          const nodeModules = cwdNode.children['node_modules'];
          if (nodeModules.type === 'dir') {
            packages.forEach(pkg => {
              nodeModules.children[pkg] = { type: 'dir', name: pkg, children: {}, meta: createMetadata('dir') };
            });
          }

          output = `added ${packages.length} packages, and audited ${packages.length + 1} packages in 1s\n\nfound 0 vulnerabilities`;
        } else {
          const depsCount = Object.keys(packageJson.dependencies || {}).length;
          if (!cwdNode.children['node_modules']) {
            cwdNode.children['node_modules'] = { type: 'dir', name: 'node_modules', children: {}, meta: createMetadata('dir') };
          }
          output = `added ${depsCount} packages, and audited ${depsCount + 1} packages in 2s\n\nfound 0 vulnerabilities`;
        }
      } else if (subcommand === 'run') {
        const scriptName = args[2];
        if (!scriptName) {
          output = 'npm ERR! missing script name';
          break;
        }

        const packageJsonFile = cwdNode.children['package.json'];
        if (!packageJsonFile || packageJsonFile.type !== 'file') {
          output = 'npm ERR! missing package.json';
          break;
        }

        let packageJson;
        try {
          packageJson = JSON.parse(packageJsonFile.content);
        } catch (e) {
          output = 'npm ERR! Failed to parse package.json';
          break;
        }

        if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
          output = `npm ERR! missing script: ${scriptName}`;
          break;
        }

        const scriptCmd = packageJson.scripts[scriptName];
        output = `> ${packageJson.name}@${packageJson.version} ${scriptName}\n> ${scriptCmd}\n\n(Simulated execution of: ${scriptCmd})`;
      } else if (subcommand === 'start') {
        const packageJsonFile = cwdNode.children['package.json'];
        if (!packageJsonFile || packageJsonFile.type !== 'file') {
          output = 'npm ERR! missing package.json';
          break;
        }

        let packageJson;
        try {
          packageJson = JSON.parse(packageJsonFile.content);
        } catch (e) {
          output = 'npm ERR! Failed to parse package.json';
          break;
        }

        const scriptCmd = (packageJson.scripts && packageJson.scripts.start) ? packageJson.scripts.start : 'node server.js';
        output = `> ${packageJson.name}@${packageJson.version} start\n> ${scriptCmd}\n\n(Simulated execution of: ${scriptCmd})`;
      } else {
        output = `npm ERR! Unknown command: "${subcommand}"`;
      }
      break;
    }
    
    default:
      if (clonedVfs.installedPackages?.includes(cmd)) {
        if (cmd === 'htop') {
          output = `htop 3.0.5 - (C) 2004-2020 Hisham Muhammad\n  1  [||||||||||||||||||||||||||||||||||||||||||||||||||||||||100.0%]\n  2  [||||||||||||||||||||||||||||||||||||||||||||||||||||||||100.0%]\n  Mem[|||||||||||||||||||||||||||||||||||||||||||||||||2.50G/8.00G]\n  Swp[                                                    0K/2.00G]\n\n  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command\n    1 root       20   0  166M  11M   8M S  0.0  0.1  0:01.23 /sbin/init\n   42 user       20   0  12M   4M   3M S  0.0  0.0  0:00.10 bash\n 9999 user       20   0  10M   2M   1M R 99.9  0.0 12:34.56 infinite_loop`;
        } else if (cmd === 'neofetch') {
          output = `       _,met$$$$$gg.          user@linux\n    ,g$$$$$$$$$$$$$$$P.       ----------\n  ,g$$P"     """Y$$.".        OS: Ubuntu 20.04 LTS x86_64\n ,$$P'              \`$$$.     Host: Virtual Machine\n',$$P       ,ggs.     \`$$b:   Kernel: 5.4.0-generic\n\`d$$'     ,$P"'   .    $$$    Uptime: 1 day, 2 hours\n $$P      d$'     ,    $$P    Packages: 1500 (dpkg)\n $$:      $$.   -    ,d$$'    Shell: bash 5.0.17\n $$;      Y$b._   _,d$P'      Terminal: Web Terminal\n Y$$.    \`.\`"Y$$$$P"'         CPU: Virtual CPU @ 2.40GHz\n \`$$b      "-.__              Memory: 2560MiB / 8192MiB\n  \`Y$$b\n   \`Y$$.                      \n     \`$$b.\n       \`Y$$b.\n          \`"Y$b._\n              \`""""`;
        } else {
          output = `Executing ${cmd}... (Simulated output for installed package)`;
        }
      } else {
        output = `bash: ${cmd}: command not found`;
      }
  }

  // Handle redirection
  if (redirectTarget) {
    const targetPath = resolvePath(vfs.cwd, redirectTarget);
    const parentPath = resolvePath(targetPath, '..');
    const fileName = targetPath.split('/').pop()!;
    const parentNode = getNodeAtPath(clonedVfs.root, parentPath);

    if (parentNode && parentNode.type === 'dir') {
      const existingNode = parentNode.children[fileName];
      if (!existingNode || existingNode.type === 'file') {
        if (existingNode && redirectAppend) {
          (existingNode as VFSFile).content += ((existingNode as VFSFile).content ? '\n' : '') + output;
          if (existingNode.meta) existingNode.meta.modifiedAt = Date.now();
        } else {
          parentNode.children[fileName] = { type: 'file', name: fileName, content: output, meta: createMetadata('file') };
        }
        output = ''; // Output is redirected, so nothing prints to terminal
      } else {
        output = `bash: ${redirectTarget}: Is a directory`;
      }
    } else {
      output = `bash: ${redirectTarget}: No such file or directory`;
    }
  }

  return { output, newVfs: clonedVfs };
};
