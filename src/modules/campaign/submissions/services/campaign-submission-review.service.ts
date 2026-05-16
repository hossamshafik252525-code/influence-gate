import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../../entities/campaign.entity';
import { CampaignApplication } from '../../applications/entities/campaign-application.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import { CampaignInvitedInfluencer } from '../../invitations/entities/campaign-invited-influencer.entity';
import { CampaignStatus, CampaignVisibility } from '../../enums';
import { ApplicationStatus } from '../../applications/enums';
import { SubmissionStatus } from '../enums';
import { ReviewSubmissionDto } from '../dto/review-submission.dto';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { NotificationType } from '../../../notifications/enums';
import { WalletTransactionService } from '../../../wallet/services/wallet-transaction.service';
import { TransactionStatus } from '../../../wallet/enums';

@Injectable()
export class CampaignSubmissionReviewService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepo: Repository<CampaignSubmission>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitedInfluencerRepo: Repository<CampaignInvitedInfluencer>,
    private readonly notificationsService: NotificationsService,
    private readonly walletTransactionService: WalletTransactionService,
  ) {}

  async reviewSubmission(
    advertiserId: string,
    submissionId: string,
    dto: ReviewSubmissionDto,
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

    const modificationFileUrls = dto.modificationFileUrls?.length
      ? dto.modificationFileUrls
      : null;
    const modificationFilePublicIds = dto.modificationFilePublicIds?.length
      ? dto.modificationFilePublicIds
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
      await this.generateRevenueTransaction(submission);
      await this.checkAndCompleteCampaign(submission.campaignId);
    }
  }

  private async generateRevenueTransaction(
    submission: CampaignSubmission & { campaign: Campaign },
  ): Promise<void> {
    const campaign = submission.campaign;
    let amount: number;

    if (campaign.campaignVisibility === CampaignVisibility.PUBLIC) {
      amount = Number(campaign.influencerPrice);
    } else {
      const invitation = await this.invitedInfluencerRepo.findOne({
        where: { campaignId: campaign.id, influencerId: submission.influencerId },
      });
      amount = invitation ? Number(invitation.priceWithFee) : 0;
    }

    await this.walletTransactionService.createRevenueTransaction({
      influencerId: submission.influencerId,
      amount,
      campaignId: campaign.id,
      campaignName: campaign.name,
      includedPlatforms: campaign.includedPlatforms,
      status: TransactionStatus.PENDING_REVIEW,
    });
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
