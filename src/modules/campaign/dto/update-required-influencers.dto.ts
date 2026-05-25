import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateRequiredInfluencersDto {
  @IsNotEmpty({ message: 'عدد المؤثرين المطلوب مطلوب' })
  @IsInt({ message: 'عدد المؤثرين يجب أن يكون عدداً صحيحاً' })
  @Min(1, { message: 'عدد المؤثرين يجب أن يكون أكبر من صفر' })
  requiredInfluencersCount: number;
}
