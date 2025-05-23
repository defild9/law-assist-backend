import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackType, FeedbackTag } from 'src/schemas/feedback.schema';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'User ID who gives the feedback',
    type: String,
    format: 'uuid',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsOptional()
  @IsMongoId()
  user: string;

  @ApiProperty({
    description: 'Message ID to which the feedback applies',
    type: String,
    format: 'uuid',
    example: '60d0fe4f5311236168a109cb',
  })
  @IsMongoId()
  message: string;

  @ApiProperty({
    description: 'Type of feedback',
    enum: FeedbackType,
    example: FeedbackType.LIKE,
  })
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @ApiProperty({
    description: 'Tag categorizing the feedback',
    enum: FeedbackTag,
    example: FeedbackTag.HELPFUL,
  })
  @IsEnum(FeedbackTag)
  @IsOptional()
  tag: FeedbackTag;

  @ApiPropertyOptional({
    description: 'Optional comment elaborating the feedback',
    type: String,
    example: 'Great explanation, very clear!',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
