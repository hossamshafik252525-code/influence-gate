import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import 'multer';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UploadService } from '../services/upload.service';
import { UploadResult } from '../interfaces';

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadService.upload(file);
  }

  @Post('batch')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadResult[]> {
    return this.uploadService.uploadMany(files);
  }
}
