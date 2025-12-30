const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // 引入dotenv

// 配置multer存储引擎
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_DIR || 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // 获取原始文件名并确保正确处理中文字符编码
    let originalName = file.originalname;
    
    // 如果文件名包含乱码特征，尝试解码
    if (originalName.includes('æ') || originalName.includes('å') || originalName.includes('ç')) {
      try {
        originalName = Buffer.from(originalName, 'latin1').toString('utf8');
      } catch (e) {
        console.warn('文件名解码失败:', e);
      }
    }
    
    const uploadDir = process.env.UPLOAD_DIR || 'public/uploads/';
    const fullPath = path.join(uploadDir, originalName);
    
    // 检查文件是否已存在
    if (fs.existsSync(fullPath)) {
      // 如果文件已存在，在文件名前添加时间戳
      const nameWithoutExt = path.parse(originalName).name;
      const ext = path.parse(originalName).ext;
      const timestamp = Date.now();
      originalName = `${nameWithoutExt}_${timestamp}${ext}`;
    }
    
    cb(null, originalName);
  }
});

// 创建multer实例
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 只接受PDF文件
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传PDF文件，当前文件类型: ' + ext));
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 从环境变量获取文件大小限制，默认50MB
  }
});

// 处理单个文件上传
const uploadSingle = upload.single('pdfFile');

// 上传文件处理函数
const handleUpload = (req, res) => {
  console.log('收到上传请求:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    contentType: req.headers['content-type']
  });
  
  // 检查Content-Type是否为multipart/form-data
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
    console.error('无效的Content-Type:', req.headers['content-type']);
    return res.status(400).json({ 
      success: false, 
      message: '请求格式错误，请使用multipart/form-data格式上传文件' 
    });
  }
  
  uploadSingle(req, res, function (err) {
    console.log('Multer处理完成:', {
      error: err,
      file: req.file,
      body: req.body
    });
    
    if (err instanceof multer.MulterError) {
      // multer错误
      console.error('Multer错误:', {
        code: err.code,
        message: err.message,
        field: err.field
      });
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: `文件大小超出限制（最大${parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024)}MB）` // 更新错误信息中的大小限制
        });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          success: false, 
          message: '文件字段名错误，请使用"pdfFile"作为文件字段名' 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: '文件上传错误: ' + err.message 
      });
    } else if (err) {
      // 其他错误
      console.error('其他上传错误:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      // 特殊处理文件类型错误
      if (err.message && err.message.includes('只允许上传PDF文件')) {
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: '文件上传失败: ' + err.message 
      });
    }
    
    // 检查是否上传了文件
    if (!req.file) {
      console.error('未找到上传的文件:', {
        files: req.files,
        body: req.body
      });
      
      // 检查是否有文件被发送但被过滤掉了
      if (req.files && req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '请选择要上传的PDF文件' 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: '文件上传失败，请确保选择了有效的PDF文件' 
      });
    }
    
    // 验证上传的文件
    if (!req.file.filename || !req.file.originalname) {
      console.error('文件信息不完整:', req.file);
      return res.status(400).json({ 
        success: false, 
        message: '文件上传信息不完整' 
      });
    }
    
    // 返回成功响应，确保文件名正确显示
    res.json({
      success: true,
      message: '文件上传成功',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  });
};

module.exports = {
  handleUpload
};