const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('fontkit');

// 将角度转换为弧度的辅助函数
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// 将角度转换为pdf-lib所需的旋转对象
function degrees(angle) {
  return { angle, type: 'degrees' };
}

/**
 * 添加对角线水印
 */
function addDiagonalWatermark(page, text, fontSize, color, opacity, width, height, font) {
  // 计算文本的实际宽度和高度
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize);
  
  // 计算对角线角度（从左下角到右上角）
  const angle = Math.atan(height / width) * (180 / Math.PI);
  
  // PDF页面对角线中点坐标
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 计算文本的重心（几何中心）相对于文本左下角的偏移量
  const textCenterX = textWidth / 2;
  const textCenterY = textHeight / 2;
  
  // 计算旋转后文本重心的新坐标（相对于文本左下角）
  const rotatedTextCenterX = textCenterX * Math.cos(angle * Math.PI / 180) - textCenterY * Math.sin(angle * Math.PI / 180);
  const rotatedTextCenterY = textCenterX * Math.sin(angle * Math.PI / 180) + textCenterY * Math.cos(angle * Math.PI / 180);
  
  // 计算文本左下角应该放置的坐标，使得文本重心正好在页面对角线中点上
  const textX = centerX - rotatedTextCenterX;
  const textY = centerY - rotatedTextCenterY;
  
  page.drawText(text, {
    x: textX,
    y: textY,
    size: fontSize,
    color: color,
    opacity: opacity,
    rotate: degrees(angle),
    font: font
  });
}

/**
 * 添加居中水印
 */
function addCenterWatermark(page, text, fontSize, color, opacity, width, height, font) {
  // 计算文本的实际宽度和高度
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize);
  
  // 计算文本在页面中央的坐标
  const x = (width - textWidth) / 2;
  const y = (height - textHeight) / 2;
  
  page.drawText(text, {
    x: x,
    y: y,
    size: fontSize,
    color: color,
    opacity: opacity,
    font: font
  });
}

/**
 * 添加平铺水印
 */
function addTileWatermark(page, text, fontSize, color, opacity, width, height, font) {
  // 计算文本的实际宽度和高度
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize);
  
  // 设置水印之间的间距
  const horizontalSpacing = textWidth * 1.5;
  const verticalSpacing = textHeight * 3;
  
  // 计算需要多少行和列才能覆盖整个页面
  const columns = Math.ceil(width / horizontalSpacing) + 1;
  const rows = Math.ceil(height / verticalSpacing) + 1;
  
  // 绘制平铺的水印
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      // 交替偏移奇数行，创建砖块效果
      const xOffset = (row % 2 === 1) ? horizontalSpacing / 2 : 0;
      const x = col * horizontalSpacing + xOffset;
      const y = height - ((row + 1) * verticalSpacing);
      
      page.drawText(text, {
        x: x,
        y: y,
        size: fontSize,
        color: color,
        opacity: opacity,
        font: font
      });
    }
  }
}

/**
 * 处理水印添加（支持进度回调）
 */
async function processWatermark(fileName, watermarkOptions, progressCallback = null) {
  try {
    // 构建文件路径
    const uploadDir = path.join(__dirname, '../../public/uploads');
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
    const existingPdfBytes = await fs.readFile(inputFilePath);
    
    // 加载PDF文档
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // 注册fontkit
    pdfDoc.registerFontkit(fontkit);
    
    // 尝试加载中文字体，如果失败则回退到标准字体
    let font;
    try {
      const fontPath = path.join(__dirname, '../../fonts/chinese-font.ttf');
      const fontBytes = await fs.readFile(fontPath);
      font = await pdfDoc.embedFont(fontBytes);
    } catch (error) {
      console.warn('无法加载中文字体，使用默认字体:', error.message);
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    // 获取颜色值
    const color = rgb(
      parseInt(watermarkOptions.fontColor.slice(1, 3), 16) / 255,
      parseInt(watermarkOptions.fontColor.slice(3, 5), 16) / 255,
      parseInt(watermarkOptions.fontColor.slice(5, 7), 16) / 255
    );
    
    // 遍历每一页并添加水印
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    
    // 报告开始处理
    if (progressCallback) {
      progressCallback({ type: 'start', totalPages });
    }
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // 根据位置选项添加不同类型的水印
      switch (watermarkOptions.position) {
        case 'center':
          addCenterWatermark(page, watermarkOptions.text, watermarkOptions.fontSize, color, watermarkOptions.opacity, width, height, font);
          break;
        case 'tile':
          addTileWatermark(page, watermarkOptions.text, watermarkOptions.fontSize, color, watermarkOptions.opacity, width, height, font);
          break;
        case 'diagonal':
        default:
          addDiagonalWatermark(page, watermarkOptions.text, watermarkOptions.fontSize, color, watermarkOptions.opacity, width, height, font);
          break;
      }
      
      // 报告进度
      if (progressCallback) {
        const progress = Math.round(((i + 1) / totalPages) * 100);
        progressCallback({ 
          type: 'progress', 
          currentPage: i + 1, 
          totalPages, 
          progress 
        });
      }
    }
    
    // 报告保存阶段
    if (progressCallback) {
      progressCallback({ type: 'saving' });
    }
    
    // 保存修改后的PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // 生成新的文件名
    const timestamp = Date.now();
    const newFileName = `watermarked-${timestamp}-${fileName}`;
    const outputFilePath = path.join(uploadDir, newFileName);
    
    // 写入文件
    await fs.writeFile(outputFilePath, modifiedPdfBytes);
    
    // 报告完成
    if (progressCallback) {
      progressCallback({ type: 'complete', fileName: newFileName });
    }
    
    return {
      success: true,
      message: '水印添加成功',
      fileName: newFileName
    };
  } catch (error) {
    console.error('处理水印时出错:', error);
    return {
      success: false,
      message: '处理水印时出错: ' + error.message
    };
  }
}

/**
 * 预览水印效果（支持进度回调）
 * 修改为最多处理前5页以减少资源消耗
 */
async function previewWatermark(fileName, watermarkOptions, progressCallback = null) {
  try {
    // 构建文件路径
    const uploadDir = path.join(__dirname, '../../public/uploads');
    const inputFilePath = path.join(uploadDir, fileName);
    
    // 检查文件是否存在
    try {
      await fs.access(inputFilePath);
    } catch (error) {
      throw new Error('文件不存在');
    }
    
    // 读取PDF文件
    const existingPdfBytes = await fs.readFile(inputFilePath);
    
    // 加载PDF文档
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // 注册fontkit
    pdfDoc.registerFontkit(fontkit);
    
    // 尝试加载中文字体，如果失败则回退到标准字体
    let font;
    try {
      const fontPath = path.join(__dirname, '../../fonts/chinese-font.ttf');
      const fontBytes = await fs.readFile(fontPath);
      font = await pdfDoc.embedFont(fontBytes);
    } catch (error) {
      console.warn('无法加载中文字体，使用默认字体:', error.message);
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    // 获取颜色值
    const color = rgb(
      parseInt(watermarkOptions.fontColor.slice(1, 3), 16) / 255,
      parseInt(watermarkOptions.fontColor.slice(3, 5), 16) / 255,
      parseInt(watermarkOptions.fontColor.slice(5, 7), 16) / 255
    );
    
    // 只处理前5页用于预览，或者总页数小于5时处理所有页面
    const pages = pdfDoc.getPages();
    const pagesToProcess = Math.min(pages.length, 5); // 最多处理5页
    
    // 报告开始处理
    if (progressCallback) {
      progressCallback({ type: 'start', totalPages: pagesToProcess });
    }
    
    // 处理指定数量的页面
    for (let i = 0; i < pagesToProcess; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // 根据位置选项添加不同类型的水印
      switch (watermarkOptions.position) {
        case 'center':
          addCenterWatermark(page, watermarkOptions.text, watermarkOptions.fontSize, color, watermarkOptions.opacity, width, height, font);
          break;
        case 'tile':
          addTileWatermark(page, watermarkOptions.text, watermarkOptions.fontSize, color, watermarkOptions.opacity, width, height, font);
          break;
        case 'diagonal':
        default:
          addDiagonalWatermark(page, watermarkOptions.text, watermarkOptions.fontSize, color, watermarkOptions.opacity, width, height, font);
          break;
      }
      
      // 报告进度
      if (progressCallback) {
        const progress = Math.round(((i + 1) / pagesToProcess) * 100);
        progressCallback({ 
          type: 'progress', 
          currentPage: i + 1, 
          totalPages: pagesToProcess, 
          progress 
        });
      }
    }
    
    // 报告保存阶段
    if (progressCallback) {
      progressCallback({ type: 'saving' });
    }
    
    // 保存修改后的PDF并返回buffer
    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error('预览水印时出错:', error);
    throw error;
  }
}

module.exports = {
  processWatermark,
  previewWatermark
};