import { NextResponse } from "next/server";
import { createS3StorageService } from "@/infrastructure/adapters/storage/s3-storage-service";
import type { AllowedFileType } from "@/infrastructure/adapters/storage/s3-storage-service";

// Helper to get content type from file extension
const getContentTypeFromExtension = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',

    // Videos
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
    wmv: 'video/x-ms-wmv',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
  };

  return mimeTypes[extension as keyof typeof mimeTypes] || 'application/octet-stream';
};

/**
 * POST /api/upload
 * Upload file to S3
 */
export async function POST(request: Request) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let fileType = formData.get("fileType") as AllowedFileType | null;
    const folder = formData.get("folder") as string | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If fileType not provided, try to guess from content type
    if (!fileType) {
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else fileType = 'document';
    }

    // Get content type from file or guess from extension
    let contentType = file.type || getContentTypeFromExtension(file.name);

    // Validate file type
    if (!["image", "video", "document"].includes(fileType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Must be 'image', 'video', or 'document'"
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Create S3 service
      const s3Service = createS3StorageService();

      // Validate file size
      if (!s3Service.validateFileSize(file.size, fileType)) {
        return NextResponse.json(
          {
            success: false,
            error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed for ${fileType}`
          },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to S3
      const result = await s3Service.upload({
        file: buffer,
        fileName: file.name,
        fileType,
        contentType: contentType,
        folder: folder || undefined,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Upload failed' },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return NextResponse.json(
        {
          success: true,
          url: result.url,
          key: result.key,
          fileName: file.name,
          fileSize: file.size,
          fileType: contentType
        },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid request',
      },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/upload
 * Delete file from S3
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { success: false, error: "No file key provided" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const s3Service = createS3StorageService();
    const success = await s3Service.delete(key);

    return NextResponse.json(
      { success },
      { status: success ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete file",
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle OPTIONS for CORS preflight
// This is important for file uploads from browsers
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
