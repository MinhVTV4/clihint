import { Course } from '../../core/types';

export const sandboxMode: Course = {
  id: "sandbox",
  title: "Sandbox (Chế độ Tự do)",
  description: "Khu vực thử nghiệm tự do. Không có nhiệm vụ, không có ràng buộc. Bạn có toàn quyền sử dụng hệ thống file ảo này để thử nghiệm mọi lệnh đã học.",
  difficulty: "sandbox",
  prerequisites: [],
  missions: [
    {
      id: "sandbox-1",
      title: "Khu vực Thử nghiệm",
      description: "Gõ bất kỳ lệnh nào bạn muốn. Hệ thống file ảo (VFS) sẽ cập nhật theo thời gian thực.\n\n- Dùng 'mkdir', 'touch' để tạo thư mục/file.\n- Dùng 'cd', 'ls' để di chuyển và xem.\n- Dùng 'rm', 'mv', 'cp' để thao tác.\n- Dùng 'ps', 'top', 'kill' để quản lý tiến trình.\n- Dùng 'apt install' để cài phần mềm ảo.\n\nBạn có thể nhấn nút 'Làm mới khóa học' (biểu tượng xoay vòng) ở góc trên bên phải để khôi phục hệ thống về trạng thái ban đầu.",
      successMessage: "",
      solution: "never-match-this-string",
      validate: () => false // Never completes, so user stays in this mission forever
    }
  ]
};
