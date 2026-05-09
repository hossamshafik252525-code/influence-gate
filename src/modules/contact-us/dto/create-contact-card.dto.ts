import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ContactType } from '../enums/contact-type.enum';
import { ContactPlatform } from '../enums/contact-platform.enum';

export class CreateContactCardDto {
  @IsNotEmpty({ message: 'نوع جهة التواصل مطلوب' })
  @IsEnum(ContactType, { message: 'نوع جهة التواصل غير صالح' })
  type: ContactType;

  @IsNotEmpty({ message: 'القيمة مطلوبة' })
  @IsString()
  value: string;

  @IsNotEmpty({ message: 'المنصة مطلوبة' })
  @IsEnum(ContactPlatform, { message: 'المنصة غير صالحة' })
  platform: ContactPlatform;
}
