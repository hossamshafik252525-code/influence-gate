import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsNotEmpty({ message: 'العنوان مطلوب' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @IsNotEmpty({ message: 'الوصف مطلوب' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;
}
