// src/upload/video.service.ts — VERSION CORRIGÉE
// Remplace intégralement ton fichier existant.
//
// CORRECTION du TimeoutError 499 :
//   Le SDK Cloudinary n'avait pas de timeout configuré.
//   Ajout de timeout: 300000 (5 min) et chunk_size: 6000000 (6MB)
//   pour les uploads stables même sur connexion lente.

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadVideo(
    candidateId: string,
    userId: string,
    file: Express.Multer.File,
    isAdmin = false,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate) throw new NotFoundException('Candidat non trouvé.');
    if (!isAdmin && candidate.userId !== userId)
      throw new ForbiddenException('Non autorisé.');
    if (candidate.status !== 'ACTIVE')
      throw new BadRequestException(
        'Votre compte candidat doit être actif pour uploader une vidéo.',
      );

    this.validateVideoFile(file);

    // Supprimer l'ancienne vidéo si elle existe
    if (candidate.videoPublicId) {
      await cloudinary.uploader
        .destroy(candidate.videoPublicId, { resource_type: 'video' })
        .catch(() => {});
    }

    // ✅ CORRECTION : timeout 5 minutes + chunk_size 6MB
    // Sans timeout, le SDK attend indéfiniment → TimeoutError 499 côté serveur
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'spotlight-lover/videos',
          public_id: `candidate_${candidateId}_${Date.now()}`,
          transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
          eager: [{ width: 400, height: 600, crop: 'fill', format: 'jpg' }],
          eager_async: true,
          timeout: 300000,      // ✅ 5 minutes
          chunk_size: 6000000,  // ✅ 6MB par chunk — stable sur connexion lente
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(file.buffer);
    });

    // Validate video duration
    if (result.duration) {
      this.validateVideoDuration(result.duration);
    } else {
      console.warn(`Warning: Could not determine video duration for ${result.public_id}`);
    }

    const thumbnailUrl = cloudinary.url(result.public_id, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 400, height: 600, crop: 'fill' },
        { quality: 'auto' },
      ],
    });

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: {
        videoUrl: result.secure_url,
        thumbnailUrl,
        videoPublicId: result.public_id,
      },
    });

    return { message: 'Vidéo uploadée avec succès.', candidate: updated };
  }

  async deleteVideo(candidateId: string, userId: string, isAdmin = false) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate) throw new NotFoundException('Candidat non trouvé.');
    if (!isAdmin && candidate.userId !== userId)
      throw new ForbiddenException('Non autorisé.');
    if (!candidate.videoPublicId)
      throw new BadRequestException('Aucune vidéo à supprimer.');

    await cloudinary.uploader.destroy(candidate.videoPublicId, {
      resource_type: 'video',
    });
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { videoUrl: null, thumbnailUrl: null, videoPublicId: null },
    });

    return { message: 'Vidéo supprimée.' };
  }

  private validateVideoFile(file: Express.Multer.File) {
    const maxMB = parseInt(this.config.get('MAX_VIDEO_SIZE_MB', '200'));
    if (file.size > maxMB * 1024 * 1024)
      throw new BadRequestException(`Fichier trop lourd (max ${maxMB}MB).`);
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException(
        'Format non supporté. Utilisez MP4, WebM ou MOV.',
      );
  }

  private validateVideoDuration(durationSeconds: number): void {
    const minDuration = parseInt(this.config.get('MIN_VIDEO_DURATION_SECONDS', '0'));
    const maxDuration = parseInt(this.config.get('MAX_VIDEO_DURATION_SECONDS', '900'));

    if (durationSeconds < minDuration) {
      throw new BadRequestException(
        `Vidéo trop courte. Durée minimale: ${minDuration}s (durée détectée: ${durationSeconds}s)`,
      );
    }
    if (durationSeconds > maxDuration) {
      throw new BadRequestException(
        `Vidéo trop longue. Durée maximale: ${maxDuration}s (durée détectée: ${durationSeconds}s)`,
      );
    }
  }
}