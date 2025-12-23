const { processWatermark, previewWatermark } = require('../services/watermarkService');

/**
 * 处理水印请求控制器
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const handleWatermark = async (req, res) => {
  try {
    // 记录请求参数用于调试
    console.log('收到水印请求参数:', req.body);
    
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
    
    const watermarkOptions = {
      text: req.body.text || 'WATERMARK',
      fontSize: parseInt(req.body.fontSize) || 20,
      fontColor: req.body.fontColor || '#8B4513',
      opacity: parseInt(req.body.opacity) || 50,
      position: req.body.position || 'center'
    };
    
    // 转换透明度值为小数
    watermarkOptions.opacity = watermarkOptions.opacity / 100;
    
    // 如果没有提供文件名，则返回错误
    if (!fileName) {
      console.log('缺少文件名参数');
      return res.status(400).json({
        success: false,
        message: '缺少文件名参数'
      });
    }
    
    // 处理水印
    const result = await processWatermark(fileName, watermarkOptions);
    
    // 记录处理结果用于调试
    console.log('水印处理结果:', result);
    
    // 返回结果
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        downloadUrl: `/uploads/${result.fileName}`
      });
    } else {
      // 使用400状态码表示客户端错误
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('水印处理错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
    });
  }
};

/**
 * 处理水印预览请求控制器
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const handlePreviewWatermark = async (req, res) => {
  try {
    // 记录请求参数用于调试
    console.log('收到水印预览请求参数:', req.body);
    
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
    
    const watermarkOptions = {
      text: req.body.text || 'WATERMARK',
      fontSize: parseInt(req.body.fontSize) || 20,
      fontColor: req.body.fontColor || '#8B4513',
      opacity: parseInt(req.body.opacity) || 50,
      position: req.body.position || 'center'
    };
    
    // 转换透明度值为小数
    watermarkOptions.opacity = watermarkOptions.opacity / 100;
    
    // 如果没有提供文件名，则返回错误
    if (!fileName) {
      console.log('缺少文件名参数');
      return res.status(400).json({
        success: false,
        message: '缺少文件名参数'
      });
    }
    
    // 预览水印
    const watermarkedPdfBuffer = await previewWatermark(fileName, watermarkOptions);
    
    // 设置响应头以在浏览器中预览PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="watermark-preview.pdf"');
    
    // 发送处理后的PDF
    res.send(watermarkedPdfBuffer);
  } catch (error) {
    console.error('水印预览错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
    });
  }
};

// 新增：支持进度的水印处理控制器
const handleWatermarkWithProgress = async (req, res) => {
  try {
    // 设置响应头以支持SSE（Server-Sent Events）
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // 发送初始消息
    res.write('data: {"type": "init", "message": "开始处理"}\n\n');

    // 获取请求参数
    let { fileName } = req.query;
    
    // 如果文件名包含编码过的URI组件，进行解码
    if (fileName) {
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        console.warn('文件名解码失败:', e);
        res.write('data: {"type": "error", "message": "文件名解码失败"}\n\n');
        res.end();
        return;
      }
    }
    
    const watermarkOptions = {
      text: req.query.text || 'WATERMARK',
      fontSize: parseInt(req.query.fontSize) || 20,
      fontColor: req.query.fontColor || '#8B4513',
      opacity: parseInt(req.query.opacity) || 50,
      position: req.query.position || 'center'
    };
    
    // 转换透明度值为小数
    watermarkOptions.opacity = watermarkOptions.opacity / 100;
    
    // 如果没有提供文件名，则返回错误
    if (!fileName) {
      res.write('data: {"type": "error", "message": "缺少文件名参数"}\n\n');
      res.end();
      return;
    }

    // 定义进度回调函数
    const progressCallback = (data) => {
      // 检查响应是否已经结束
      if (res.writableEnded) {
        return;
      }
      // 发送进度数据到客户端
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('发送进度数据时出错:', err);
      }
    };

    // 处理水印并传递进度回调
    const result = await processWatermark(fileName, watermarkOptions, progressCallback);
    
    // 检查响应是否已经结束
    if (res.writableEnded) {
      return;
    }
    
    // 发送最终结果
    res.write(`data: ${JSON.stringify({ type: 'result', data: result })}\n\n`);
    res.end();
  } catch (error) {
    console.error('水印处理错误:', error);
    // 检查响应是否已经结束
    if (!res.writableEnded) {
      // 发送错误信息到客户端
      try {
        res.write(`data: {"type": "error", "message": "${error.message}"}\n\n`);
        res.end();
      } catch (err) {
        console.error('发送错误信息时出错:', err);
      }
    }
  }
};

// 新增：支持进度的水印预览控制器
const handlePreviewWatermarkWithProgress = async (req, res) => {
  try {
    // 设置响应头以支持SSE（Server-Sent Events）
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // 发送初始消息
    res.write('data: {"type": "init", "message": "开始处理"}\n\n');

    // 获取请求参数
    let { fileName } = req.query;
    
    // 如果文件名包含编码过的URI组件，进行解码
    if (fileName) {
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        console.warn('文件名解码失败:', e);
        res.write('data: {"type": "error", "message": "文件名解码失败"}\n\n');
        res.end();
        return;
      }
    }
    
    const watermarkOptions = {
      text: req.query.text || 'WATERMARK',
      fontSize: parseInt(req.query.fontSize) || 20,
      fontColor: req.query.fontColor || '#8B4513',
      opacity: parseInt(req.query.opacity) || 50,
      position: req.query.position || 'center'
    };
    
    // 转换透明度值为小数
    watermarkOptions.opacity = watermarkOptions.opacity / 100;
    
    // 如果没有提供文件名，则返回错误
    if (!fileName) {
      res.write('data: {"type": "error", "message": "缺少文件名参数"}\n\n');
      res.end();
      return;
    }

    // 定义进度回调函数
    const progressCallback = (data) => {
      // 检查响应是否已经结束
      if (res.writableEnded) {
        return;
      }
      // 发送进度数据到客户端
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('发送进度数据时出错:', err);
      }
    };

    // 预览水印并传递进度回调
    const watermarkedPdfBuffer = await previewWatermark(fileName, watermarkOptions, progressCallback);
    
    // 检查响应是否已经结束
    if (res.writableEnded) {
      return;
    }
    
    // 发送完成消息和预览数据
    res.write(`data: ${JSON.stringify({ type: 'preview_complete', bufferLength: watermarkedPdfBuffer.length })}\n\n`);
    
    // 将buffer数据分块发送
    const chunkSize = 1024 * 1024; // 1MB chunks
    for (let i = 0; i < watermarkedPdfBuffer.length; i += chunkSize) {
      // 检查响应是否已经结束
      if (res.writableEnded) {
        return;
      }
      const chunk = watermarkedPdfBuffer.slice(i, Math.min(i + chunkSize, watermarkedPdfBuffer.length));
      const chunkBase64 = chunk.toString('base64');
      try {
        res.write(`data: ${JSON.stringify({ type: 'chunk', data: chunkBase64, index: i })}\n\n`);
        // 添加一个小延迟以确保数据被正确发送
        await new Promise(resolve => setTimeout(resolve, 1));
      } catch (err) {
        console.error('发送数据块时出错:', err);
        break;
      }
    }
    
    // 检查响应是否已经结束
    if (res.writableEnded) {
      return;
    }
    
    // 发送结束信号
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('水印预览错误:', error);
    // 检查响应是否已经结束
    if (!res.writableEnded) {
      // 发送错误信息到客户端
      try {
        res.write(`data: {"type": "error", "message": "${error.message}"}\n\n`);
        res.end();
      } catch (err) {
        console.error('发送错误信息时出错:', err);
      }
    }
  }
};

module.exports = {
  handleWatermark,
  handlePreviewWatermark,
  handleWatermarkWithProgress,
  handlePreviewWatermarkWithProgress
};