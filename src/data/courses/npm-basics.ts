import { Course } from '../../core/types';
import { getNodeAtPath, createMetadata } from '../../core/vfs';

export const npmBasics: Course = {
  id: "npm-basics",
  title: "Quản lý gói Node.js (NPM)",
  description: "Học cách sử dụng npm để quản lý các gói phụ thuộc và chạy script trong dự án Node.js.",
  difficulty: "intermediate",
  prerequisites: ["bash-basics"],
  missions: [
    {
      id: "npm1",
      title: "Khởi tạo dự án",
      description: "Hãy khởi tạo một dự án Node.js mới bằng lệnh 'npm init -y'. Lệnh này sẽ tạo ra file package.json.",
      successMessage: "Bạn đã tạo thành công file package.json!",
      solution: "npm init -y",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        newVfs.cwd = '/home/user';
        return newVfs;
      },
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/package.json');
        return node !== null && node.type === 'file';
      }
    },
    {
      id: "npm2",
      title: "Cài đặt thư viện",
      description: "Dự án của bạn cần thư viện 'express'. Hãy cài đặt nó bằng lệnh 'npm install express'.",
      successMessage: "Đã cài đặt express! Bạn có thể thấy thư mục node_modules xuất hiện.",
      solution: "npm install express",
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/node_modules/express');
        return node !== null && node.type === 'dir';
      }
    },
    {
      id: "npm3",
      title: "Thêm script",
      description: "Hệ thống đã thêm script 'start' vào package.json. Hãy chạy nó bằng lệnh 'npm start'.",
      successMessage: "Script đã chạy thành công!",
      solution: "npm start",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const packageJsonNode = getNodeAtPath(newVfs.root, '/home/user/package.json');
        if (packageJsonNode && packageJsonNode.type === 'file') {
          try {
            const pkg = JSON.parse(packageJsonNode.content);
            pkg.scripts = { ...pkg.scripts, start: "node index.js" };
            packageJsonNode.content = JSON.stringify(pkg, null, 2);
          } catch (e) {}
        }
        return newVfs;
      },
      validate: (_, cmd) => cmd === 'npm start'
    },
    {
      id: "npm4",
      title: "Chạy script tùy chỉnh",
      description: "Hệ thống đã thêm script 'dev' vào package.json. Hãy chạy nó bằng lệnh 'npm run dev'.",
      successMessage: "Script dev đã chạy thành công!",
      solution: "npm run dev",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        const packageJsonNode = getNodeAtPath(newVfs.root, '/home/user/package.json');
        if (packageJsonNode && packageJsonNode.type === 'file') {
          try {
            const pkg = JSON.parse(packageJsonNode.content);
            pkg.scripts = { ...pkg.scripts, dev: "nodemon index.js" };
            packageJsonNode.content = JSON.stringify(pkg, null, 2);
          } catch (e) {}
        }
        return newVfs;
      },
      validate: (_, cmd) => cmd === 'npm run dev'
    },
    {
      id: "npm5",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và hoàn thành khóa học.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học NPM Cơ bản!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
