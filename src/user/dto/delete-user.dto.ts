import { IsMongoId, IsOptional } from 'class-validator';

export class DeleteUserDto {
  @IsOptional()
  @IsMongoId()
  userId: string;
}
