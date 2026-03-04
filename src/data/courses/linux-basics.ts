import { Course } from '../../core/types';
import { getNodeAtPath, createMetadata } from '../../core/vfs';

export const linuxBasics: Course = {
  id: "linux-basics",
  title: "Linux/Bash Script Cơ bản",
  description: "Làm quen với các lệnh quản lý file, phân quyền và tìm kiếm trong Linux.",
  prerequisites: [],
  missions: [
    {
      id: "l1",
      title: "Đọc file với less",
      description: "Lệnh 'cat' in toàn bộ nội dung ra màn hình, nhưng nếu file quá dài thì sao? Hãy dùng lệnh 'less large_log.txt' để xem file một cách có kiểm soát.",
      successMessage: "Bạn đã mở file bằng less! (Trong thực tế, bạn nhấn 'q' để thoát)",
      solution: "less large_log.txt",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['large_log.txt'] = { type: 'file', name: 'large_log.txt', content: 'Line 1\nLine 2\n...\nLine 1000', meta: createMetadata('file') };
        }
        newVfs.cwd = '/home/user';
        return newVfs;
      },
      validate: (_, cmd) => cmd === 'less large_log.txt'
    },
    {
      id: "l2",
      title: "Tìm kiếm file với find",
      description: "Bạn quên mất file 'secret.txt' nằm ở đâu? Hãy dùng lệnh 'find . -name secret.txt' để tìm nó trong thư mục hiện tại và các thư mục con.",
      successMessage: "Đã tìm thấy file secret.txt!",
      solution: "find . -name secret.txt",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['hidden_folder'] = { 
            type: 'dir', 
            name: 'hidden_folder', 
            children: {
              'secret.txt': { type: 'file', name: 'secret.txt', content: 'You found me!', meta: createMetadata('file') }
            },
            meta: createMetadata('dir')
          };
        }
        return newVfs;
      },
      validate: (_, cmd) => cmd.startsWith('find') && cmd.includes('secret.txt')
    },
    {
      id: "l3",
      title: "Thay đổi quyền với chmod",
      description: "File 'script.sh' hiện không thể chạy được. Hãy cấp quyền thực thi (execute) cho nó bằng lệnh: chmod +x script.sh",
      successMessage: "Đã cấp quyền thực thi cho file!",
      solution: "chmod +x script.sh",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['script.sh'] = { type: 'file', name: 'script.sh', content: 'echo "Running script..."', meta: createMetadata('file') };
        }
        return newVfs;
      },
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/script.sh');
        return node !== null && node.type === 'file' && node.meta.permissions.includes('x');
      }
    },
    {
      id: "l4",
      title: "Thay đổi chủ sở hữu với chown",
      description: "Chuyển quyền sở hữu file 'data.db' cho user 'admin' bằng lệnh: chown admin data.db",
      successMessage: "Đã thay đổi chủ sở hữu file!",
      solution: "chown admin data.db",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['data.db'] = { type: 'file', name: 'data.db', content: 'binary data', meta: createMetadata('file') };
        }
        return newVfs;
      },
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/data.db');
        return node !== null && node.type === 'file' && node.meta.owner === 'admin';
      }
    },
    {
      id: "l5",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và hoàn thành khóa học.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học Linux/Bash Script Cơ bản!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
