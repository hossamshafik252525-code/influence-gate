import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactType } from '../enums/contact-type.enum';
import { ContactPlatform } from '../enums/contact-platform.enum';

export class UpdateContactCardDto {
  @IsOptional()
  @IsEnum(ContactType, { message: 'نوع جهة التواصل غير صالح' })
  type?: ContactType;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsEnum(ContactPlatform, { message: 'المنصة غير صالحة' })
  platform?: ContactPlatform;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
