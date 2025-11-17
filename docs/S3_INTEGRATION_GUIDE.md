# S3 Upload Integration Guide

This guide explains how to integrate S3 file upload functionality into your modules (Categories, Products, Banners).

## Setup

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_PUBLIC_URL=https://your-cloudfront-or-s3-url.com  # Optional: Custom domain
```

### 2. Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Components

### ImageUpload Component

Located at: `app/(features)/_shared/components/ImageUpload.tsx`

**Features:**
- Drag & drop / Click to upload
- Image preview
- File size validation
- Upload progress indicator
- Remove/change functionality
- S3 integration via API

**Props:**
```typescript
interface ImageUploadProps {
  value?: string;              // Current image URL
  onChange: (url: string, key?: string) => void;
  folder?: string;             // S3 folder/prefix (default: "images")
  label?: string;              // Field label
  accept?: string;             // File types (default: "image/*")
  maxSize?: number;            // Max size in MB (default: 10)
  disabled?: boolean;
}
```

## Integration Examples

### Example 1: Categories Module

```tsx
// app/(features)/categories/components/CategoryForm.tsx
"use client";

import { ImageUpload } from "@/app/(features)/_shared/components/ImageUpload";
import { useState } from "react";

export function CategoryForm() {
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // imageUrl now contains the S3 URL
    const categoryData = {
      name: "Category Name",
      image: imageUrl,
    };

    // Submit to API...
  };

  return (
    <form onSubmit={handleSubmit}>
      <ImageUpload
        value={imageUrl}
        onChange={(url) => setImageUrl(url)}
        folder="categories"
        label="Category Image"
        maxSize={5}
      />
      {/* Other form fields... */}
    </form>
  );
}
```

### Example 2: Products Module

```tsx
// app/(features)/products/components/ProductForm.tsx
"use client";

import { ImageUpload } from "@/app/(features)/_shared/components/ImageUpload";
import { useState } from "react";

export function ProductForm() {
  const [productImages, setProductImages] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      {/* Main Product Image */}
      <ImageUpload
        value={productImages[0]}
        onChange={(url) => setProductImages([url, ...productImages.slice(1)])}
        folder="products"
        label="Main Product Image"
        maxSize={10}
      />

      {/* Additional Images */}
      {[1, 2, 3].map((index) => (
        <ImageUpload
          key={index}
          value={productImages[index]}
          onChange={(url) => {
            const newImages = [...productImages];
            newImages[index] = url;
            setProductImages(newImages);
          }}
          folder="products"
          label={`Product Image ${index + 1}`}
          maxSize={10}
        />
      ))}
    </div>
  );
}
```

### Example 3: Banners Module

```tsx
// app/(features)/banners/components/BannerForm.tsx
"use client";

import { ImageUpload } from "@/app/(features)/_shared/components/ImageUpload";

export function BannerForm() {
  const [bannerUrl, setBannerUrl] = useState("");

  return (
    <ImageUpload
      value={bannerUrl}
      onChange={(url) => setBannerUrl(url)}
      folder="banners"
      label="Banner Image"
      accept="image/jpeg,image/png,image/webp"
      maxSize={5}
    />
  );
}
```

## API Usage (Direct Upload)

If you need to upload files programmatically without using the component:

```typescript
// Upload file
const formData = new FormData();
formData.append("file", file);
formData.append("fileType", "image");
formData.append("folder", "products");

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const result = await response.json();
// result = { success: true, url: "...", key: "..." }

// Delete file
await fetch(`/api/upload?key=${encodeURIComponent(key)}`, {
  method: "DELETE",
});
```

## Using the Hook Directly

```typescript
import { useFileUpload } from "@/lib/hooks/use-file-upload";

function MyComponent() {
  const { isUploading, upload, url, error } = useFileUpload({
    fileType: "image",
    folder: "custom-folder",
    onSuccess: (url, key) => {
      console.log("Uploaded:", url);
    },
  });

  const handleFileSelect = async (file: File) => {
    await upload(file);
  };

  return (
    <div>
      {isUploading && <p>Uploading...</p>}
      {error && <p>Error: {error}</p>}
      {url && <img src={url} alt="Uploaded" />}
    </div>
  );
}
```

## File Type Support

### Images
- **Formats:** JPEG, PNG, GIF, WebP, SVG
- **Max Size:** 10 MB (configurable)
- **Use Cases:** Categories, Products, Banners, Avatars

### Videos
- **Formats:** MP4, MPEG, QuickTime, AVI, WebM
- **Max Size:** 500 MB (configurable)
- **Use Cases:** Product demos, Marketing posts

### Documents
- **Formats:** PDF, Word, Excel
- **Max Size:** 20 MB (configurable)
- **Use Cases:** Product manuals, Invoices

## Security Considerations

1. **File Validation:** Files are validated on the server for type and size
2. **S3 Bucket Policy:** Configure your bucket policy for public read if needed
3. **CloudFront:** Use CloudFront for better performance and security
4. **Pre-signed URLs:** Use for private files (already implemented in service)

## Troubleshooting

### Upload Fails
- Check AWS credentials in `.env.local`
- Verify S3 bucket permissions
- Check file size limits

### Images Not Displaying
- Verify S3 bucket CORS settings
- Check bucket public access settings
- Verify CloudFront distribution (if used)

### Performance Issues
- Use CloudFront for CDN
- Optimize image sizes before upload
- Enable S3 Transfer Acceleration

## Next Steps

1. **Image Optimization:** Add image compression before upload
2. **Multiple File Upload:** Support drag & drop multiple files
3. **Progress Tracking:** Add real upload progress (currently shows loading state)
4. **Image Cropping:** Add built-in image cropper
5. **CDN Integration:** Configure CloudFront distribution
