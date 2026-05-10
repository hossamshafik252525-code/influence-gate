import { IsNotEmpty, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class InvitedInfluencerWithServicesDto {
  @IsNotEmpty({ message: 'معرف المؤثر مطلوب' })
  @IsUUID('4', { message: 'معرف المؤثر غير صالح' })
  influencerId: string;

  @IsArray({ message: 'قائمة الخدمات يجب أن تكون مصفوفة' })
  @ArrayMinSize(1, { message: 'يجب اختيار خدمة واحدة على الأقل لكل مؤثر' })
  @IsUUID('4', { each: true, message: 'معرف الخدمة غير صالح' })
  serviceIds: string[];
}
