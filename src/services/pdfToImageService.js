const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist');
const { createCanvas } = require('canvas');
require('dotenv').config(); // 引入dotenv

// 设置PDF.js worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;

/**
 * 将PDF首页转换为图片
 * @param {string} fileName - PDF文件名
 * @returns {Object} 转换结果
 */
async function convertFirstPageToImage(fileName) {
  try {
    // 构建文件路径
    const uploadDir = path.join(__dirname, '../..', process.env.UPLOAD_DIR || 'public/uploads');
    const inputFilePath = path.join(uploadDir, fileName);
    
    // 检查文件是否存在
    try {
      await fs.access(inputFilePath);
    } catch (error) {
      return {
        success: false,
        message: '文件不存在'
      };
    }
    
    // 读取PDF文件
    const pdfData = await fs.readFile(inputFilePath);
    
    // 加载PDF文档
    const loadingTask = await pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    // 检查PDF是否有页面
    const numPages = pdf.numPages;
    if (numPages === 0) {
      return {
        success: false,
        message: 'PDF文件为空或损坏'
      };
    }
    
    // 获取第一页
    const page = await pdf.getPage(1);
    
    // 设置缩放比例
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    
    // 创建canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    // 渲染页面到canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // 生成图片文件名
    const timestamp = Date.now();
    const imageName = `first-page-${timestamp}-${path.basename(fileName, path.extname(fileName))}.png`;
    const imagePath = path.join(uploadDir, imageName);
    
    // 将canvas内容保存为PNG文件
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(imagePath, buffer);
    
    return {
      success: true,
      message: 'PDF首页转换成功',
      imageName: imageName
    };
  } catch (error) {
    console.error('PDF转图片时出错:', error);
    return {
      success: false,
      message: 'PDF转图片时出错: ' + error.message
    };
  }
}

module.exports = {
  convertFirstPageToImage
};