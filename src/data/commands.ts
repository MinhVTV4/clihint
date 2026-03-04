export interface CommandOption {
  name: string;
  description: string;
}

export interface CommandDefinition {
  name: string;
  description: string;
  options?: CommandOption[];
  subcommands?: CommandDefinition[];
}

export const commands: CommandDefinition[] = [
  {
    name: "ls",
    description: "Liệt kê danh sách file và thư mục",
    options: [
      { name: "-l", description: "Hiển thị chi tiết (long format)" },
      { name: "-a", description: "Hiển thị cả file ẩn (bắt đầu bằng dấu .)" },
      { name: "-la", description: "Hiển thị chi tiết bao gồm cả file ẩn" }
    ]
  },
  {
    name: "cd",
    description: "Di chuyển giữa các thư mục",
    options: [
      { name: "..", description: "Lên thư mục cha" },
      { name: "~", description: "Về thư mục home" },
      { name: "-", description: "Về thư mục trước đó" }
    ]
  },
  {
    name: "mkdir",
    description: "Tạo thư mục mới",
    options: [
      { name: "-p", description: "Tạo cả thư mục cha nếu chưa tồn tại" }
    ]
  },
  {
    name: "rm",
    description: "Xóa file hoặc thư mục",
    options: [
      { name: "-r", description: "Xóa thư mục và toàn bộ nội dung bên trong" },
      { name: "-f", description: "Xóa ép buộc, không hỏi lại" },
      { name: "-rf", description: "Xóa ép buộc thư mục và toàn bộ nội dung" }
    ]
  },
  {
    name: "touch",
    description: "Tạo một file trống mới hoặc cập nhật thời gian sửa đổi file"
  },
  {
    name: "pwd",
    description: "In ra đường dẫn thư mục hiện tại"
  },
  {
    name: "echo",
    description: "In ra màn hình một chuỗi văn bản"
  },
  {
    name: "clear",
    description: "Xóa sạch màn hình terminal"
  },
  {
    name: "cat",
    description: "Xem toàn bộ nội dung của một file"
  },
  {
    name: "grep",
    description: "Tìm kiếm chuỗi trong file",
    options: [
      { name: "-i", description: "Không phân biệt hoa thường" },
      { name: "-r", description: "Tìm kiếm đệ quy trong thư mục" }
    ]
  },
  {
    name: "head",
    description: "Xem phần đầu của file (mặc định 10 dòng)"
  },
  {
    name: "tail",
    description: "Xem phần cuối của file (mặc định 10 dòng)"
  },
  {
    name: "cp",
    description: "Sao chép file hoặc thư mục",
    options: [
      { name: "-r", description: "Sao chép đệ quy (dùng cho thư mục)" }
    ]
  },
  {
    name: "mv",
    description: "Di chuyển hoặc đổi tên file/thư mục"
  },
  {
    name: "find",
    description: "Tìm kiếm file và thư mục",
    options: [
      { name: "-name", description: "Tìm theo tên file/thư mục" }
    ]
  },
  {
    name: "ping",
    description: "Kiểm tra kết nối mạng đến một địa chỉ IP hoặc tên miền. Có thể thêm tùy chọn timeout (mặc định 5 giây nếu không cung cấp).",
    options: [
      { name: "-w", description: "Thời gian chờ tối đa (timeout) tính bằng giây" }
    ]
  },
  {
    name: "curl",
    description: "Tải nội dung từ một URL (thường dùng cho API)"
  },
  {
    name: "wget",
    description: "Tải file từ internet về máy"
  },
  {
    name: "apt",
    description: "Trình quản lý gói của Ubuntu/Debian (cài đặt, cập nhật phần mềm)",
    options: [
      { name: "update", description: "Cập nhật danh sách các gói phần mềm" },
      { name: "install", description: "Cài đặt một gói phần mềm mới" }
    ]
  },
  {
    name: "su",
    description: "Chuyển đổi người dùng (Switch User)"
  },
  {
    name: "ps",
    description: "Xem danh sách các tiến trình đang chạy",
    options: [
      { name: "aux", description: "Xem tất cả tiến trình của mọi người dùng" }
    ]
  },
  {
    name: "kill",
    description: "Gửi tín hiệu để tiêu diệt một tiến trình",
    options: [
      { name: "-9", description: "Tiêu diệt ngay lập tức (SIGKILL)" }
    ]
  },
  {
    name: "top",
    description: "Theo dõi tài nguyên hệ thống và tiến trình theo thời gian thực"
  },
  {
    name: "chmod",
    description: "Thay đổi quyền truy cập của file/thư mục"
  },
  {
    name: "chown",
    description: "Thay đổi chủ sở hữu của file/thư mục"
  },
  {
    name: "less",
    description: "Xem nội dung file từng trang một"
  },
  {
    name: "whoami",
    description: "Hiển thị tên người dùng hiện tại"
  },
  {
    name: "date",
    description: "Hiển thị ngày giờ hệ thống"
  },
  {
    name: "uptime",
    description: "Hiển thị thời gian hệ thống đã hoạt động"
  },
  {
    name: "uname",
    description: "Hiển thị thông tin hệ điều hành",
    options: [
      { name: "-a", description: "Hiển thị tất cả thông tin chi tiết" }
    ]
  },
  {
    name: "wc",
    description: "Đếm số dòng, số từ và số byte của file",
    options: [
      { name: "-l", description: "Chỉ đếm số dòng" },
      { name: "-w", description: "Chỉ đếm số từ" },
      { name: "-c", description: "Chỉ đếm số byte" }
    ]
  },
  {
    name: "df",
    description: "Hiển thị dung lượng đĩa trống trên các phân vùng hệ thống",
    options: [
      { name: "-h", description: "Hiển thị dung lượng dễ đọc (Human-readable)" }
    ]
  },
  {
    name: "free",
    description: "Hiển thị dung lượng RAM trống và đã sử dụng",
    options: [
      { name: "-h", description: "Hiển thị dung lượng dễ đọc (Human-readable)" }
    ]
  },
  {
    name: "git",
    description: "Công cụ quản lý phiên bản mã nguồn",
    subcommands: [
      { name: "init", description: "Khởi tạo một Git repository mới" },
      { name: "status", description: "Xem trạng thái các file trong repository" },
      { name: "add", description: "Thêm file vào staging area", options: [{ name: ".", description: "Thêm tất cả các file thay đổi" }] },
      { name: "commit", description: "Lưu lại các thay đổi", options: [{ name: "-m", description: "Kèm theo lời nhắn (message)" }] },
      { name: "log", description: "Xem lịch sử các commit" },
      { name: "branch", description: "Quản lý các nhánh (branch)" },
      { name: "checkout", description: "Chuyển đổi giữa các nhánh hoặc khôi phục file", options: [{ name: "-b", description: "Tạo và chuyển sang nhánh mới" }] },
      { name: "push", description: "Đẩy code lên remote repository" },
      { name: "pull", description: "Lấy code mới nhất từ remote về" },
      { name: "clone", description: "Tải một repository từ internet về máy" }
    ]
  },
  {
    name: "npm",
    description: "Trình quản lý gói cho Node.js",
    subcommands: [
      { name: "init", description: "Khởi tạo một dự án Node.js mới (tạo package.json)", options: [{ name: "-y", description: "Bỏ qua các câu hỏi và dùng giá trị mặc định" }] },
      { name: "install", description: "Cài đặt các gói phụ thuộc (hoặc dùng 'i')" },
      { name: "start", description: "Chạy script 'start' trong package.json" },
      { name: "run", description: "Chạy một script được định nghĩa trong package.json" }
    ]
  }
];
