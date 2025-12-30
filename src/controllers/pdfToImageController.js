const { convertFirstPageToImage } = require('../services/pdfToImageService');
require('dotenv').config(); // 引入dotenv

/**
 * 处理PDF首页转换为图片的请求控制器
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const handleConvertFirstPage = async (req, res) => {
  try {
    // 记录请求参数用于调试
    console.log('收到PDF转图片请求参数:', req.body);
    
    // 获取请求参数
    let { fileName } = req.body;
    
    // 如果文件名包含编码过的URI组件，进行解码
    if (fileName) {
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        console.warn('文件名解码失败:', e);
      }
    }
    
    // 如果没有提供文件名，则返回错误
    if (!fileName) {
      console.log('缺少文件名参数');
      return res.status(400).json({
        success: false,
        message: '缺少文件名参数'
      });
    }
    
    // 转换PDF首页为图片
    const result = await convertFirstPageToImage(fileName);
    
    // 记录处理结果用于调试
    console.log('PDF转图片处理结果:', result);
    
    // 返回结果
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        imageUrl: `/uploads/${result.imageName}`,
        imageName: result.imageName
      });
    } else {
      // 使用400状态码表示客户端错误
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('PDF转图片处理错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
    });
  }
};

module.exports = {
  handleConvertFirstPage
};