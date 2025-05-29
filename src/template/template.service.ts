import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreateTemplateDto } from './dto/create-template.dto';
import { LegalTemplate } from 'src/schemas/legal-template.schema';
import { UpdateTemplateDto } from './dto/update-template.dto';
import * as mammoth from 'mammoth';
import TurndownService from 'turndown';
import { tables } from 'turndown-plugin-gfm';
import pdfParse from 'pdf-parse';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(LegalTemplate.name)
    private readonly templateModel: Model<LegalTemplate>,
  ) {}

  async create(dto: CreateTemplateDto): Promise<LegalTemplate> {
    try {
      const created = new this.templateModel(dto);
      return await created.save();
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException('Template with this title already exists');
      }
      throw new BadRequestException('Failed to create template');
    }
  }

  async getTemplates(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const filter = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.templateModel.find(filter).skip(skip).limit(limit).exec(),
      this.templateModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTemplateById(id: string): Promise<LegalTemplate> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid template ID');
    }

    const template = await this.templateModel.findById(id).exec();

    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }

    return template;
  }

  async getTemplateByTitle(title: string): Promise<LegalTemplate> {
    const template = await this.templateModel.findOne({ title }).exec();
    if (!template) {
      throw new NotFoundException(`Template with title "${title}" not found`);
    }
    return template;
  }

  async updateTemplate(id: string, updateDto: UpdateTemplateDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid template ID');
    }

    try {
      const updated = await this.templateModel
        .findByIdAndUpdate(id, updateDto, { new: true })
        .exec();

      if (!updated) {
        throw new NotFoundException(`Template with ID "${id}" not found`);
      }

      return updated;
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException('Template with this title already exists');
      }
      throw new BadRequestException('Failed to update template');
    }
  }

  async deleteTemplate(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid template ID');
    }

    const deleted = await this.templateModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }

    return deleted;
  }

  async convertDocumentToMarkdown(buffer: Buffer): Promise<string> {
    try {
      let markdown: string;

      const isPdf = buffer.slice(0, 4).toString() === '%PDF';

      if (isPdf) {
        const data = await pdfParse(buffer);
        markdown = data.text;
      } else {
        const { value: html } = await mammoth.convertToHtml({ buffer });
        const turndownService = new TurndownService();
        turndownService.use([tables]);
        markdown = turndownService.turndown(html);
      }

      return markdown;
    } catch (error) {
      console.error('Conversion failed:', error);
      throw new InternalServerErrorException('Conversion failed');
    }
  }
}
