-- Seed USERS (Mật khẩu mặc định là 123456 đã được băm bcrypt)
INSERT INTO users (email, password, name, role) VALUES
('customer1@example.com', '$2b$10$MsUNk/OHO.UEWH2PNm5TiOM3CxPVfkLBrm5UjUDFe4HJiohr3p//6', 'Nguyen Khach Hang', 'CUSTOMER'),
('agent1@example.com', '$2b$10$MsUNk/OHO.UEWH2PNm5TiOM3CxPVfkLBrm5UjUDFe4HJiohr3p//6', 'Tran Nhan Vien CSKH', 'AGENT'),
('admin1@example.com', '$2b$10$MsUNk/OHO.UEWH2PNm5TiOM3CxPVfkLBrm5UjUDFe4HJiohr3p//6', 'Le Quan Tri Vien', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Seed FAQS
INSERT INTO faqs (question, answer, category, is_active) VALUES
('Làm thế nào để yêu cầu hoàn tiền?', 'Bạn có thể yêu cầu hoàn tiền bằng cách truy cập vào trang Cá nhân, chọn đơn hàng cần hoàn và nhấn nút "Yêu cầu hoàn tiền" trong vòng 7 ngày kể từ khi nhận hàng.', 'REFUND', true),
('Chính sách hoàn tiền mất bao lâu để xử lý?', 'Thời gian xử lý hoàn tiền thường mất từ 3 đến 5 ngày làm việc tùy thuộc vào phương thức thanh toán của bạn.', 'REFUND', true),
('Tôi muốn theo dõi đơn hàng của mình thì làm thế nào?', 'Bạn hãy truy cập vào mục "Đơn hàng của tôi" để xem mã vận đơn và tình trạng vận chuyển thời gian thực.', 'ECOMMERCE', true),
('Làm sao để đổi mật khẩu tài khoản?', 'Bạn hãy vào phần "Cài đặt tài khoản" -> "Bảo mật" -> "Đổi mật khẩu" để thực hiện cập nhật mật khẩu mới.', 'SOFTWARE', true),
('Hệ thống hỗ trợ những phương thức thanh toán nào?', 'Chúng tôi hỗ trợ thanh toán qua Thẻ tín dụng/ghi nợ (Visa/Mastercard), chuyển khoản ngân hàng và các ví điện tử Momo, VNPay.', 'PAYMENT', true);
