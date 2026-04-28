/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "vi" | "en";
export type AppTheme = "light" | "dark";

export const LANGUAGE_FLAG_IMAGES: Record<AppLanguage, string> = {
  vi: "https://old-stdportal.tdtu.edu.vn/images/Flag_of_Vietnam.png",
  en: "https://old-stdportal.tdtu.edu.vn/images/Flag_of_the_United_Kingdom.png",
};

type TranslationKey =
  | "app.name"
  | "app.subtitle"
  | "common.language"
  | "common.theme"
  | "common.light"
  | "common.dark"
  | "common.logout"
  | "common.notifications"
  | "auth.hero.line1"
  | "auth.hero.line2"
  | "auth.hero.subtitle"
  | "auth.hero.cta"
  | "auth.login"
  | "auth.register"
  | "auth.username"
  | "auth.password"
  | "auth.fullName"
  | "auth.email"
  | "auth.confirmPassword"
  | "auth.forgotPassword"
  | "auth.loginSubmit"
  | "auth.loginLoading"
  | "auth.registerSubmit"
  | "auth.registerLoading"
  | "auth.requiredUsername"
  | "auth.requiredPassword"
  | "auth.invalidLogin"
  | "auth.requiredRegister"
  | "auth.passwordMismatch"
  | "auth.registerFailed"
  | "auth.unknownError"
  | "auth.registerSuccess"
  | "nav.dashboard"
  | "nav.medicine"
  | "nav.medicineRequest"
  | "nav.inventory"
  | "nav.stockHistory"
  | "nav.stockExport"
  | "nav.stockImport"
  | "nav.audit"
  | "nav.auditCreate"
  | "nav.profile"
  | "nav.medicineRequestCreate"
  | "role.requester"
  | "role.storekeeper"
  | "role.manager"
  | "dashboard.title"
  | "dashboard.totalSkus"
  | "dashboard.totalBatches"
  | "dashboard.nearExpiry"
  | "dashboard.expired"
  | "dashboard.totalStock"
  | "dashboard.quickActions"
  | "dashboard.skuManaged"
  | "dashboard.batchInStock"
  | "dashboard.needsAttention"
  | "dashboard.handleNow"
  | "quick.warehouseMap"
  | "quick.handleExport"
  | "quick.handleImport"
  | "quick.createImportNotice"
  | "quick.addMedicine"
  | "quick.createAudit"
  | "quick.createRequest";

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  vi: {
    "app.name": "Pharma WMS",
    "app.subtitle": "Kho thuốc",
    "common.language": "Ngôn ngữ",
    "common.theme": "Giao diện",
    "common.light": "Sáng",
    "common.dark": "Tối",
    "common.logout": "Đăng xuất",
    "common.notifications": "Thông báo",
    "auth.hero.line1": "Pharma WMS ",
    "auth.hero.line2": "Hệ thống quản lý kho thuốc",
    "auth.hero.subtitle":
      "Quản lý thuốc, nhập xuất kho, kiểm kê và báo cáo",
    "auth.hero.cta": "Truy cập hệ thống",
    "auth.login": "Đăng nhập",
    "auth.register": "Đăng ký",
    "auth.username": "Tên đăng nhập",
    "auth.password": "Mật khẩu",
    "auth.fullName": "Họ và tên",
    "auth.email": "Email",
    "auth.confirmPassword": "Xác nhận mật khẩu",
    "auth.forgotPassword": "Quên mật khẩu?",
    "auth.loginSubmit": "Vào hệ thống",
    "auth.loginLoading": "Đang đăng nhập...",
    "auth.registerSubmit": "Xác nhận",
    "auth.registerLoading": "Đang xử lý...",
    "auth.requiredUsername": "Vui lòng nhập tài khoản",
    "auth.requiredPassword": "Vui lòng nhập mật khẩu",
    "auth.invalidLogin": "Sai tài khoản hoặc mật khẩu",
    "auth.requiredRegister": "Vui lòng nhập đầy đủ thông tin",
    "auth.passwordMismatch": "Mật khẩu không khớp",
    "auth.registerFailed": "Đăng ký thất bại",
    "auth.unknownError": "Lỗi không xác định",
    "auth.registerSuccess": "Đăng ký thành công. Vui lòng đăng nhập.",
    "nav.dashboard": "Tổng quan",
    "nav.medicine": "Danh sách thuốc",
    "nav.medicineRequest": "Yêu cầu lấy thuốc",
    "nav.inventory": "Kho thuốc",
    "nav.stockHistory": "Lịch sử kho",
    "nav.stockExport": "Yêu cầu xuất kho",
    "nav.stockImport": "Thông báo nhập kho",
    "nav.audit": "Kiểm kê",
    "nav.auditCreate": "Tạo đợt kiểm kê",
    "nav.profile": "Hồ sơ cá nhân",
    "nav.medicineRequestCreate": "Tạo yêu cầu lấy thuốc",
    "role.requester": "Trình dược viên",
    "role.storekeeper": "Thủ kho",
    "role.manager": "Quản lý kho",
    "dashboard.title": "Tổng quan kho",
    "dashboard.totalSkus": "Tổng mặt hàng",
    "dashboard.totalBatches": "Tổng lô hàng",
    "dashboard.nearExpiry": "Lô cận date",
    "dashboard.expired": "Lô hết hạn",
    "dashboard.totalStock": "Tổng tồn kho (đơn vị)",
    "dashboard.quickActions": "Thao tác nhanh",
    "dashboard.skuManaged": "SKU đang quản lý",
    "dashboard.batchInStock": "lô có tồn kho",
    "dashboard.needsAttention": "lô hàng cần chú ý",
    "dashboard.handleNow": "Cần xử lý ngay",
    "quick.warehouseMap": "Sơ đồ kho",
    "quick.handleExport": "Xử lý xuất kho",
    "quick.handleImport": "Xử lý nhập kho",
    "quick.createImportNotice": "Gửi thông báo nhập kho",
    "quick.addMedicine": "Thêm thuốc",
    "quick.createAudit": "Tạo đợt kiểm kê",
    "quick.createRequest": "Tạo yêu cầu",
  },
  en: {
    "app.name": "Pharma WMS",
    "app.subtitle": "Medicine warehouse",
    "common.language": "Language",
    "common.theme": "Theme",
    "common.light": "Light",
    "common.dark": "Dark",
    "common.logout": "Log out",
    "common.notifications": "Notifications",
    "auth.hero.line1": "A management system for",
    "auth.hero.line2": "efficient medicine warehouses",
    "auth.hero.subtitle":
      "Manage medicines, stock movement, audits, and reports for pharmacists, storekeepers, and managers",
    "auth.hero.cta": "Access system",
    "auth.login": "Log in",
    "auth.register": "Sign up",
    "auth.username": "Username",
    "auth.password": "Password",
    "auth.fullName": "Full name",
    "auth.email": "Email",
    "auth.confirmPassword": "Confirm password",
    "auth.forgotPassword": "Forgot password?",
    "auth.loginSubmit": "Enter system",
    "auth.loginLoading": "Logging in...",
    "auth.registerSubmit": "Confirm",
    "auth.registerLoading": "Processing...",
    "auth.requiredUsername": "Please enter your username",
    "auth.requiredPassword": "Please enter your password",
    "auth.invalidLogin": "Incorrect username or password",
    "auth.requiredRegister": "Please fill in all required information",
    "auth.passwordMismatch": "Passwords do not match",
    "auth.registerFailed": "Registration failed",
    "auth.unknownError": "Unknown error",
    "auth.registerSuccess": "Registration successful. Please log in.",
    "nav.dashboard": "Dashboard",
    "nav.medicine": "Medicine list",
    "nav.medicineRequest": "Medicine requests",
    "nav.inventory": "Inventory",
    "nav.stockHistory": "Stock history",
    "nav.stockExport": "Export requests",
    "nav.stockImport": "Import notices",
    "nav.audit": "Audit",
    "nav.auditCreate": "Create audit session",
    "nav.profile": "Profile",
    "nav.medicineRequestCreate": "Create medicine request",
    "role.requester": "Pharmacist",
    "role.storekeeper": "Storekeeper",
    "role.manager": "Warehouse manager",
    "dashboard.title": "Warehouse overview",
    "dashboard.totalSkus": "Total SKUs",
    "dashboard.totalBatches": "Total batches",
    "dashboard.nearExpiry": "Near expiry",
    "dashboard.expired": "Expired batches",
    "dashboard.totalStock": "Total stock (units)",
    "dashboard.quickActions": "Quick actions",
    "dashboard.skuManaged": "managed SKUs",
    "dashboard.batchInStock": "batches in stock",
    "dashboard.needsAttention": "batches need attention",
    "dashboard.handleNow": "Needs immediate action",
    "quick.warehouseMap": "Warehouse map",
    "quick.handleExport": "Handle export",
    "quick.handleImport": "Handle import",
    "quick.createImportNotice": "Create import notice",
    "quick.addMedicine": "Add medicine",
    "quick.createAudit": "Create audit session",
    "quick.createRequest": "Create request",
  },
};

const domPhraseTranslations: Array<[string, string]> = [
  ["Pharma WMS", "Pharma WMS"],
  ["Kho thuốc", "Medicine warehouse"],
  ["Tổng quan", "Dashboard"],
  ["Tổng quan kho", "Warehouse overview"],
  ["Danh sách thuốc", "Medicine list"],
  ["Yêu cầu lấy thuốc", "Medicine requests"],
  ["Tạo yêu cầu lấy thuốc", "Create medicine request"],
  ["Kho thuốc", "Inventory"],
  ["Quản lý kho", "Inventory management"],
  ["Lịch sử kho", "Stock history"],
  ["Yêu cầu xuất kho", "Export requests"],
  ["Thông báo nhập kho", "Import notices"],
  ["Kiểm kê kho", "Stock audit"],
  ["Kiểm kê", "Audit"],
  ["Tạo đợt kiểm kê", "Create audit session"],
  ["Hồ sơ cá nhân", "Profile"],
  ["Sơ đồ kho", "Warehouse map"],
  ["Sơ đồ Kho Dược", "Pharmacy warehouse map"],
  ["Quản lý vị trí, trạng thái tủ thuốc theo phòng và tầng", "Manage medicine cabinet locations and statuses by room and floor"],
  ["Tổng mặt hàng", "Total SKUs"],
  ["Tổng lô hàng", "Total batches"],
  ["Lô cận date", "Near-expiry batches"],
  ["Lô hết hạn", "Expired batches"],
  ["Tổng tồn kho (đơn vị)", "Total stock (units)"],
  ["Thao tác nhanh", "Quick actions"],
  ["SKU đang quản lý", "managed SKUs"],
  ["lô có tồn kho", "batches in stock"],
  ["lô hàng cần chú ý", "batches need attention"],
  ["Cần xử lý ngay", "Needs immediate action"],
  ["Xử lý xuất kho", "Handle export"],
  ["Xử lý nhập kho", "Handle import"],
  ["Gửi thông báo nhập kho", "Create import notice"],
  ["Thêm thuốc", "Add medicine"],
  ["Tạo yêu cầu", "Create request"],
  ["Đăng nhập", "Log in"],
  ["Đăng ký", "Sign up"],
  ["Tên đăng nhập", "Username"],
  ["Mật khẩu", "Password"],
  ["Họ và tên", "Full name"],
  ["Xác nhận mật khẩu", "Confirm password"],
  ["Quên mật khẩu?", "Forgot password?"],
  ["Vào hệ thống", "Enter system"],
  ["Đang đăng nhập...", "Logging in..."],
  ["Đang xử lý...", "Processing..."],
  ["Xác nhận", "Confirm"],
  ["Vui lòng nhập tài khoản", "Please enter your username"],
  ["Vui lòng nhập mật khẩu", "Please enter your password"],
  ["Sai tài khoản hoặc mật khẩu", "Incorrect username or password"],
  ["Vui lòng nhập đầy đủ thông tin", "Please fill in all required information"],
  ["Mật khẩu không khớp", "Passwords do not match"],
  ["Đăng ký thất bại", "Registration failed"],
  ["Lỗi không xác định", "Unknown error"],
  ["Đăng ký thành công. Vui lòng đăng nhập.", "Registration successful. Please log in."],
  ["Hệ thống quản lý giúp", "A management system for"],
  ["kho thuốc hiệu quả", "efficient medicine warehouses"],
  ["Quản lý thuốc, nhập xuất kho, kiểm kê và báo cáo cho Dược sĩ, Thủ kho và Quản lý", "Manage medicines, stock movement, audits, and reports for pharmacists, storekeepers, and managers"],
  ["Truy cập hệ thống", "Access system"],
  ["Cuộn xuống", "Scroll down"],
  ["Quên mật khẩu", "Forgot password"],
  ["Nhập email của bạn để nhận liên kết đặt lại mật khẩu", "Enter your email to receive a password reset link"],
  ["Gửi liên kết đặt lại", "Send reset link"],
  ["Đã gửi email!", "Email sent!"],
  ["Kiểm tra hộp thư", "Check the inbox"],
  ["để đặt lại mật khẩu.", "to reset your password."],
  ["Trình dược viên", "Pharmacist"],
  ["Thủ kho", "Storekeeper"],
  ["Quản lý kho", "Warehouse manager"],
  ["Đăng xuất", "Log out"],
  ["Thông báo", "Notifications"],
  ["Ngôn ngữ", "Language"],
  ["Giao diện", "Theme"],
  ["Sáng", "Light"],
  ["Tối", "Dark"],
  ["Tìm kiếm...", "Search..."],
  ["Tạm ngừng nhập kho", "Import paused"],
  ["Loại thuốc", "Medicine type"],
  ["-- Chọn thuốc --", "-- Select medicine --"],
  ["Chọn thuốc", "Select medicine"],
  ["Tìm kiếm và tra cứu thuốc trong hệ thống", "Search and look up medicines in the system"],
  ["Tìm theo tên, mô tả...", "Search by name or description..."],
  ["Hiển thị", "Showing"],
  ["thuốc", "medicines"],
  ["Không tìm thấy thuốc nào", "No medicines found"],
  ["Cập nhật thông tin thuốc", "Update medicine information"],
  ["Ảnh thuốc", "Medicine image"],
  ["Tên thuốc", "Medicine name"],
  ["Mô tả", "Description"],
  ["Mô tả ngắn về thuốc", "Short medicine description"],
  ["Hủy", "Cancel"],
  ["Huỷ", "Cancel"],
  ["Lưu", "Save"],
  ["Xác nhận xoá", "Confirm deletion"],
  ["Bạn có chắc muốn xoá thuốc", "Are you sure you want to delete medicine"],
  ["Xoá", "Delete"],
  ["Tổng quan và danh sách lô thuốc trong kho", "Overview and batch list in stock"],
  ["Tổng lô", "Total batches"],
  ["Tồn kho", "Stock"],
  ["Gần hết hạn", "Near expiry"],
  ["Hết hạn", "Expired"],
  ["Tìm theo tên hoặc mã lô...", "Search by name or batch code..."],
  ["Đang tải dữ liệu kho...", "Loading inventory data..."],
  ["Mã lô", "Batch code"],
  ["Tên thuốc", "Medicine name"],
  ["Số lượng", "Quantity"],
  ["Hạn sử dụng", "Expiry date"],
  ["Trạng thái", "Status"],
  ["Vị trí", "Location"],
  ["Không có lô thuốc nào", "No batches found"],
  ["Mã lô", "Batch code"],
  ["Ghi chú", "Note"],
  ["Ghi chú thêm...", "Additional note..."],
  ["Gửi", "Send"],
  ["Chưa đăng nhập", "Not logged in"],
  ["An toàn", "Safe"],
  ["Còn hạn", "Valid"],
  ["Cận date", "Near expiry"],
  ["Trống", "Empty"],
  ["ĐẦY", "FULL"],
  ["Đánh dấu đầy", "Marked full"],
  ["Tủ này hiện đang trống", "This cabinet is currently empty"],
  ["Tên thuốc / Mã lô", "Medicine / Batch code"],
  ["Hạn dùng", "Expiry"],
  ["Tủ đang được đánh dấu đầy", "Cabinet is marked as full"],
  ["Đánh dấu trạng thái tủ", "Mark cabinet status"],
  ["Đang cập nhật...", "Updating..."],
  ["Bỏ đánh dấu đầy", "Unmark full"],
  ["Đánh dấu đã đầy", "Mark as full"],
  ["Tổng tủ", "Total cabinets"],
  ["Đang dùng", "In use"],
  ["Đang tải sơ đồ kho...", "Loading warehouse map..."],
  ["Thử lại", "Retry"],
  ["Hiệu suất sử dụng tầng", "Floor utilization"],
  ["Chưa có thuốc nào được gán vị trí ở tầng này", "No medicines have been assigned on this floor"],
  ["Tầng", "Floor"],
  ["Phòng", "Room"],
  ["Tủ", "Cabinet"],
  ["Theo dõi lịch sử xuất / nhập kho", "Track import/export history"],
  ["Nhập kho", "Import"],
  ["Xuất kho", "Export"],
  ["Đang tải lịch sử...", "Loading history..."],
  ["Mã log", "Log ID"],
  ["Ngày", "Date"],
  ["Loại", "Type"],
  ["Hành động", "Action"],
  ["Không có lịch sử", "No history"],
  ["Xem chi tiết", "View details"],
  ["Chi tiết", "Details"],
  ["Sản phẩm", "Product"],
  ["Đóng", "Close"],
  ["Hoàn tất", "Completed"],
  ["Đang chờ", "Pending"],
  ["Từ chối", "Rejected"],
  ["Thiếu thuốc", "Shortage"],
  ["Dư số lượng", "Excess quantity"],
  ["Chờ xử lý", "Pending"],
  ["Đã duyệt", "Approved"],
  ["Hoàn thành", "Completed"],
  ["Thất bại", "Failed"],
  ["Lịch sử yêu cầu và tạo yêu cầu mới", "Request history and create new requests"],
  ["Tất cả trạng thái", "All statuses"],
  ["Tất cả loại", "All types"],
  ["Lấy thuốc", "Take medicine"],
  ["Trả thuốc", "Return medicine"],
  ["kết quả", "results"],
  ["Mã yêu cầu", "Request ID"],
  ["Số loại thuốc", "Medicine types"],
  ["Ngày tạo", "Created date"],
  ["Không có yêu cầu nào", "No requests found"],
  ["Chi tiết", "Details"],
  ["Yêu cầu", "Request"],
  ["Lý do", "Reason"],
  ["Thực nhận", "Received"],
  ["Ghi chú:", "Note:"],
  ["Tổng yêu cầu", "Total requests"],
  ["Đã xử lý", "Processed"],
  ["Nguồn", "Source"],
  ["Tổng SL", "Total qty"],
  ["Chưa có yêu cầu nào", "No requests yet"],
  ["QL kho", "Manager"],
  ["Người dùng", "User"],
  ["Hoàn trả", "Return"],
  ["Đã nhập", "Received"],
  ["Đã từ chối", "Rejected"],
  ["Xử lý", "Process"],
  ["Thuốc", "Medicine"],
  ["Số lượng YC", "Requested qty"],
  ["Số lượng thực nhận", "Actual received quantity"],
  ["Vị trí lưu trữ (Tầng - Phòng - Tủ)", "Storage location (Floor - Room - Cabinet)"],
  ["Tình trạng nhận hàng", "Receiving status"],
  ["Đủ hàng", "Full"],
  ["Thiếu hàng", "Partial"],
  ["Dư số lượng", "Excess quantity"],
  ["Mô tả tình trạng thiếu hàng...", "Describe the shortage..."],
  ["Mô tả tình trạng dư hàng...", "Describe the excess..."],
  ["Từ chối nhập lô", "Reject batch import"],
  ["Từ chối lô hàng", "Reject batch"],
  ["Nhập lý do từ chối (bắt buộc)...", "Enter rejection reason (required)..."],
  ["Xác nhận từ chối", "Confirm rejection"],
  ["Quản lý request nhập / hoàn trả từ quản lý & người dùng", "Manage import/return requests from managers and users"],
  ["Yêu cầu chờ xử lý", "Pending requests"],
  ["Danh sách xuất", "Export list"],
  ["lô đã chọn", "selected batches"],
  ["Xóa tất cả", "Clear all"],
  ["Từ chối yêu cầu xuất kho", "Reject export request"],
  ["Xác nhận xuất kho", "Confirm export"],
  ["Còn thiếu:", "Still missing:"],
  ["Xuất kho hoàn tất (Có thiếu hàng)", "Export completed with shortage"],
  ["Chi tiết thiếu hàng:", "Shortage details:"],
  ["Đã xuất thực tế:", "Actually exported:"],
  ["Đã hiểu, quay lại", "Got it, go back"],
  ["Không xuất được lô nào", "No batches were exported"],
  ["Tạo đợt kiểm kê", "Create audit session"],
  ["Nhập số lượng thực tế cho từng lô thuốc", "Enter actual quantity for each batch"],
  ["Quay lại", "Back"],
  ["Xác nhận tạo đợt", "Confirm creation"],
  ["Tổng chênh lệch", "Total difference"],
  ["Lô lệch", "Different batches"],
  ["Hệ thống", "System"],
  ["Số thực tế", "Actual quantity"],
  ["Thực tế", "Actual"],
  ["Chênh lệch", "Difference"],
  ["Đang tải danh sách lô...", "Loading batch list..."],
  ["Báo cáo kiểm kê", "Audit report"],
  ["Quản lý các đợt kiểm kê kho thuốc", "Manage medicine warehouse audit sessions"],
  ["Từ ngày", "From date"],
  ["Đến ngày", "To date"],
  ["ID đợt kiểm kê", "Audit session ID"],
  ["Thời gian tạo", "Created time"],
  ["Số lô", "Batches"],
  ["Chưa có đợt kiểm kê nào", "No audit sessions yet"],
  ["Đã duyệt", "Confirmed"],
  ["Đang mở", "Open"],
  ["Xem", "View"],
  ["Bắt đầu kiểm kê", "Start audit"],
  ["Xác nhận hoàn tất", "Confirm completion"],
  ["Tổng số lô", "Total batches"],
  ["Số lô lệch", "Different batches"],
  ["Không thể tải dữ liệu sơ đồ kho. Vui lòng thử lại.", "Cannot load warehouse map data. Please try again."],
  ["Lỗi tải dữ liệu kho", "Failed to load inventory data"],
  ["Lỗi khi gửi yêu cầu", "Failed to send request"],
  ["Đã gửi yêu cầu nhập kho!", "Import request sent!"],
  ["Lỗi tải danh sách nhập kho", "Failed to load import requests"],
  ["Vui lòng nhập ghi chú từ chối!", "Please enter a rejection note!"],
  ["Đã từ chối lô hàng!", "Batch rejected!"],
  ["Lỗi khi từ chối", "Failed to reject"],
  ["Vị trí này đã được đánh dấu là đầy! Vui lòng chọn vị trí khác.", "This location is marked as full. Please select another location."],
  ["Xác nhận nhận hàng thành công!", "Receiving confirmed successfully!"],
  ["Lỗi khi xác nhận nhận hàng", "Failed to confirm receiving"],
  ["Lỗi tải lịch sử kho", "Failed to load stock history"],
  ["Lỗi tải lịch sử yêu cầu", "Failed to load request history"],
  ["Lỗi tải danh sách lô", "Failed to load batch list"],
  ["Đã tạo đợt kiểm kê!", "Audit session created!"],
  ["Lỗi khi tạo kiểm kê", "Failed to create audit"],
  ["Xác nhận đợt kiểm kê thành công!", "Audit session confirmed successfully!"],
  ["Lỗi xác nhận kiểm kê", "Failed to confirm audit"],
  ["Lỗi tải chi tiết phiên kiểm kê", "Failed to load audit session details"],
];

const exactDomTranslations = new Map(domPhraseTranslations);

const translateDomText = (value: string) => {
  if (!value.trim()) return value;

  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  let core = value.trim();

  const exact = exactDomTranslations.get(core);
  if (exact) return `${leading}${exact}${trailing}`;

  for (const [vi, en] of domPhraseTranslations) {
    core = core.replaceAll(vi, en);
  }

  core = core
    .replace(/\bThuốc #/g, "Medicine #")
    .replace(/\bKho (\d+)/g, "Warehouse $1")
    .replace(/\bTầng (\d+)/g, "Floor $1")
    .replace(/\bPhòng ([A-Z])/g, "Room $1")
    .replace(/\bTủ (M\d+)/g, "Cabinet $1")
    .replace(/(\d+)\s*lô\b/g, "$1 batches")
    .replace(/(\d+)\s*đơn vị\b/g, "$1 units")
    .replace(/(\d+)\s*đv\b/g, "$1 units")
    .replace(/\bY\/c:/g, "Req:")
    .replace(/\bThực nhận:/g, "Received:")
    .replace(/\bthiếu\b/g, "missing")
    .replace(/\bdư\b/g, "excess");

  return `${leading}${core}${trailing}`;
};

const textOriginals = new WeakMap<Text, string>();
const textLastTranslated = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();
const attrLastTranslated = new WeakMap<Element, Record<string, string>>();
const translatableAttributes = ["placeholder", "title", "aria-label"] as const;

const shouldSkipTextNode = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(
    parent.closest(
      "script, style, code, pre, .material-symbols-outlined, .icon-fill",
    ),
  );
};

const translateElementTree = (root: ParentNode, language: AppLanguage) => {
  const translateTextNode = (node: Text) => {
    if (shouldSkipTextNode(node)) return;

    const current = node.nodeValue ?? "";
    const last = textLastTranslated.get(node);
    const knownOriginal = textOriginals.get(node);
    const original =
      !knownOriginal || (last !== undefined && current !== last)
        ? current
        : knownOriginal;

    textOriginals.set(node, original);

    if (language === "vi") {
      if (current !== original) node.nodeValue = original;
      textLastTranslated.delete(node);
      return;
    }

    const next = translateDomText(original);
    if (current !== next) node.nodeValue = next;
    textLastTranslated.set(node, next);
  };

  const translateElementAttrs = (element: Element) => {
    const originals = { ...(attrOriginals.get(element) ?? {}) };
    const lastTranslated = { ...(attrLastTranslated.get(element) ?? {}) };

    translatableAttributes.forEach((attr) => {
      if (!element.hasAttribute(attr)) return;

      const current = element.getAttribute(attr) ?? "";
      const previousOriginal = originals[attr];
      const previousTranslated = lastTranslated[attr];
      const original =
        !previousOriginal ||
        (previousTranslated !== undefined && current !== previousTranslated)
          ? current
          : previousOriginal;

      originals[attr] = original;

      if (language === "vi") {
        if (current !== original) element.setAttribute(attr, original);
        delete lastTranslated[attr];
        return;
      }

      const next = translateDomText(original);
      if (current !== next) element.setAttribute(attr, next);
      lastTranslated[attr] = next;
    });

    attrOriginals.set(element, originals);
    attrLastTranslated.set(element, lastTranslated);
  };

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );

  if (root instanceof Element) translateElementAttrs(root);

  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      translateTextNode(node as Text);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      translateElementAttrs(node as Element);
    }
    node = walker.nextNode();
  }
};

type PreferencesContextValue = {
  language: AppLanguage;
  theme: AppTheme;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  t: (key: TranslationKey) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const getStoredLanguage = (): AppLanguage => {
  if (typeof window === "undefined") return "vi";
  return localStorage.getItem("app-language") === "en" ? "en" : "vi";
};

const getStoredTheme = (): AppTheme => {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem("app-theme") === "dark" ? "dark" : "light";
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getStoredLanguage);
  const [theme, setThemeState] = useState<AppTheme>(getStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("app-language", language);
  }, [language]);

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;

    let applying = false;
    let frame = 0;

    const applyTranslation = () => {
      applying = true;
      translateElementTree(root, language);
      applying = false;
    };

    const scheduleTranslation = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applyTranslation();
      });
    };

    applyTranslation();

    const observer = new MutationObserver(() => {
      if (applying) return;
      scheduleTranslation();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatableAttributes],
    });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [language]);

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message?: unknown) => {
      const text = String(message ?? "");
      nativeAlert(language === "en" ? translateDomText(text) : text);
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, [language]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      language,
      theme,
      setLanguage: setLanguageState,
      setTheme: setThemeState,
      toggleLanguage: () =>
        setLanguageState((current) => (current === "vi" ? "en" : "vi")),
      toggleTheme: () =>
        setThemeState((current) => (current === "light" ? "dark" : "light")),
      t: (key) => translations[language][key],
    }),
    [language, theme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
