import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import { ApplicationStatus, CampaignStatus, SubmissionStatus } from '../enums';
import { ReviewSubmissionDto } from '../dto/review-submission.dto';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';

@Injectable()
export class CampaignSubmissionReviewService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepo: Repository<CampaignSubmission>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reviewSubmission(
    advertiserId: string,
    submissionId: string,
    dto: ReviewSubmissionDto,
    files: Express.Multer.File[],
  ): Promise<void> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['campaign'],
    });

    if (!submission) {
      throw new NotFoundException('المحتوى غير موجود');
    }

    if (submission.campaign.advertiserId !== advertiserId) {
      throw new ForbiddenException('لا يمكنك مراجعة هذا المحتوى');
    }

    if (submission.campaign.status !== CampaignStatus.IMPLEMENTATION) {
      throw new BadRequestException('الحملة ليست في مرحلة التنفيذ');
    }

    if (
      dto.status === SubmissionStatus.MODIFICATION_REQUESTED &&
      !dto.modificationDetails?.trim()
    ) {
      throw new BadRequestException('يجب إدخال تفاصيل التعديل');
    }

    if (submission.modificationFilePublicIds?.length) {
      await Promise.all(
        submission.modificationFilePublicIds.map((id) =>
          this.cloudinaryService.deleteFile(id),
        ),
      );
    }

    const uploadedFiles = await Promise.all(
      files.map((f) => this.cloudinaryService.uploadFile(f, 'submission_reviews')),
    );

    const modificationFileUrls = uploadedFiles.length
      ? uploadedFiles.map((r) => r.secure_url)
      : null;
    const modificationFilePublicIds = uploadedFiles.length
      ? uploadedFiles.map((r) => r.public_id)
      : null;

    await this.submissionRepo.update(submissionId, {
      status: dto.status,
      modificationDetails: dto.modificationDetails ?? null,
      modificationFileUrls,
      modificationFilePublicIds,
    });

    const notificationType =
      dto.status === SubmissionStatus.ACCEPTED
        ? NotificationType.SUBMISSION_ACCEPTED
        : NotificationType.SUBMISSION_MODIFICATION_REQUESTED;

    const title =
      dto.status === SubmissionStatus.ACCEPTED
        ? 'تم قبول المحتوى'
        : 'طلب تعديل على المحتوى';

    const body =
      dto.status === SubmissionStatus.ACCEPTED
        ? `تم قبول المحتوى الذي قدمته لحملة ${submission.campaign.name}`
        : `طُلب منك تعديل المحتوى لحملة ${submission.campaign.name}`;

    await this.notificationsService.notify(
      submission.influencerId,
      title,
      body,
      notificationType,
      { submissionId, campaignId: submission.campaignId },
    );

    if (dto.status === SubmissionStatus.ACCEPTED) {
      await this.checkAndCompleteCampaign(submission.campaignId);
    }
  }

  private async checkAndCompleteCampaign(campaignId: string): Promise<void> {
    const [acceptedApplications, acceptedSubmissions] = await Promise.all([
      this.applicationRepo.count({
        where: { campaignId, status: ApplicationStatus.ACCEPTED },
      }),
      this.submissionRepo.count({
        where: { campaignId, status: SubmissionStatus.ACCEPTED },
      }),
    ]);

    if (acceptedSubmissions >= acceptedApplications && acceptedApplications > 0) {
      await this.campaignRepo.update(campaignId, {
        status: CampaignStatus.COMPLETED,
      });
    }
  }
}
