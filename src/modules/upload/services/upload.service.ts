import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { UploadType } from '../enums';
import { UploadResult } from '../interfaces';

interface TypeConfig {
  folder: string;
  allowedMimes: string[];
  allowedExtensions: string[];
  isImage: boolean;
}

const TYPE_CONFIGS: Record<UploadType, TypeConfig> = {
  [UploadType.IMAGE]: {
    folder: 'influence_gate',
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    isImage: true,
  },
  [UploadType.PDF]: {
    folder: 'campaign_pdfs',
    allowedMimes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    isImage: false,
  },
  [UploadType.SUBMISSION]: {
    folder: 'submissions',
    allowedMimes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
    ],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
    isImage: false,
  },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async upload(file: Express.Multer.File, type: UploadType): Promise<UploadResult> {
    const config = TYPE_CONFIGS[type];

    this.validateFileSize(file);
    this.validateMimeType(file, config);
    await this.validateMagicBytes(file, config);

    const result = config.isImage
      ? await this.cloudinaryService.uploadImage(file, config.folder)
      : await this.cloudinaryService.uploadFile(file, config.folder);

    return {
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
    };
  }

  private validateFileSize(file: Express.Multer.File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح به (50MB)');
    }
  }

  private validateMimeType(file: Express.Multer.File, config: TypeConfig): void {
    if (!config.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `نوع الملف غير مدعوم. الأنواع المسموح بها: ${config.allowedExtensions.join(', ')}`,
      );
    }
  }

  private async validateMagicBytes(
    file: Express.Multer.File,
    config: TypeConfig,
  ): Promise<void> {
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected) {
      if (file.mimetype === 'image/svg+xml') {
        return;
      }
      throw new BadRequestException('تعذّر التحقق من نوع الملف');
    }

    if (!config.allowedExtensions.includes(detected.ext)) {
      throw new BadRequestException(
        `محتوى الملف لا يطابق نوعه المعلَن. الأنواع المسموح بها: ${config.allowedExtensions.join(', ')}`,
      );
    }
  }
}
