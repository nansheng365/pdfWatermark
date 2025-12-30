# PDF水印处理器

一个基于Web的PDF处理工具，支持PDF文件上传、水印添加、PDF首页转图片等功能。

## 功能特性

- **PDF文件上传**：支持上传PDF文件到服务器
- **水印添加**：可为PDF文件添加文字水印，支持多种水印样式
  - 对角线水印
  - 居中水印
  - 平铺水印
- **水印自定义**：支持自定义水印文字、字体大小、透明度、颜色和位置
- **PDF首页转图片**：将PDF文件的首页转换为图片（PNG/JPEG格式）
- **文件管理**：支持查看、预览、下载和删除已上传的文件
- **实时预览**：支持水印效果预览

## 技术栈

- **前端**：HTML, CSS, JavaScript, Bootstrap 5
- **后端**：Node.js, Express
- **PDF处理**：pdf-lib, PDF.js
- **其他库**：Axios, Fontkit

## 安装与运行

1. 确保系统已安装Node.js
2. 克隆或下载项目代码
3. 在项目根目录执行以下命令安装依赖：

```bash
npm install
```

4. 创建环境配置文件：
   - 复制 `.env.example` 文件并重命名为 `.env`
   - 根据需要修改配置值

5. 启动服务器：

```bash
node src/app.js
```

6. 在浏览器中访问 `http://localhost:${PORT}` (端口号由环境变量配置，默认为3000)

## 环境变量配置

项目使用 `.env` 文件管理配置，支持以下变量：

- `PORT`：服务器运行端口（默认：3000）
- `UPLOAD_DIR`：上传文件存储目录（默认：public/uploads）
- `MAX_FILE_SIZE`：最大文件上传大小（字节，默认：50000000，即50MB）
- `ALLOWED_FILE_TYPES`：允许的文件类型（默认：application/pdf）

## 使用说明

1. **上传PDF文件**：点击"上传文件"按钮选择并上传PDF文件
2. **添加水印**：
   - 从文件列表中选择一个文件
   - 设置水印参数（文字、字体大小、透明度、颜色、位置）
   - 点击"水印预览"查看效果
   - 点击"应用水印"生成带水印的PDF文件
3. **PDF首页转图片**：
   - 从文件列表中选择一个文件
   - 设置图片参数（缩放比例、格式）
   - 点击"转换首页为图片"
   - 点击"下载图片"保存转换后的图片
4. **文件管理**：可预览、下载或删除已上传的文件

## 项目结构

```
pdfWatermark/
├── public/                 # 静态资源文件
│   ├── css/               # CSS样式文件
│   ├── js/                # JavaScript库文件
│   ├── uploads/           # 上传的PDF文件存储目录
│   └── index.html         # 主页面
├── src/                   # 服务器端源代码
│   ├── controllers/       # 控制器
│   ├── models/            # 数据模型
│   ├── routes/            # 路由定义
│   ├── services/          # 业务逻辑服务
│   ├── utils/             # 工具函数
│   └── app.js             # 应用入口文件
├── fonts/                 # 字体文件目录
├── .env                   # 环境变量配置文件
├── .gitignore             # Git忽略文件配置
├── package.json           # 项目配置文件
└── README.md              # 项目说明文档
```

## 依赖项

- express
- pdf-lib
- fontkit
- dotenv

## 注意事项

- 上传的文件存储在 `public/uploads/` 目录
- 水印文件以 `watermarked-` 前缀命名
- 支持中文水印（需提供中文字体文件）
- 浏览器需要支持Canvas和File API
- 配置通过 `.env` 文件管理，不要将此文件提交到版本控制系统

## 上传到GitHub指导

### 1. 准备工作

1. 确保你已安装Git
2. 在GitHub上创建一个新的仓库

### 2. 初始化Git仓库

在项目根目录打开命令行/终端，执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件到暂存区
git add .

# 提交更改
git commit -m "Initial commit: PDF Watermark Processor with PDF to image conversion feature"
```

### 3. 连接GitHub仓库

```bash
# 添加远程仓库（将URL替换为你的GitHub仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

### 4. 后续更新

每次有新更改时：

```bash
# 添加更改
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到GitHub
git push
```

## 许可证

此项目为学习和演示用途。