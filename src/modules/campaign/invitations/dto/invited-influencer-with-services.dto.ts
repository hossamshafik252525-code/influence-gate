import { IsNotEmpty, IsUUID, IsOptional, IsArray } from 'class-validator';

export class InvitedInfluencerWithServicesDto {
  @IsNotEmpty({ message: 'معرف المؤثر مطلوب' })
  @IsUUID('4', { message: 'معرف المؤثر غير صالح' })
  influencerId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds?: string[];
}
