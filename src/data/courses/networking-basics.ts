import { Course } from '../../core/types';
import { getNodeAtPath } from '../../core/vfs';

export const networkingBasics: Course = {
  id: "networking-basics",
  title: "Mạng máy tính Cơ bản",
  description: "Làm quen với các lệnh kiểm tra mạng và tải dữ liệu từ internet.",
  difficulty: "intermediate",
  prerequisites: ["linux-basics"],
  missions: [
    {
      id: "n1",
      title: "Kiểm tra kết nối",
      description: "Sử dụng lệnh 'ping google.com' để kiểm tra xem máy tính của bạn có kết nối được tới máy chủ của Google hay không.",
      successMessage: "Kết nối mạng hoạt động bình thường! (Trong thực tế, ping sẽ chạy liên tục cho đến khi bạn nhấn Ctrl+C)",
      solution: "ping google.com",
      validate: (_, cmd) => cmd.startsWith('ping') && cmd.includes('google.com')
    },
    {
      id: "n2",
      title: "Gọi API với curl",
      description: "Lệnh 'curl' giúp bạn lấy dữ liệu từ một URL. Hãy thử gọi API của GitHub bằng lệnh: curl https://api.github.com/users/octocat",
      successMessage: "Bạn đã nhận được dữ liệu JSON từ GitHub API!",
      solution: "curl https://api.github.com/users/octocat",
      validate: (_, cmd) => cmd.startsWith('curl') && cmd.includes('api.github.com')
    },
    {
      id: "n3",
      title: "Tải file với wget",
      description: "Lệnh 'wget' giúp bạn tải một file từ internet và lưu vào máy. Hãy tải file dữ liệu bằng lệnh: wget https://example.com/data.csv",
      successMessage: "File data.csv đã được tải về máy của bạn!",
      solution: "wget https://example.com/data.csv",
      validate: (vfs) => {
        const node = getNodeAtPath(vfs.root, '/home/user/data.csv');
        return node !== null && node.type === 'file';
      }
    },
    {
      id: "n4",
      title: "Kiểm tra file đã tải",
      description: "Hãy dùng lệnh 'cat data.csv' để xem nội dung file bạn vừa tải về.",
      successMessage: "Tuyệt vời! Bạn đã thấy nội dung file.",
      solution: "cat data.csv",
      validate: (_, cmd) => cmd === 'cat data.csv'
    },
    {
      id: "n5",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và hoàn thành khóa học.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học Mạng máy tính Cơ bản!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
