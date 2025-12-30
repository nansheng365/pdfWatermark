const fs = require('fs').promises;
const path = require('path');
require('dotenv').config(); // 引入dotenv

// 简化文件名，去除多余信息，只保留核心名称部分
function simplifyFileName(fileName) {
  // 如果是水印文件，去除前缀和时间戳，只保留原始文件名，并添加WM后缀
  if (fileName.startsWith('watermarked-')) {
    // 匹配模式: watermarked-{timestamp}-{originalFileName}
    const match = fileName.match(/^watermarked-\d+-(.+)$/);
    if (match && match[1]) {
      const originalFileName = match[1];
      // 在文件名（不含扩展名）后添加WM
      const lastDotIndex = originalFileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        const nameWithoutExt = originalFileName.substring(0, lastDotIndex);
        const ext = originalFileName.substring(lastDotIndex);
        return `${nameWithoutExt}WM${ext}`;
      } else {
        // 如果没有扩展名，直接添加WM
        return `${originalFileName}WM`;
      }
    }
  }
  
  // 对于非水印文件，直接返回原文件名
  return fileName;
}

/**
 * 获取上传目录中的文件列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getFileList = async (req, res) => {
  try {
    // 定义上传目录路径
    const uploadDir = path.join(__dirname, '../..', process.env.UPLOAD_DIR || 'public/uploads');
    
    // 读取目录内容
    const files = await fs.readdir(uploadDir);
    
    // 过滤出PDF文件和水印处理后的文件
    const pdfFiles = files.filter(file => {
      // 只包含PDF文件和以watermarked-开头的文件
      return file.endsWith('.pdf') || file.startsWith('watermarked-');
    });
    
    // 获取每个文件的详细信息
    const fileList = await Promise.all(pdfFiles.map(async (file) => {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);
      
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        isWatermarked: file.startsWith('watermarked-')
      };
    }));
    
    // 按修改时间排序，最新的在前面
    fileList.sort((a, b) => b.modified - a.modified);
    
    // 返回文件列表
    res.json({
      success: true,
      files: fileList
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文件列表失败: ' + error.message
    });
  }
};

/**
 * 获取文件预览
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getFilePreview = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: '文件名不能为空'
      });
    }
    
    // 构建文件路径
    const uploadDir = path.join(__dirname, '../..', process.env.UPLOAD_DIR || 'public/uploads');
    const filePath = path.join(uploadDir, fileName);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    // 简化文件名，去除多余信息
    const simplifiedFileName = simplifyFileName(fileName);
      
    // 设置响应头以在浏览器中预览PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(simplifiedFileName)}"`);
    
    // 发送文件
    res.sendFile(filePath);
  } catch (error) {
    console.error('文件预览失败:', error);
    res.status(500).json({
      success: false,
      message: '文件预览失败: ' + error.message
    });
  }
};

/**
 * 删除文件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const deleteFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: '文件名不能为空'
      });
    }
    
    // 构建文件路径
    const uploadDir = path.join(__dirname, '../..', process.env.UPLOAD_DIR || 'public/uploads');
    const filePath = path.join(uploadDir, fileName);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    // 删除文件
    await fs.unlink(filePath);
    
    // 返回成功响应
    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('文件删除失败:', error);
    res.status(500).json({
      success: false,
      message: '文件删除失败: ' + error.message
    });
  }
};

module.exports = {
  getFileList,
  getFilePreview,
  deleteFile
};