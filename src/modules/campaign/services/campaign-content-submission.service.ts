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
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import {
  CampaignStatus,
  ApplicationStatus,
  SubmissionStatus,
  CampaignVisibility,
  InvitationStatus,
} from '../enums';
import { SubmitContentDto } from '../dto/submit-content.dto';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';

@Injectable()
export class CampaignContentSubmissionService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepo: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepo: Repository<CampaignSubmission>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submitContent(
    influencerId: string,
    campaignId: string,
    dto: SubmitContentDto,
    files: Express.Multer.File[],
  ): Promise<CampaignSubmission> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (campaign.status !== CampaignStatus.IMPLEMENTATION) {
      throw new BadRequestException('الحملة ليست في مرحلة التنفيذ');
    }

    const isParticipant = await this.isParticipant(campaign, influencerId);
    if (!isParticipant) {
      throw new ForbiddenException('لا يمكنك تقديم محتوى لهذه الحملة');
    }

    const existing = await this.submissionRepo.findOne({
      where: { campaignId, influencerId },
    });

    if (existing?.filePublicIds?.length) {
      await Promise.all(
        existing.filePublicIds.map((id) => this.cloudinaryService.deleteFile(id)),
      );
    }

    const uploadedFiles = await Promise.all(
      files.map((f) => this.cloudinaryService.uploadFile(f, 'submissions')),
    );

    const fileUrls = uploadedFiles.map((r) => r.secure_url);
    const filePublicIds = uploadedFiles.map((r) => r.public_id);

    let submission: CampaignSubmission;

    if (existing) {
      await this.submissionRepo.update(existing.id, {
        links: dto.links,
        fileUrls: fileUrls.length ? fileUrls : null,
        filePublicIds: filePublicIds.length ? filePublicIds : null,
        status: SubmissionStatus.PENDING_REVIEW,
        modificationDetails: null,
        modificationFileUrls: null,
        modificationFilePublicIds: null,
      });
      submission = await this.submissionRepo.findOne({ where: { id: existing.id } });
    } else {
      submission = await this.submissionRepo.save(
        this.submissionRepo.create({
          campaignId,
          influencerId,
          links: dto.links,
          fileUrls: fileUrls.length ? fileUrls : null,
          filePublicIds: filePublicIds.length ? filePublicIds : null,
        }),
      );
    }

    await this.notificationsService.notify(
      campaign.advertiserId,
      'محتوى جديد للمراجعة',
      `قدّم مؤثر محتوى جديداً لحملة ${campaign.name}`,
      NotificationType.NEW_CONTENT_SUBMISSION,
      { campaignId, submissionId: submission.id },
    );

    return submission;
  }

  private async isParticipant(
    campaign: Campaign,
    influencerId: string,
  ): Promise<boolean> {
    if (campaign.campaignVisibility === CampaignVisibility.PRIVATE) {
      const invitation = await this.invitationRepo.findOne({
        where: {
          campaignId: campaign.id,
          influencerId,
          status: InvitationStatus.ACCEPTED,
        },
      });
      return !!invitation;
    }

    const application = await this.applicationRepo.findOne({
      where: {
        campaignId: campaign.id,
        influencerId,
        status: ApplicationStatus.ACCEPTED,
      },
    });
    return !!application;
  }
}
