import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConvertFileDto } from './dto/convert-file.dto';

@ApiTags('Templates')
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create a new template' })
  @ApiCreatedResponse({ description: 'Template created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Duplicate template title' })
  @ApiBody({ type: CreateTemplateDto })
  async create(@Body() dto: CreateTemplateDto) {
    try {
      const created = await this.templateService.create(dto);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Template created successfully',
        data: created,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to create template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiOkResponse({ description: 'Templates fetched successfully' })
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.templateService.getTemplates(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiOkResponse({ description: 'Template found' })
  @ApiNotFoundResponse({ description: 'Template not found' })
  async getById(@Param('id') id: string) {
    try {
      const template = await this.templateService.getTemplateById(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Template found',
        data: template,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('title/:title')
  @ApiOperation({ summary: 'Get template by title' })
  @ApiParam({ name: 'title', description: 'Template title' })
  async getByTitle(@Param('title') title: string) {
    try {
      const template = await this.templateService.getTemplateByTitle(title);
      return {
        statusCode: HttpStatus.OK,
        message: 'Template found',
        data: template,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Update template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiBody({ type: UpdateTemplateDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    try {
      const updated = await this.templateService.updateTemplate(id, dto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Template updated successfully',
        data: updated,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to update template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async delete(@Param('id') id: string) {
    try {
      await this.templateService.deleteTemplate(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to delete template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('convert')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/pdf',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only .docx and .pdf files are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Convert DOCX or PDF file to Markdown' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ConvertFileDto })
  @ApiResponse({ status: 201, description: 'File converted successfully' })
  @ApiBadRequestResponse({
    description: 'No file provided or invalid file type',
  })
  async convertToMarkdown(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const markdown = await this.templateService.convertDocumentToMarkdown(
        file.buffer,
      );
      return {
        statusCode: HttpStatus.CREATED,
        message: 'File converted successfully',
        data: markdown,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to convert document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
