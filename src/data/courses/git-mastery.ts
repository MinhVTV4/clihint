import { Course } from '../../core/types';
import { getNodeAtPath } from '../../core/vfs';

export const gitMastery: Course = {
  id: "git-mastery",
  title: "Git Thực chiến",
  description: "Mô phỏng lại quy trình làm việc cơ bản với Git.",
  prerequisites: ["advanced-file-management"],
  missions: [
    {
      id: "g1",
      title: "Khởi tạo Repository",
      description: "Biến thư mục này thành một Git repository bằng lệnh 'git init'.",
      successMessage: "Đã khởi tạo Git repository!",
      solution: "git init",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        newVfs.cwd = '/home/user';
        return newVfs;
      },
      validate: (vfs, cmd) => {
        const node = getNodeAtPath(vfs.root, '/home/user/.git');
        return cmd === 'git init' && node !== null && node.type === 'dir';
      }
    },
    {
      id: "g2",
      title: "Kiểm tra trạng thái",
      description: "Hệ thống đã tạo 2 file mới 'index.html' và 'style.css'. Hãy gõ 'git status' để xem trạng thái.",
      successMessage: "Bạn đã xem trạng thái các file.",
      solution: "git status",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const home = getNodeAtPath(newVfs.root, '/home/user');
        if (home && home.type === 'dir') {
          home.children['index.html'] = { type: 'file', name: 'index.html', content: '<h1>Hello</h1>' };
          home.children['style.css'] = { type: 'file', name: 'style.css', content: 'body { color: red; }' };
        }
        return newVfs;
      },
      validate: (_, cmd) => cmd === 'git status'
    },
    {
      id: "g3",
      title: "Đưa file vào Staging",
      description: "Thêm tất cả các file thay đổi vào Staging Area bằng lệnh 'git add .'.",
      successMessage: "Các file đã được đưa vào Staging Area!",
      solution: "git add .",
      validate: (_, cmd) => cmd === 'git add .' || cmd === 'git add index.html style.css'
    },
    {
      id: "g4",
      title: "Lưu lại phiên bản",
      description: "Tạo một commit đầu tiên với lời nhắn 'Initial commit' bằng lệnh: git commit -m \"Initial commit\"",
      successMessage: "Đã tạo commit thành công!",
      solution: "git commit -m \"Initial commit\"",
      validate: (_, cmd) => cmd.startsWith('git commit') && cmd.includes('Initial commit')
    },
    {
      id: "g5",
      title: "Xem lịch sử commit",
      description: "Hãy xem lại lịch sử các commit bạn vừa tạo bằng lệnh 'git log'.",
      successMessage: "Bạn đã xem lịch sử commit!",
      solution: "git log",
      validate: (_, cmd) => cmd === 'git log'
    },
    {
      id: "g6",
      title: "Tạo nhánh mới",
      description: "Tạo một nhánh mới tên là 'feature-login' bằng lệnh: git branch feature-login",
      successMessage: "Đã tạo nhánh feature-login!",
      solution: "git branch feature-login",
      validate: (_, cmd) => cmd === 'git branch feature-login'
    },
    {
      id: "g7",
      title: "Chuyển nhánh",
      description: "Chuyển sang nhánh vừa tạo bằng lệnh: git checkout feature-login",
      successMessage: "Đã chuyển sang nhánh feature-login!",
      solution: "git checkout feature-login",
      validate: (_, cmd) => cmd === 'git checkout feature-login'
    },
    {
      id: "g8",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và hoàn thành khóa học.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học Git Thực chiến!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
