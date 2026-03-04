import { Course } from '../../core/types';
import { getNodeAtPath, createMetadata } from '../../core/vfs';

export const ctfChallenge: Course = {
  id: "ctf-challenge",
  title: "CTF: Truy tìm Mã độc",
  description: "Chế độ Thử thách (Escape Room). Hệ thống đã bị hacker xâm nhập và để lại một mã độc. Bạn phải tự tìm cách lần ra manh mối, lấy quyền admin và tiêu diệt nó.",
  prerequisites: ["process-management"],
  missions: [
    {
      id: "ctf1",
      title: "Truy tìm và Tiêu diệt",
      description: "Hacker đã giấu một file tên là 'malware.sh' ở đâu đó trong hệ thống. File này chỉ có thể bị xóa bởi 'admin'.\n\nNHIỆM VỤ CỦA BẠN:\n1. Tìm một file ẩn chứa mật khẩu của admin.\n2. Đọc file đó để lấy mật khẩu.\n3. Chuyển sang user admin bằng lệnh: su admin <mật_khẩu>\n4. Tìm và xóa file 'malware.sh'.\n\nGợi ý: Hãy dùng 'ls -la' để xem file ẩn, 'cd' để di chuyển, 'cat' để đọc file, và 'find / -name malware.sh' để tìm vị trí mã độc.",
      successMessage: "Tuyệt vời! Bạn đã xóa thành công mã độc và cứu được hệ thống!",
      solution: "find / -name malware.sh, cat .secret, su admin password, rm malware.sh",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        
        // Create complex directory structure
        const root = newVfs.root;
        
        // /etc
        root.children['etc'] = {
          type: 'dir',
          name: 'etc',
          children: {
            'malware.sh': {
              type: 'file',
              name: 'malware.sh',
              content: '#!/bin/bash\necho "Hacked!"\nwhile true; do sleep 1; done',
              meta: { ...createMetadata('file'), owner: 'admin', permissions: 'rwxr-xr-x' }
            },
            'config.json': {
              type: 'file',
              name: 'config.json',
              content: '{"status": "ok"}',
              meta: createMetadata('file')
            }
          },
          meta: createMetadata('dir')
        };
        
        // /var/log/apache2
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
                    'access.log': {
                      type: 'file',
                      name: 'access.log',
                      content: '192.168.1.1 - - [04/Mar/2026:00:00:00 +0000] "GET / HTTP/1.1" 200',
                      meta: createMetadata('file')
                    },
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
    }
  ]
};
