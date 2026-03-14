import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContentType, TargetPlatform, ExpectedBudget } from '../../../../common/enums';

export class ConfirmAdvertiserProfileDto {
  @IsNotEmpty({ message: 'اسم الشركة مطلوب' })
  @IsString()
  companyName: string;

  @IsNotEmpty({ message: 'نوع النشاط مطلوب' })
  @IsString()
  typeOfActivity: string;

  @IsNotEmpty({ message: 'المدينة مطلوبة' })
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ContentType, { each: true })
  contentTypes?: ContentType[];

  @IsOptional()
  @IsArray()
  @IsEnum(TargetPlatform, { each: true })
  targetPlatforms?: TargetPlatform[];

  @IsOptional()
  @IsEnum(ExpectedBudget)
  expectedBudget?: ExpectedBudget;
}
