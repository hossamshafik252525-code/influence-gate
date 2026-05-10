import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OfferReviewDecision } from '../enums/offer-review-decision.enum';

export class ReviewOfferDto {
  @IsEnum(OfferReviewDecision, { message: 'قرار المراجعة غير صالح' })
  decision: OfferReviewDecision;

  @IsOptional()
  @IsString({ message: 'سبب الرفض غير صالح' })
  @MaxLength(500, { message: 'سبب الرفض طويل جداً' })
  rejectionReason?: string;
}
