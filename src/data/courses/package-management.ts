import { Course } from '../../core/types';

export const packageManagement: Course = {
  id: "package-management",
  title: "Quản lý Gói phần mềm",
  description: "Học cách cài đặt và cập nhật các phần mềm trên hệ thống Linux bằng lệnh apt.",
  prerequisites: ["linux-basics"],
  missions: [
    {
      id: "pm1",
      title: "Cập nhật danh sách phần mềm",
      description: "Trước khi cài đặt bất kỳ phần mềm nào, bạn cần cập nhật danh sách các gói phần mềm mới nhất từ máy chủ bằng lệnh: apt update",
      successMessage: "Danh sách phần mềm đã được cập nhật thành công!",
      solution: "apt update",
      validate: (_, cmd) => cmd === 'apt update'
    },
    {
      id: "pm2",
      title: "Cài đặt phần mềm",
      description: "Hệ thống của bạn chưa có công cụ 'htop'. Hãy cài đặt nó bằng lệnh: apt install htop",
      successMessage: "Phần mềm htop đã được cài đặt vào hệ thống!",
      solution: "apt install htop",
      validate: (vfs) => {
        return vfs.installedPackages ? vfs.installedPackages.includes('htop') : false;
      }
    },
    {
      id: "pm3",
      title: "Chạy phần mềm vừa cài",
      description: "Bây giờ bạn đã có 'htop', hãy gõ 'htop' để mở trình quản lý tiến trình nâng cao này.",
      successMessage: "Bạn đã mở thành công htop!",
      solution: "htop",
      validate: (_, cmd) => cmd === 'htop'
    },
    {
      id: "pm4",
      title: "Cài đặt neofetch",
      description: "Hãy cài thêm một công cụ vui vẻ tên là 'neofetch' để hiển thị thông tin hệ thống: apt install neofetch",
      successMessage: "Đã cài đặt neofetch!",
      solution: "apt install neofetch",
      validate: (vfs) => {
        return vfs.installedPackages ? vfs.installedPackages.includes('neofetch') : false;
      }
    },
    {
      id: "pm5",
      title: "Chạy neofetch",
      description: "Gõ 'neofetch' để xem thành quả của bạn.",
      successMessage: "Logo hệ điều hành thật đẹp phải không!",
      solution: "neofetch",
      validate: (_, cmd) => cmd === 'neofetch'
    },
    {
      id: "pm6",
      title: "Hoàn thành",
      description: "Gõ 'clear' để dọn dẹp màn hình và hoàn thành khóa học.",
      successMessage: "Chúc mừng bạn đã hoàn thành khóa học Quản lý Gói phần mềm!",
      solution: "clear",
      validate: (_, cmd) => cmd === 'clear'
    }
  ]
};
