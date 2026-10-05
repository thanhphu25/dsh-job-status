# dsh-job-status

Bundle độc lập cho DeepSeek Harness, chứa một plugin cung cấp tool `get_job_status(job_id)`. Tool dùng dữ liệu cố định; không cần API xử lý ảnh, database hay model ảnh. Package dùng JavaScript ESM, không cần build hoặc chạy script cài đặt.

## Cài từ GitHub

Cần Node.js `^22.19.0 || >=24.0.0`, pnpm và DeepSeek Harness tương thích với `@deepseek-ai/dsh-tools` phiên bản `0.2.0-rc.2`, Cordis `4.0.4`. Để agent trả lời trong hội thoại, profile Web cần được cấu hình model và thông tin xác thực.

```powershell
dsh plugin --profile web add github:thanhphu25/dsh-job-status
dsh web
```

Nếu chạy Harness từ checkout source, dùng:

```powershell
pnpm dsh plugin --profile web add github:thanhphu25/dsh-job-status
pnpm dsh web
```

Lệnh cài đăng ký và bật bundle trong profile. Trong Web, mở **Plugins → Installed → dsh-job-status** để bật/tắt bằng công tắc. Web có HMR sẽ áp dụng thay đổi khi đang chạy; profile tắt HMR cần khởi động lại. Các lần khởi động sau không cần `--patch`.

## Demo trong cùng hội thoại

Trước khi bắt đầu, tắt bundle bằng công tắc. Gửi prompt:

```text
Kiểm tra tác vụ JOB001 bằng chính xác tool get_job_status.

Nếu tool không khả dụng, chỉ trả lời:
GET_JOB_STATUS_NOT_AVAILABLE

Không dùng Bash, đọc file, run_code hoặc subagent thay thế.
Không suy đoán trạng thái tác vụ.
Không dùng kết quả truy vấn cũ.
```

1. Khi bundle tắt, agent được yêu cầu trả `GET_JOB_STATUS_NOT_AVAILABLE`.
2. Giữ Web đang chạy, bật bundle trong **Plugins**, quay lại cùng hội thoại và gửi lại prompt.
3. Tool call thật trả dữ liệu dưới đây; agent có thể giải thích lỗi tại bước resize.
4. Tắt bundle rồi gửi lại prompt. Tool không còn đăng ký; lịch sử truy vấn cũ vẫn tồn tại trong hội thoại.

```json
{
  "job_id": "JOB001",
  "status": "failed",
  "step": "resize",
  "reason": "Ảnh đầu vào bị hỏng"
}
```

Chỉ `JOB001` có dữ liệu. Mã khác trả lỗi không có dữ liệu giả lập; thiếu `job_id` hoặc truyền giá trị không phải chuỗi bị từ chối. Trạng thái job `failed` là kết quả truy vấn thành công, không phải lỗi thực thi tool.

## So sánh với plugin local

| | Bản local trong checkout Harness | Repo này |
|---|---|---|
| Package | `dsh-job-status-demo` | `dsh-job-status` |
| Code | `scratch-plugin/src/job-status.ts` | `index.js` |
| Ngôn ngữ | TypeScript | JavaScript ESM |
| Nguồn cài | Thư mục local được liên kết vào profile | GitHub |
| Tool và dữ liệu | `get_job_status`, mock `JOB001` | Giống bản local |
| Bật/tắt | Công tắc Plugins sau khi đăng ký bundle local | Công tắc Plugins sau khi cài repo |

Chỉ bật một bản tại một thời điểm trong cùng profile: cả hai đăng ký cùng tên tool `get_job_status`, nên bật đồng thời gây trùng đăng ký. Bản local vẫn giữ nguyên khi cài repo này.

## Cấu trúc bundle

```text
dsh-job-status/
├── package.json
├── cordis.patch.yml
├── index.js
├── README.md
├── LICENSE
└── test/job-status.test.js
```

`package.json` khai báo `dsh.bundle.patch`; `cordis.patch.yml` nạp package `dsh-job-status`; `index.js` đăng ký tool bằng `ctx.tools.register`. Cordis thu hồi đăng ký khi plugin unload. Các service dùng chung với Harness được khai báo trong `peerDependencies`; `devDependencies` phục vụ test.

## Kiểm tra khi phát triển

Khi các phiên bản dependency tương thích có sẵn trong registry đang dùng, chạy trong thư mục repo:

```powershell
pnpm install
pnpm test
```

Nếu đặt repo bên trong pnpm workspace của Harness, dùng `pnpm --ignore-workspace install` và `pnpm --ignore-workspace test`. Khi phiên bản Harness chưa có trên registry, dùng các package đã build từ checkout tương ứng để kiểm tra. Test dùng registry và pipeline thật, kiểm tra dữ liệu mock, tham số sai, mã job không tồn tại và việc đăng ký/thu hồi tool; không gọi model và không cần API key.

## Gỡ bundle

```powershell
dsh plugin --profile web remove dsh-job-status
```

Nếu chạy từ source, thêm `pnpm` trước lệnh `dsh`. Gỡ package này không gỡ package local `dsh-job-status-demo`.
