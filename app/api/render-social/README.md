# Social Media Image Renderer API

This endpoint renders social media images by overlaying text on background images using Playwright.

## Endpoint

`POST /api/render-social`

## Authentication

Set `RENDER_SOCIAL_WEBHOOK_SECRET` in your environment variables. The webhook should send this secret in either:
- Header: `x-webhook-secret`
- Header: `Authorization: Bearer <secret>`

If the secret is not set, the endpoint will be publicly accessible (not recommended for production).

## Request Body

```json
{
  "backgroundImage": "https://example.com/image.jpg",
  "width": 1080,
  "height": 1080,
  "textElements": [
    {
      "text": "Your text here",
      "x": 100,
      "y": 200,
      "fontFamily": "Arial",
      "fontSize": 24,
      "color": "#000000",
      "textAlign": "left",
      "fontWeight": "normal",
      "maxWidth": 800
    }
  ]
}
```

### Parameters

- **backgroundImage** (required): URL or base64 data URI of the background image
- **width** (required): Image width in pixels (max 5000)
- **height** (required): Image height in pixels (max 5000)
- **textElements** (required): Array of text elements to overlay

### Text Element Properties

- **text** (required): The text to display
- **x** (required): X position in pixels (left offset)
- **y** (required): Y position in pixels (top offset)
- **fontFamily** (required): Font family name (e.g., "Arial", "Helvetica", "Times New Roman")
- **fontSize** (required): Font size in pixels
- **color** (required): Hex color code (e.g., "#000000" or "#fff")
- **textAlign** (optional): Text alignment - "left", "center", or "right" (default: "left")
- **fontWeight** (optional): Font weight - "normal", "bold", or numeric 100-900 (default: "normal")
- **maxWidth** (optional): Maximum width in pixels for text wrapping

## Response

```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "format": "png",
  "dimensions": {
    "width": 1080,
    "height": 1080
  }
}
```

## Airtable Webhook Setup

1. In Airtable, create an automation that triggers on record creation/update
2. Add a "Send webhook" action
3. Configure:
   - **URL**: `https://www.inklingsjournal.live/api/render-social`
   - **Method**: POST
   - **Headers**:
     - `Content-Type: application/json`
     - `x-webhook-secret: <your-secret-from-env>`
   - **Body**: JSON with the structure above, using Airtable field references

## Example Airtable Webhook Body

```json
{
  "backgroundImage": "{{Background Image URL}}",
  "width": 1080,
  "height": 1080,
  "textElements": [
    {
      "text": "{{Prompt Text}}",
      "x": {{X Position}},
      "y": {{Y Position}},
      "fontFamily": "{{Font Family}}",
      "fontSize": {{Font Size}},
      "color": "{{Text Color}}",
      "textAlign": "{{Text Align}}",
      "fontWeight": "{{Font Weight}}"
    }
  ]
}
```

## Rate Limiting

- 30 requests per minute per IP address

## Notes

- The endpoint uses Playwright to render HTML in a headless browser
- Background images can be URLs or base64 data URis
- Text positioning is absolute (x, y coordinates from top-left)
- For Vercel deployment, Playwright browsers are automatically bundled

## Vercel Configuration

For optimal performance on Vercel, you may want to configure function settings in `vercel.json`:

```json
{
  "functions": {
    "app/api/render-social/route.ts": {
      "maxDuration": 30,
      "memory": 3008
    }
  }
}
```

This ensures the function has enough time and memory to launch Playwright and render images.

## Local Testing

You can test the endpoint locally with curl:

```bash
curl -X POST http://localhost:3000/api/render-social \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret-here" \
  -d '{
    "backgroundImage": "https://example.com/background.jpg",
    "width": 1080,
    "height": 1080,
    "textElements": [
      {
        "text": "Test Text",
        "x": 100,
        "y": 200,
        "fontFamily": "Arial",
        "fontSize": 48,
        "color": "#000000",
        "textAlign": "center"
      }
    ]
  }'
```

