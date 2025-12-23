const express = require('express');
const path = require('path');
const { handleUpload } = require('./controllers/uploadController');
const { handleWatermark, handlePreviewWatermark } = require('./controllers/watermarkController');
const { getFileList, getFilePreview, deleteFile } = require('./controllers/fileController');
const setupWatermarkRoutes = require('./routes/watermarkRoutes');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;  // 更改端口为3000

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 设置路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 文件上传路由
app.post('/upload', handleUpload);

// 初始化水印路由
setupWatermarkRoutes(app);

// 获取文件列表路由
app.get('/files', getFileList);

// 获取文件预览路由
app.get('/preview/:fileName', (req, res, next) => {
  // 对文件名进行解码以正确处理中文
  try {
    const fileName = decodeURIComponent(req.params.fileName);
    req.params.fileName = fileName;
  } catch (e) {
    console.warn('文件名解码失败:', e);
  }
  next();
}, getFilePreview);

// 删除文件路由
app.delete('/delete/:fileName', (req, res, next) => {
  // 对文件名进行解码以正确处理中文
  try {
    const fileName = decodeURIComponent(req.params.fileName);
    req.params.fileName = fileName;
  } catch (e) {
    console.warn('文件名解码失败:', e);
  }
  next();
}, deleteFile);

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在端口 http://localhost:${PORT}`);
});