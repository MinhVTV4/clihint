import { Course } from '../../core/types';
import { getNodeAtPath, createMetadata } from '../../core/vfs';

export const fileManipulation: Course = {
  id: "file-manipulation",
  title: "Thao tác Nội dung File",
  description: "Học cách xem, tìm kiếm và chỉnh sửa nội dung bên trong các file văn bản.",
  difficulty: "beginner",
  prerequisites: ["bash-basics"],
  missions: [
    {
      id: "f1",
      title: "Đọc toàn bộ nội dung",
      description: "Sử dụng lệnh 'cat log.txt' để in toàn bộ nội dung của file ra màn hình.",
      successMessage: "Bạn đã đọc được nội dung file log!",
      solution: "cat log.txt",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['log.txt'] = { type: 'file', name: 'log.txt', content: 'System started\nUser logged in\nError: connection failed', meta: createMetadata('file') };
        }
        newVfs.cwd = '/home/user';
        return newVfs;
      },
      validate: (_, cmd) => cmd.startsWith('cat log.txt')
    },
    {
      id: "f2",
      title: "Ghi đè nội dung",
      description: "Tạo một file 'hello.txt' và ghi chữ 'Xin chao' vào đó bằng lệnh: echo \"Xin chao\" > hello.txt",
      successMessage: "Bạn đã tạo và ghi nội dung vào file thành công!",
      solution: "echo \"Xin chao\" > hello.txt",
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/hello.txt');
        return node !== null && node.type === 'file' && node.content === 'Xin chao';
      }
    },
    {
      id: "f3",
      title: "Ghi tiếp nội dung",
      description: "Thêm dòng 'Viet Nam' vào cuối file 'hello.txt' bằng lệnh: echo \"Viet Nam\" >> hello.txt",
      successMessage: "Nội dung đã được thêm vào cuối file!",
      solution: "echo \"Viet Nam\" >> hello.txt",
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/hello.txt');
        return node !== null && node.type === 'file' && node.content.includes('Xin chao') && node.content.includes('Viet Nam');
      }
    },
    {
      id: "f4",
      title: "Tìm kiếm chuỗi",
      description: "Tìm tất cả các dòng có chứa chữ 'admin' trong file 'users.csv' bằng lệnh: grep \"admin\" users.csv",
      successMessage: "Bạn đã tìm thấy user admin!",
      solution: "grep \"admin\" users.csv",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['users.csv'] = { type: 'file', name: 'users.csv', content: 'id,name,role\n1,john,user\n2,admin,admin\n3,mary,user', meta: createMetadata('file') };
        }
        return newVfs;
      },
      validate: (_, cmd) => cmd.startsWith('grep') && cmd.includes('admin') && cmd.includes('users.csv')
    },
    {
      id: "f5",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và hoàn thành khóa học.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học Thao tác Nội dung File!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
