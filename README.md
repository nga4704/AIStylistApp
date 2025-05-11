## 🎨 GIỚI THIỆU: AI Stylist App – Trợ lý thời trang 
**AI Stylist App** là một ứng dụng thời trang ảo thông minh giúp người dùng quản lý tủ đồ cá nhân, gợi ý phối đồ và khám phá phong cách phù hợp dựa trên sở thích, thời tiết và hoàn cảnh sử dụng. App được phát triển bằng **React Native + Expo**, kết hợp với **Firebase** và **AI server**.

---
## 🌟 CÁC TÍNH NĂNG CHÍNH
### 1. 👗 **Closet Screen (Tủ đồ cá nhân)**
* Hiển thị avatar và tên người dùng.
* Lấy **thông tin thời tiết theo vị trí** hiện tại.
* Phân loại tủ đồ theo các **tab** như: Tops, Bottoms, Outerwear, Shoes, Accessories,...
* Kết nối Firebase để lấy dữ liệu quần áo đã lưu.
* Cho phép người dùng xem chi tiết item quần áo (ảnh, màu sắc, chất liệu...).

### 2. 📸 **Add Clothes Screen (Thêm trang phục)**
* Sau khi chọn ảnh, người dùng nhấn “Add” để xử lý AI.

### 3. 🤖 **AI Processing Item**
* Xử lý ảnh đã chọn:
  * Xóa nền ảnh với remove.bg.
  * Phân tích ảnh bằng Clarifi API:
    * Phân loại loại đồ (ví dụ: áo thun, váy,...).
    * Nhận diện màu sắc, chất liệu, hoạ tiết.
    * Dự đoán mùa hoặc dịp phù hợp để mặc.
* Lưu kết quả lên Firebase.

### 4. 🧠 **Suggestion Outfit Screen (Gợi ý phối đồ AI)**
* Gồm 3 tab:
  * **User Info**: Hiển thị thông tin người dùng.
  * **Style Preference**: Người dùng chọn style mong muốn (casual, sporty, street, date night,...).
  * **Item Selection**: Hiển thị danh sách item đã lưu, có checkbox để chọn item cần phối.
* Sau khi chọn xong, người dùng nhấn nút “Get Suggestions” để nhận đề xuất outfit từ AI.

### 5. 🧾 **Profile & Settings (Tài khoản và cài đặt)**
* Xem và chỉnh sửa hồ sơ cá nhân.
---

## 🔌 CÔNG NGHỆ & CÔNG CỤ SỬ DỤNG
| Công nghệ                          | Vai trò                                        |
| ---------------------------------- | ---------------------------------------------- |
| **React Native + Expo**            | Giao diện và logic ứng dụng                    |
| **Firebase**                       | Authentication, Firestore, Storage             |
| **remove.bg API**                  | Xóa nền ảnh                                    |
| **Clarifi API**                    | Phân tích ảnh                                  |
| **AI server (FastAPI)**            | Đề xuất phối đồ                                |
| **React Navigation**               | Điều hướng giữa các màn hình                   |
| **TypeScript**                     | Tăng tính ổn định và dễ bảo trì                |
---

## 🚀 HƯỚNG DẪN CHẠY ỨNG DỤNG
### 1. Clone repo
```bash
git clone https://github.com/nga4704/AIStylistApp.git
cd AIStylistApp
```
2. Cài đặt dependencies
```bash
npm install
```
3. Tạo API key (api/config.ts)
4. Khởi chạy app
```bash
npx expo start
```
Sau đó dùng điện thoại scan QR code để mở trên Expo Go.
