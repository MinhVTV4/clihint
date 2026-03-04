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
      
      const isRecursive = args.filter(a => a.startsWith('-')).some(o => o.includes('r'));
      if (parentNode.children[fileName].type === 'dir' && !isRecursive) {
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
    
      case 'ping': {
      if (!args[1]) {
        output = 'ping: usage error: Destination address required';
        break;
      }
      output = `PING ${args[1]} (192.168.1.1): 56 data bytes\n64 bytes from 192.168.1.1: icmp_seq=0 ttl=64 time=1.234 ms\n64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=1.102 ms\n64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=1.123 ms\n--- ${args[1]} ping statistics ---\n3 packets transmitted, 3 packets received, 0.0% packet loss`;
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
