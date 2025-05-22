import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LegalTemplate,
  LegalTemplateSchema,
} from 'src/schemas/legal-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LegalTemplate.name, schema: LegalTemplateSchema },
    ]),
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
