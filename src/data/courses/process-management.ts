import { Course } from '../../core/types';

export const processManagement: Course = {
  id: "process-management",
  title: "Quản lý Tiến trình",
  description: "Học cách xem, theo dõi và quản lý các tiến trình đang chạy trong hệ thống bằng ps, top và kill.",
  prerequisites: ["linux-basics"],
  missions: [
    {
      id: "p1",
      title: "Xem danh sách tiến trình",
      description: "Sử dụng lệnh 'ps' để xem danh sách các tiến trình đang chạy của bạn.",
      successMessage: "Bạn đã xem được danh sách tiến trình!",
      solution: "ps",
      validate: (_, cmd) => cmd === 'ps'
    },
    {
      id: "p2",
      title: "Xem tất cả tiến trình",
      description: "Sử dụng lệnh 'ps aux' để xem tất cả các tiến trình trên hệ thống, bao gồm cả của người dùng khác.",
      successMessage: "Bạn đã thấy toàn bộ tiến trình hệ thống!",
      solution: "ps aux",
      validate: (_, cmd) => cmd === 'ps aux'
    },
    {
      id: "p3",
      title: "Theo dõi hệ thống",
      description: "Lệnh 'top' giúp theo dõi tài nguyên hệ thống theo thời gian thực. Hãy gõ 'top' (trong môi trường này, nó sẽ in ra một bản chụp nhanh).",
      successMessage: "Bạn đã mở trình theo dõi hệ thống!",
      solution: "top",
      validate: (_, cmd) => cmd === 'top'
    },
    {
      id: "p4",
      title: "Tạo một tiến trình chạy ngầm",
      description: "Hệ thống vừa tạo một tiến trình bị treo tên là 'infinite_loop'. Hãy dùng 'ps aux' để tìm PID của nó.",
      successMessage: "Bạn đã thấy tiến trình infinite_loop!",
      solution: "ps aux",
      setupVFS: (vfs) => {
        const newVfs = JSON.parse(JSON.stringify(vfs));
        if (!newVfs.processes) newVfs.processes = [];
        newVfs.processes.push({
          pid: 9999,
          user: 'user',
          command: 'infinite_loop',
          cpu: 99.9,
          mem: 1.2,
          status: 'R'
        });
        return newVfs;
      },
      validate: (_, cmd) => cmd === 'ps aux'
    },
    {
      id: "p5",
      title: "Tiêu diệt tiến trình",
      description: "Tiến trình 'infinite_loop' có PID là 9999 đang ngốn 99.9% CPU. Hãy tiêu diệt nó bằng lệnh 'kill 9999'.",
      successMessage: "Tiến trình đã bị tiêu diệt! Hệ thống đã trở lại bình thường.",
      solution: "kill 9999",
      validate: (vfs) => {
        return vfs.processes ? !vfs.processes.some(p => p.pid === 9999) : true;
      }
    },
    {
      id: "p6",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và hoàn thành khóa học.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học Quản lý Tiến trình!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
