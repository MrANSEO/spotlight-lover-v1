import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('video/:candidateId')
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({ summary: 'Upload candidate video' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or candidate' })
  async uploadVideo(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    return this.uploadService.uploadVideo(file, candidateId, user.id);
  }

  @Delete('video/:candidateId')
  @ApiOperation({ summary: 'Delete candidate video' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid candidate or no video found' })
  async deleteVideo(@Param('candidateId') candidateId: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.uploadService.deleteVideo(candidateId, user.id, isAdmin);
  }

  @Delete('video/:candidateId/admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete candidate video (Admin only)' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  async deleteVideoAdmin(@Param('candidateId') candidateId: string, @CurrentUser() user: any) {
    return this.uploadService.deleteVideo(candidateId, user.id, true);
  }
}
