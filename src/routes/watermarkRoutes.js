const { handleWatermark, handlePreviewWatermark, handleWatermarkWithProgress, handlePreviewWatermarkWithProgress } = require('../controllers/watermarkController');

// 水印处理路由
module.exports = (app) => {
  // 传统的水印处理路由
  app.post('/watermark', handleWatermark);
  
  // 传统的水印预览路由
  app.post('/preview-watermark', handlePreviewWatermark);
  
  // 支持进度的水印处理路由
  app.get('/watermark-progress', handleWatermarkWithProgress);
  
  // 支持进度的水印预览路由
  app.get('/preview-watermark-progress', handlePreviewWatermarkWithProgress);
};