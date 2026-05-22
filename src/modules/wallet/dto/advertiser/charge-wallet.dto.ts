import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  MaxLength,
} from 'class-validator';

export class ChargeWalletDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(999999999.99)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  invoiceImageUrl: string;

  @IsString()
  @IsNotEmpty()
  invoiceImagePublicId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
