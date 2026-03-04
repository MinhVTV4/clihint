import { Course } from '../../core/types';
import { getNodeAtPath, createMetadata } from '../../core/vfs';

export const advancedFileManagement: Course = {
  id: "advanced-file-management",
  title: "Quản lý File Nâng cao",
  description: "Hướng dẫn cách di chuyển, sao chép và đổi tên file/thư mục.",
  prerequisites: ["file-manipulation"],
  missions: [
    {
      id: "a1",
      title: "Sao chép file",
      description: "Tạo một bản sao lưu của file 'config.json' với tên 'config.json.bak' bằng lệnh 'cp'.",
      successMessage: "Đã sao chép file thành công!",
      solution: "cp config.json config.json.bak",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['config.json'] = { type: 'file', name: 'config.json', content: '{"port": 8080}', meta: createMetadata('file') };
        }
        newVfs.cwd = '/home/user';
        return newVfs;
      },
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/config.json.bak');
        return node !== null && node.type === 'file' && node.content === '{"port": 8080}';
      }
    },
    {
      id: "a2",
      title: "Sao chép thư mục",
      description: "Copy toàn bộ thư mục 'src' sang một thư mục mới tên là 'backup_src' bằng lệnh 'cp -r src backup_src'.",
      successMessage: "Đã sao chép toàn bộ thư mục!",
      solution: "cp -r src backup_src",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['src'] = { 
            type: 'dir', 
            name: 'src', 
            children: {
              'main.js': { type: 'file', name: 'main.js', content: 'console.log("hello");', meta: createMetadata('file') }
            },
            meta: createMetadata('dir')
          };
        }
        return newVfs;
      },
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/backup_src/main.js');
        return node !== null && node.type === 'file';
      }
    },
    {
      id: "a3",
      title: "Đổi tên file",
      description: "Đổi tên file 'OldName.txt' thành 'NewName.txt' bằng lệnh 'mv'.",
      successMessage: "Đã đổi tên file thành công!",
      solution: "mv OldName.txt NewName.txt",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['OldName.txt'] = { type: 'file', name: 'OldName.txt', content: 'old content', meta: createMetadata('file') };
        }
        return newVfs;
      },
      validate: (vfs) => {
        const oldNode = getNodeAtPath(vfs.root, '/home/user/OldName.txt');
        const newNode = getNodeAtPath(vfs.root, '/home/user/NewName.txt');
        return oldNode === null && newNode !== null && newNode.type === 'file';
      }
    },
    {
      id: "a4",
      title: "Di chuyển file",
      description: "Di chuyển file 'image.png' vào trong thư mục 'assets' bằng lệnh 'mv image.png assets/'.",
      successMessage: "Đã di chuyển file thành công!",
      solution: "mv image.png assets/",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['image.png'] = { type: 'file', name: 'image.png', content: 'binary_data', meta: createMetadata('file') };
          home.children['assets'] = { type: 'dir', name: 'assets', children: {}, meta: createMetadata('dir') };
        }
        return newVfs;
      },
      validate: (vfs) => {
        const oldNode = getNodeAtPath(vfs.root, '/home/user/image.png');
        const newNode = getNodeAtPath(vfs.root, '/home/user/assets/image.png');
        return oldNode === null && newNode !== null && newNode.type === 'file';
      }
    },
    {
      id: "a5",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và hoàn thành khóa học.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học Quản lý File Nâng cao!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
