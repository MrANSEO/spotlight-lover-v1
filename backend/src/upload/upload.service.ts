import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UploadService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadVideo(file: Express.Multer.File, candidateId: string, userId: string) {
    // Validate file
    this.validateVideoFile(file);

    // Check candidate exists and belongs to user
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new BadRequestException('Candidate not found');
    }

    if (candidate.userId !== userId) {
      throw new BadRequestException('Candidate does not belong to this user');
    }

    try {
      // Upload video to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'spotlight-lover/videos',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(file.buffer);
      });

      const uploadResult = result as any;

      // Generate thumbnail
      const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 400, height: 600, crop: 'fill' },
          { quality: 'auto' },
        ],
      });

      // Update candidate with video URLs
      const updatedCandidate = await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          videoUrl: uploadResult.secure_url,
          thumbnailUrl,
          videoPublicId: uploadResult.public_id,
        },
      });

      return {
        message: 'Video uploaded successfully',
        candidate: updatedCandidate,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async deleteVideo(candidateId: string, userId: string, isAdmin: boolean = false) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new BadRequestException('Candidate not found');
    }

    if (!isAdmin && candidate.userId !== userId) {
      throw new BadRequestException('Unauthorized to delete this video');
    }

    if (!candidate.videoPublicId) {
      throw new BadRequestException('No video to delete');
    }

    try {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(candidate.videoPublicId, {
        resource_type: 'video',
      });

      // Update candidate
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          videoUrl: null,
          thumbnailUrl: null,
          videoPublicId: null,
        },
      });

      return { message: 'Video deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Deletion failed: ${error.message}`);
    }
  }

  private validateVideoFile(file: Express.Multer.File) {
    const allowedFormats = (this.configService.get('ALLOWED_VIDEO_FORMATS') || 'mp4,webm,mov')
      .split(',')
      .map((f) => f.trim());

    const maxSizeMB = parseInt(this.configService.get('MAX_VIDEO_SIZE_MB') || '200');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Check file size
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Check file format
    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedFormats.includes(fileExt)) {
      throw new BadRequestException(`Only ${allowedFormats.join(', ')} formats are allowed`);
    }

    // Check MIME type
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video file type');
    }
  }
}
