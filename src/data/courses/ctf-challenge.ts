import { Course } from '../../core/types';
import { getNodeAtPath, createMetadata } from '../../core/vfs';

export const ctfChallenge: Course = {
  id: "ctf-challenge",
  title: "CTF: Thử thách Hacker",
  description: "Chế độ Thử thách (Escape Room) với nhiều cấp độ từ dễ đến khó. Bạn phải tự vận dụng mọi kiến thức đã học để giải quyết các vấn đề do hacker gây ra.",
  difficulty: "advanced",
  prerequisites: ["process-management"],
  missions: [
    {
      id: "ctf1",
      title: "Thử thách 1: Tìm cờ (Dễ)",
      description: "Hacker đã giấu một file tên là 'flag.txt' ở đâu đó trong thư mục '/home/user'. Hãy tìm nó và sao chép (cp) nó ra ngay thư mục '/home/user' với tên 'victory.txt'.\n\nGợi ý: Dùng 'ls -la' để tìm các thư mục ẩn, và 'cp <nguồn> <đích>' để sao chép.",
      successMessage: "Bạn đã tìm thấy cờ! Khởi động rất tốt.",
      solution: "cp documents/.hidden_folder/flag.txt /home/user/victory.txt",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const userDir = newVfs.root.children['home'].children['user'];
        
        userDir.children['documents'] = {
          type: 'dir',
          name: 'documents',
          children: {
            '.hidden_folder': {
              type: 'dir',
              name: '.hidden_folder',
              children: {
                'flag.txt': {
                  type: 'file',
                  name: 'flag.txt',
                  content: 'CTF{y0u_f0und_m3}',
                  meta: createMetadata('file')
                }
              },
              meta: createMetadata('dir')
            }
          },
          meta: createMetadata('dir')
        };
        
        return newVfs;
      },
      validate: (vfs) => {
        const victoryNode = getNodeAtPath(vfs.root, '/home/user/victory.txt');
        return victoryNode !== null && victoryNode.type === 'file';
      }
    },
    {
      id: "ctf2",
      title: "Thử thách 2: Khôi phục cấu hình (Trung bình)",
      description: "Hacker đã đổi tên file cấu hình mạng và giấu nó đi. Hãy tìm file có đuôi '.bak' trong thư mục '/etc', và đổi tên (mv) nó lại thành 'network.conf' (nằm ngay trong thư mục chứa file '.bak' đó).\n\nGợi ý: Dùng 'find /etc -name \"*.bak\"' để tìm file.",
      successMessage: "Cấu hình mạng đã được khôi phục!",
      solution: "find /etc -name \"*.bak\", mv /etc/network/.network.conf.bak /etc/network/network.conf",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const root = newVfs.root;
        
        if (!root.children['etc']) {
          root.children['etc'] = { type: 'dir', name: 'etc', children: {}, meta: createMetadata('dir') };
        }
        
        root.children['etc'].children['network'] = {
          type: 'dir',
          name: 'network',
          children: {
            '.network.conf.bak': {
              type: 'file',
              name: '.network.conf.bak',
              content: 'IP=192.168.1.100\nGATEWAY=192.168.1.1',
              meta: createMetadata('file')
            }
          },
          meta: createMetadata('dir')
        };
        
        return newVfs;
      },
      validate: (vfs) => {
        const oldNode = getNodeAtPath(vfs.root, '/etc/network/.network.conf.bak');
        const newNode = getNodeAtPath(vfs.root, '/etc/network/network.conf');
        return oldNode === null && newNode !== null && newNode.type === 'file';
      }
    },
    {
      id: "ctf3",
      title: "Thử thách 3: Truy tìm Mã độc (Khó)",
      description: "Hacker đã giấu một file tên là 'malware.sh' ở đâu đó trong hệ thống. File này chỉ có thể bị xóa bởi 'admin'.\n\nNHIỆM VỤ CỦA BẠN:\n1. Tìm một file ẩn chứa mật khẩu của admin.\n2. Đọc file đó để lấy mật khẩu.\n3. Chuyển sang user admin bằng lệnh: su admin <mật_khẩu>\n4. Tìm và xóa file 'malware.sh'.\n\nGợi ý: Hãy dùng 'find / -name malware.sh' để tìm vị trí mã độc. Mật khẩu có thể giấu trong /var/log.",
      successMessage: "Tuyệt vời! Bạn đã xóa thành công mã độc và cứu được hệ thống!",
      solution: "find / -name malware.sh, cat /var/log/apache2/.secret, su admin pwned2026, rm /etc/malware.sh",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const root = newVfs.root;
        
        if (!root.children['etc']) {
          root.children['etc'] = { type: 'dir', name: 'etc', children: {}, meta: createMetadata('dir') };
        }
        
        root.children['etc'].children['malware.sh'] = {
          type: 'file',
          name: 'malware.sh',
          content: '#!/bin/bash\necho "Hacked!"\nwhile true; do sleep 1; done',
          meta: { ...createMetadata('file'), owner: 'admin', permissions: 'rwxr-xr-x' }
        };
        
        root.children['var'] = {
          type: 'dir',
          name: 'var',
          children: {
            'log': {
              type: 'dir',
              name: 'log',
              children: {
                'apache2': {
                  type: 'dir',
                  name: 'apache2',
                  children: {
                    '.secret': {
                      type: 'file',
                      name: '.secret',
                      content: 'Ghi chú của Hacker: Mật khẩu admin là pwned2026. Đừng để ai biết!',
                      meta: createMetadata('file')
                    }
                  },
                  meta: createMetadata('dir')
                }
              },
              meta: createMetadata('dir')
            }
          },
          meta: createMetadata('dir')
        };
        
        return newVfs;
      },
      validate: (vfs) => {
        const malwareNode = getNodeAtPath(vfs.root, '/etc/malware.sh');
        return malwareNode === null;
      }
    },
    {
      id: "ctf4",
      title: "Thử thách 4: Tiêu diệt tiến trình đào coin (Chuyên gia)",
      description: "Hệ thống đang rất chậm. Có vẻ hacker đang chạy một tiến trình đào coin ngầm. Hãy tìm tiến trình đó, tiêu diệt nó (kill), sau đó xóa file thực thi của nó nằm ở đâu đó trong '/tmp'.\n\nGợi ý: Dùng 'top' hoặc 'ps aux' để tìm tiến trình ngốn nhiều CPU nhất. Sau đó dùng 'kill <PID>' để diệt nó. Cuối cùng tìm và xóa file ẩn trong '/tmp'.",
      successMessage: "Bạn đã tiêu diệt thành công tiến trình đào coin! Hệ thống đã mượt mà trở lại.",
      solution: "top, kill 666, rm /tmp/.crypto_miner",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const root = newVfs.root;
        
        // Add process
        if (!newVfs.processes) newVfs.processes = [];
        newVfs.processes.push({
          pid: 666,
          user: 'hacker',
          command: './.crypto_miner',
          cpu: 99.9,
          mem: 45.2,
          status: 'R'
        });
        
        // Add file
        root.children['tmp'] = {
          type: 'dir',
          name: 'tmp',
          children: {
            '.crypto_miner': {
              type: 'file',
              name: '.crypto_miner',
              content: '0101010101010101010101010101',
              meta: { ...createMetadata('file'), owner: 'hacker', permissions: 'rwxr-xr-x' }
            }
          },
          meta: createMetadata('dir')
        };
        
        // Make sure user can delete it (or they need to be admin)
        // Let's make it deletable by user for simplicity, or they can use admin if they are still admin from previous mission
        // Actually, previous mission might have left them as admin. Let's make owner 'user' so anyone can delete it, or 'hacker' but give it 777 permissions?
        // Wait, rm checks owner. If owner is 'hacker', user can't delete it unless they are root/admin.
        // Let's make owner 'user' so they can delete it without needing su again, or they can use su admin.
        root.children['tmp'].children['.crypto_miner'].meta.owner = 'user';
        
        return newVfs;
      },
      validate: (vfs) => {
        const processExists = vfs.processes?.some(p => p.pid === 666);
        const fileNode = getNodeAtPath(vfs.root, '/tmp/.crypto_miner');
        return !processExists && fileNode === null;
      }
    },
    {
      id: "ctf5",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và nhận chứng nhận Hacker mũ trắng!",
      successMessage: "Chúc mừng bạn đã phá đảo toàn bộ thử thách CTF!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
