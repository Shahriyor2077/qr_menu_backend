import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @ApiProperty({ example: 'STARTUP' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxCategories: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxMenuItems: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxAdmins: number;

  @ApiPropertyOptional({ example: 29000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: 'Kichik biznes uchun' })
  @IsOptional()
  @IsString()
  description?: string;
}
