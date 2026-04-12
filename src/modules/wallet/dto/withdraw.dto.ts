import { IsNumber, IsPositive, Max } from 'class-validator';

export class WithdrawDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(999999999.99)
  amount: number;
}
