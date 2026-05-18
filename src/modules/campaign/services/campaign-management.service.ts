import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignStatus, CampaignVisibility, PendingMinimumAction } from '../enums';
import { ApplicationStatus } from '../applications/enums';
import { InvitationStatus } from '../invitations/enums';
import { ResolvePendingMinimumDto } from '../dto';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { InvitationsManagementService } from '../invitations/services/invitations-management.service';
import { CampaignQueryService } from './campaign-query.service';
import { WalletTransactionService } from '../../wallet/services/wallet-transaction.service';
import { TransactionStatus } from '../../wallet/enums';
import { CampaignSubmission } from '../submissions/entities/campaign-submission.entity';
import { SubmissionStatus } from '../submissions/enums';

@Injectable()
export class CampaignManagementService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepository: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepository: Repository<CampaignSubmission>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly invitationsManagementService: InvitationsManagementService,
    private readonly walletTransactionService: WalletTransactionService,
    private readonly campaignQueryService: CampaignQueryService,
  ) {}

  async deleteDraft(campaignId: string, advertiserId: string): Promise<void> {
    const campaign = await this.campaignQueryService.findDraftOrFail(campaignId, advertiserId);

    if (campaign.contentPdfPublicId) {
      await this.cloudinaryService.deleteFile(campaign.contentPdfPublicId);
    }

    await this.invitationsManagementService.deleteInvitationsByCampaign(campaign.id);
    await this.campaignRepository.remove(campaign);
  }

  async resolvePendingMinimum(
    campaignId: string,
    advertiserId: string,
    dto: ResolvePendingMinimumDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: {
        id: campaignId,
        advertiserId,
        status: CampaignStatus.PENDING_MINIMUM,
      },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة أو ليست في حالة انتظار');
    }

    switch (dto.action) {
      case PendingMinimumAction.EXTEND_7_DAYS: {
        const newDeadline = new Date(campaign.deadlineDate);
        newDeadline.setDate(newDeadline.getDate() + 7);

        await this.campaignRepository.update(campaign.id, {
          deadlineDate: newDeadline,
          status: CampaignStatus.APPROVED,
          pendingMinimumDeadline: null,
        });
        break;
      }

      case PendingMinimumAction.LAUNCH_ANYWAY: {
        const acceptedCount = await this.applicationRepository.count({
          where: { campaignId: campaign.id, status: ApplicationStatus.ACCEPTED },
        });

        if (acceptedCount === 0) {
          throw new BadRequestException('لا يمكن إطلاق الحملة بدون مؤثر مقبول واحد على الأقل');
        }

        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.IMPLEMENTATION,
          implementationStartDate: new Date(),
          implementationEndDate: this.calculateEndDate(campaign.implementationPeriodDays),
          pendingMinimumDeadline: null,
        });
        break;
      }

      case PendingMinimumAction.DISCARD: {
        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.DISCARDED,
          pendingMinimumDeadline: null,
        });
        break;
      }
    }

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  private calculateEndDate(periodDays: number): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + periodDays);
    return endDate;
  }

  private async getAcceptedPublicInfluencerIds(campaignId: string): Promise<string[]> {
    const applications = await this.applicationRepository.find({
      where: { campaignId, status: ApplicationStatus.ACCEPTED },
    });
    return applications.map((a) => a.influencerId);
  }

  private async getAcceptedPrivateInfluencerIds(campaignId: string): Promise<string[]> {
    const invitations = await this.invitationRepository.find({
      where: { campaignId, status: InvitationStatus.ACCEPTED },
    });
    return invitations.map((i) => i.influencerId);
  }

  private async getPrivateInfluencerPrice(
    campaignId: string,
    influencerId: string,
  ): Promise<number> {
    const invitation = await this.invitationRepository.findOne({
      where: { campaignId, influencerId, status: InvitationStatus.ACCEPTED },
    });

    if (!invitation) return 0;

    return Number(invitation.priceWithFee);
  }

  private async getAcceptedPublicInfluencerPrice(
    campaignId: string,
    influencerId: string,
  ): Promise<number> {
    const application = await this.applicationRepository.findOne({
      where: { campaignId, influencerId, status: ApplicationStatus.ACCEPTED },
    });
    return application ? Number(application.priceWithFee) : 0;
  }

  async generateCancelledTransactionsForUnacceptedInfluencers(
    campaign: Campaign,
  ): Promise<void> {
    const influencerIds =
      campaign.campaignVisibility === CampaignVisibility.PUBLIC
        ? await this.getAcceptedPublicInfluencerIds(campaign.id)
        : await this.getAcceptedPrivateInfluencerIds(campaign.id);

    if (!influencerIds.length) return;

    const acceptedSubmissions = await this.submissionRepository.find({
      where: { campaignId: campaign.id, status: SubmissionStatus.ACCEPTED },
    });

    const acceptedInfluencerSet = new Set(acceptedSubmissions.map((s) => s.influencerId));

    for (const influencerId of influencerIds) {
      if (!acceptedInfluencerSet.has(influencerId)) {
        const amount =
          campaign.campaignVisibility === CampaignVisibility.PUBLIC
            ? await this.getAcceptedPublicInfluencerPrice(campaign.id, influencerId)
            : await this.getPrivateInfluencerPrice(campaign.id, influencerId);

        await this.walletTransactionService.createRevenueTransaction({
          influencerId,
          amount,
          campaignId: campaign.id,
          campaignName: campaign.name,
          includedPlatforms: campaign.includedPlatforms,
          status: TransactionStatus.CANCELLED,
        });
      }
    }
  }
}
