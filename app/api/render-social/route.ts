import { NextRequest, NextResponse } from 'next/server';
import { renderSocialSchema } from '@/lib/api-validation';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload base64 image to Cloudinary and return URL
 */
async function uploadToCloudinary(base64Data: string): Promise<string | null> {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary not configured, skipping upload');
      return null;
    }

    // Extract base64 string (remove data:image/png;base64, prefix)
    const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64String}`,
      {
        folder: 'ink-lings/social-media',
        resource_type: 'image',
        format: 'png',
      }
    );

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

/**
 * API endpoint to render social media images
 * 
 * Accepts a background image and text elements, then uses Playwright
 * to render them as a PNG image.
 * 
 * Expected payload:
 * {
 *   "backgroundImage": "url or data:image/... base64",
 *   "width": 1080,
 *   "height": 1080,
 *   "textElements": [
 *     {
 *       "text": "Hello World",
 *       "x": 100,
 *       "y": 200,
 *       "fontFamily": "Arial",
 *       "fontSize": 24,
 *       "color": "#000000",
 *       "textAlign": "left|center|right",
 *       "fontWeight": "normal|bold",
 *       "maxWidth": 800 // optional
 *     }
 *   ]
 * }
 */
// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret, Authorization',
    },
  });
}

// Simple GET handler for testing
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Render Social API is working. Use POST to render images.',
      endpoint: '/api/render-social',
      method: 'POST',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - 30 requests per minute
    const rateLimitResult = rateLimit(request, 30, 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // SECURITY: Webhook secret authentication
    const expectedSecret = process.env.RENDER_SOCIAL_WEBHOOK_SECRET;
    if (expectedSecret) {
      const providedSecret = 
        request.headers.get('x-webhook-secret') || 
        request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!providedSecret || providedSecret !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Valid webhook secret required' },
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Get raw body to transform Airtable format
    let rawBody: Record<string, unknown>;
    try {
      rawBody = await request.json() as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Transform Airtable format to expected format
    // Airtable attachment fields come as arrays: [{url: "..."}]
    let backgroundImage: string;
    if (Array.isArray(rawBody.backgroundImage)) {
      // Extract URL from first attachment
      const firstItem = rawBody.backgroundImage[0];
      if (firstItem && typeof firstItem === 'object' && 'url' in firstItem) {
        backgroundImage = String((firstItem as { url: unknown }).url || firstItem || '');
      } else {
        backgroundImage = String(firstItem || '');
      }
    } else if (rawBody.backgroundImage && typeof rawBody.backgroundImage === 'object' && 'url' in rawBody.backgroundImage) {
      backgroundImage = String((rawBody.backgroundImage as { url: unknown }).url || '');
    } else {
      backgroundImage = String(rawBody.backgroundImage || '');
    }

    // Transform textElements if needed
    const textElementsArray = Array.isArray(rawBody.textElements) ? rawBody.textElements : [];
    const transformedTextElements = textElementsArray.map((element: unknown) => {
      const el = element as Record<string, unknown>;
      return {
        text: String(el.text || ''),
        x: typeof el.x === 'string' ? parseInt(el.x, 10) : (typeof el.x === 'number' ? el.x : 0),
        y: typeof el.y === 'string' ? parseInt(el.y, 10) : (typeof el.y === 'number' ? el.y : 0),
        fontFamily: Array.isArray(el.fontFamily) 
          ? String(el.fontFamily[0] || 'Arial')
          : String(el.fontFamily || 'Arial'),
        fontSize: typeof el.fontSize === 'string' ? parseInt(el.fontSize, 10) : (typeof el.fontSize === 'number' ? el.fontSize : 24),
        color: String(el.color || '#000000'),
        textAlign: (el.textAlign || 'left') as 'left' | 'center' | 'right',
        fontWeight: String(el.fontWeight || 'normal'),
        maxWidth: el.maxWidth ? (typeof el.maxWidth === 'string' ? parseInt(el.maxWidth, 10) : el.maxWidth as number) : undefined,
        lineHeight: el.lineHeight ? (typeof el.lineHeight === 'string' ? parseFloat(el.lineHeight) : el.lineHeight as number) : undefined,
        letterSpacing: el.letterSpacing ? String(el.letterSpacing) : undefined,
      };
    });

    // Create transformed body for validation
    const transformedBody = {
      backgroundImage,
      width: typeof rawBody.width === 'string' ? parseInt(rawBody.width, 10) : (typeof rawBody.width === 'number' ? rawBody.width : 1080),
      height: typeof rawBody.height === 'string' ? parseInt(rawBody.height, 10) : (typeof rawBody.height === 'number' ? rawBody.height : 1080),
      textElements: transformedTextElements,
    };

    // Validate transformed body using Zod directly
    let validatedBgImage: string;
    let width: number;
    let height: number;
    let textElements: Array<{
      text: string;
      x: number;
      y: number;
      fontFamily: string;
      fontSize: number;
      color: string;
      textAlign?: 'left' | 'center' | 'right';
      fontWeight?: string;
      maxWidth?: number;
    }>;
    
    try {
      const validated = renderSocialSchema.parse(transformedBody);
      validatedBgImage = validated.backgroundImage;
      width = validated.width;
      height = validated.height;
      textElements = validated.textElements;
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues,
          },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          message: error instanceof Error ? error.message : 'Unknown validation error'
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use HTML/CSS to Image API for reliable text rendering
    // This avoids native dependency issues and provides consistent results
    
    // Fetch and convert background image to base64 for embedding
    let backgroundImageBase64: string;
    try {
      let imageBuffer: Buffer;
      if (validatedBgImage.startsWith('data:')) {
        // Already base64
        const base64Data = validatedBgImage.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
        backgroundImageBase64 = validatedBgImage;
      } else {
        // Fetch external image
        const imageResponse = await axios.get(validatedBgImage, {
          responseType: 'arraybuffer',
          timeout: 10000,
        });
        imageBuffer = Buffer.from(imageResponse.data);
        const base64String = imageBuffer.toString('base64');
        // Determine MIME type from response or default to jpeg
        const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
        backgroundImageBase64 = `data:${contentType};base64,${base64String}`;
      }
    } catch (error) {
      console.error('Error fetching background image:', error);
      return NextResponse.json(
        {
          error: 'Failed to load background image',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Build HTML with background image and text elements
    // Best practice: For absolute positioning with max-width and centering:
    // 1. Set fixed width (not just max-width) when wrapping is needed
    // 2. Calculate left position based on alignment (avoid transform conflicts)
    // 3. Use text-align for text alignment inside the container
    // 4. Use white-space: normal to allow wrapping
    const textElementsHTML = textElements.map((element) => {
      const textAlign = element.textAlign || 'left';
      const maxWidth = element.maxWidth ? Number(element.maxWidth) : null;
      
      // Calculate left position and width based on alignment
      let left = element.x;
      let width = '';
      
      if (maxWidth) {
        // When maxWidth is set, use fixed width for proper wrapping
        if (textAlign === 'center') {
          // Center: position left edge at (x - maxWidth/2)
          left = element.x - (maxWidth / 2);
          width = `width: ${maxWidth}px;`;
        } else if (textAlign === 'right') {
          // Right: position right edge at x, so left = x - width
          left = element.x - maxWidth;
          width = `width: ${maxWidth}px;`;
        } else {
          // Left: position left edge at x
          width = `width: ${maxWidth}px;`;
        }
      }
      
      // Escape HTML in text
      const escapedText = element.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      // Best practice: Use transform for centering WITH width constraint
      // The key is: width + transform + box-sizing work together
      let style = '';
      
      if (maxWidth && textAlign === 'center') {
        // For centered text with maxWidth: use transform + width + box-sizing
        style = `
          position: absolute;
          top: ${element.y}px;
          left: ${element.x}px;
          transform: translate(-50%, 0);
          width: ${maxWidth}px;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: ${element.fontFamily}, sans-serif;
          font-size: ${element.fontSize}px;
          color: ${element.color};
          text-align: center;
          font-weight: ${element.fontWeight || 'normal'};
          white-space: normal;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          line-height: ${(element as { lineHeight?: number }).lineHeight ? `${(element as { lineHeight?: number }).lineHeight}` : `${element.fontSize * 1.2}px`};
          letter-spacing: ${(element as { letterSpacing?: string }).letterSpacing || '0em'};
        `.trim().replace(/\s+/g, ' ');
      } else if (maxWidth) {
        // For left/right aligned text with maxWidth: use fixed width
        style = `
          position: absolute;
          left: ${left}px;
          top: ${element.y}px;
          width: ${maxWidth}px;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: ${element.fontFamily}, sans-serif;
          font-size: ${element.fontSize}px;
          color: ${element.color};
          text-align: ${textAlign};
          font-weight: ${element.fontWeight || 'normal'};
          white-space: normal;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          line-height: ${(element as { lineHeight?: number }).lineHeight ? `${(element as { lineHeight?: number }).lineHeight}` : `${element.fontSize * 1.2}px`};
          letter-spacing: ${(element as { letterSpacing?: string }).letterSpacing || '0em'};
        `.trim().replace(/\s+/g, ' ');
      } else {
        // No maxWidth - use transform for alignment without width constraint
        let transform = '';
        if (textAlign === 'center') {
          transform = 'transform: translateX(-50%);';
        } else if (textAlign === 'right') {
          transform = 'transform: translateX(-100%);';
        }
        
        style = `
          position: absolute;
          left: ${left}px;
          top: ${element.y}px;
          ${transform}
          margin: 0;
          padding: 0;
          font-family: ${element.fontFamily}, sans-serif;
          font-size: ${element.fontSize}px;
          color: ${element.color};
          text-align: ${textAlign};
          font-weight: ${element.fontWeight || 'normal'};
          white-space: nowrap;
          line-height: ${(element as { lineHeight?: number }).lineHeight ? `${(element as { lineHeight?: number }).lineHeight}` : `${element.fontSize * 1.2}px`};
          letter-spacing: ${(element as { letterSpacing?: string }).letterSpacing || '0em'};
        `.trim().replace(/\s+/g, ' ');
      }
      
      return `<div class="text-element" style="${style}">${escapedText}</div>`;
    }).join('\n');

    // Get unique font families and create Google Fonts import
    const uniqueFonts = [...new Set(textElements.map(e => e.fontFamily))];
    const googleFontsUrl = uniqueFonts
      .map(font => font.replace(/\s+/g, '+'))
      .join('|');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${googleFontsUrl ? `<link href="https://fonts.googleapis.com/css2?family=${googleFontsUrl}:wght@400;700&display=swap" rel="stylesheet">` : ''}
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html {
              width: ${width}px;
              height: ${height}px;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            body {
              width: ${width}px;
              height: ${height}px;
              margin: 0;
              padding: 0;
              overflow: hidden;
              position: relative;
              background-image: url('${backgroundImageBase64}');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            .text-element {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
              backface-visibility: hidden;
              transform: translateZ(0);
            }
          </style>
        </head>
        <body>
          ${textElementsHTML}
        </body>
      </html>
    `;

    // Use htmlcsstoimage.com API (free tier: 50 images/month)
    // Alternative: screenshotapi.net or similar
    const htmlcsstoimageApiKey = process.env.HTMLCSSTOIMAGE_API_KEY;
    const htmlcsstoimageUserId = process.env.HTMLCSSTOIMAGE_USER_ID;

    if (!htmlcsstoimageApiKey || !htmlcsstoimageUserId) {
      // Fallback: Use screenshotapi.net (no API key needed for basic usage)
      try {
        const screenshotResponse = await axios.post(
          'https://screenshotapi.net/api/v1/screenshot',
          {
            token: process.env.SCREENSHOTAPI_TOKEN || 'demo', // Get free token at screenshotapi.net
            url: `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
            width: width,
            height: height,
            output: 'image',
            file_type: 'png',
          },
          {
            responseType: 'arraybuffer',
            timeout: 30000,
          }
        );

        const base64Image = Buffer.from(screenshotResponse.data, 'binary').toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;

        // Upload to Cloudinary and get URL
        const cloudinaryUrl = await uploadToCloudinary(dataUrl);

        return NextResponse.json(
          {
            success: true,
            url: cloudinaryUrl || dataUrl, // Use Cloudinary URL if available, fallback to base64
            base64: dataUrl, // Always include base64 for backwards compatibility
            image: cloudinaryUrl || dataUrl,
            format: 'png',
            dimensions: { width, height },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (error) {
        console.error('Screenshot API error:', error);
        return NextResponse.json(
          {
            error: 'Failed to generate image',
            message: 'Image generation service unavailable. Please set HTMLCSSTOIMAGE_API_KEY and HTMLCSSTOIMAGE_USER_ID, or SCREENSHOTAPI_TOKEN in environment variables.',
          },
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Use htmlcsstoimage.com if API key is provided
    try {
      const response = await axios.post(
        'https://hcti.io/v1/image',
        {
          html: html,
          css: '',
          google_fonts: uniqueFonts.join('|'),
          device_scale_factor: 2, // Higher quality rendering
          ms_delay: 1000, // Wait for fonts to load
          viewport_width: width, // Explicit viewport width
          viewport_height: height, // Explicit viewport height
        },
        {
          auth: {
            username: htmlcsstoimageUserId,
            password: htmlcsstoimageApiKey,
          },
          timeout: 30000,
        }
      );

      // Fetch the generated image
      const imageResponse = await axios.get(response.data.url, {
        responseType: 'arraybuffer',
      });

      const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      // Upload to Cloudinary and get URL
      const cloudinaryUrl = await uploadToCloudinary(dataUrl);

      return NextResponse.json(
        {
          success: true,
          url: cloudinaryUrl || dataUrl, // Use Cloudinary URL if available, fallback to base64
          base64: dataUrl, // Always include base64 for backwards compatibility
          image: cloudinaryUrl || dataUrl,
          format: 'png',
          dimensions: { width, height },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      console.error('HTML/CSS to Image API error:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate image',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error('Error rendering social media image:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}


