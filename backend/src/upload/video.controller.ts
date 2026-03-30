// ═══════════════════════════════════════════════════════════════
// video.controller.ts
// ═══════════════════════════════════════════════════════════════
import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { VideoService } from './video.service';

@ApiTags('Video')
@Controller('video')
export class VideoController {
  constructor(private videoService: VideoService) {}

  @Post('upload/:candidateId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload vidéo candidat sur Cloudinary' })
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  uploadVideo(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.videoService.uploadVideo(
      candidateId,
      user.id,
      file,
      user.role === UserRole.ADMIN,
    );
  }

  @Delete(':candidateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "[ADMIN] Supprimer la vidéo d'un candidat" })
  deleteVideo(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: any,
  ) {
    return this.videoService.deleteVideo(candidateId, user.id, true);
  }
}
