import { Course } from '../../core/types';
import { getNodeAtPath } from '../../core/vfs';

export const bashBasics: Course = {
  id: "bash-basics",
  title: "Bash Cơ Bản",
  description: "Làm quen với các lệnh điều hướng và quản lý file cơ bản.",
  difficulty: "beginner",
  prerequisites: [],
  missions: [
    {
      id: "m1",
      title: "Khởi động",
      description: "Hãy kiểm tra xem bạn đang ở thư mục nào bằng lệnh in ra đường dẫn thư mục hiện tại (pwd).",
      successMessage: "Tuyệt vời! Bạn đang ở thư mục gốc.",
      solution: "pwd",
      validate: (_, cmd) => cmd === 'pwd'
    },
    {
      id: "m2",
      title: "Liệt kê",
      description: "Hãy xem trong thư mục này có những file và thư mục nào bằng lệnh 'ls'.",
      successMessage: "Tốt lắm! Bạn đã thấy danh sách các file.",
      solution: "ls",
      validate: (_, cmd) => cmd.startsWith('ls')
    },
    {
      id: "m3",
      title: "Tạo thư mục",
      description: "Hãy tạo một thư mục mới có tên là 'project' bằng lệnh 'mkdir'.",
      successMessage: "Thư mục 'project' đã được tạo thành công!",
      solution: "mkdir project",
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/project');
        return node !== null && node.type === 'dir';
      }
    },
    {
      id: "m4",
      title: "Di chuyển",
      description: "Bây giờ hãy di chuyển vào thư mục 'project' vừa tạo bằng lệnh 'cd'.",
      successMessage: "Bạn đã vào thư mục 'project'.",
      solution: "cd project",
      validate: (vfs) => vfs.cwd === '/home/user/project'
    },
    {
      id: "m5",
      title: "Tạo file",
      description: "Hãy tạo một file trống tên là 'readme.txt' bằng lệnh 'touch'.",
      successMessage: "File 'readme.txt' đã được tạo!",
      solution: "touch readme.txt",
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/project/readme.txt');
        return node !== null && node.type === 'file';
      }
    },
    {
      id: "m6",
      title: "Hoàn thành",
      description: "Bạn đã hoàn thành khóa học cơ bản. Gõ 'clear' để dọn dẹp màn hình.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học Bash Cơ Bản!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
