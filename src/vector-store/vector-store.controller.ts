import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { VectorStoreService } from './vector-store.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPdfDto } from './dto/upload-pdf.dto';

@ApiTags('bot-vector-store')
@Controller('bot-vector-store')
export class VectorStoreController {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all collections' })
  @ApiResponse({
    status: 200,
    description: 'Collections fetched successfully.',
  })
  async getCollections() {
    return this.vectorStoreService.getCollections();
  }

  @Get(':collectionName')
  @ApiOperation({ summary: 'Retrieve a collection by name' })
  @ApiParam({
    name: 'collectionName',
    required: true,
    description: 'The name of the collection to retrieve',
    example: 'bot-data',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection fetched successfully.',
  })
  async getCollectionByName(@Param('collectionName') collectionName: string) {
    return this.vectorStoreService.getCollectionByName(collectionName);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({
    status: 201,
    description: 'Collection created successfully.',
  })
  async createCollection(@Body() createCollectionDto: CreateCollectionDto) {
    return this.vectorStoreService.createCollection(
      createCollectionDto.collectionName,
    );
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a PDF file to the collection' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Form for uploading a PDF file and specifying the collection name',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to be uploaded',
        },
        collectionName: {
          type: 'string',
          description: 'Name of the collection to which the file will be added',
          example: 'bot-data',
        },
      },
      required: ['file', 'collectionName'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'PDF successfully uploaded and added to the collection.',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadPdfDto: UploadPdfDto,
  ) {
    return this.vectorStoreService.addPdfToCollection(
      file.buffer,
      uploadPdfDto.collectionName,
      file.originalname,
    );
  }

  @Delete(':collectionName')
  @ApiOperation({ summary: 'Delete a collection by name' })
  @ApiParam({
    name: 'collectionName',
    required: true,
    description: 'The name of the collection to delete',
    example: 'legal-documents',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection deleted successfully',
    schema: {
      example: {
        success: true,
        message: "Collection 'legal-documents' deleted successfully",
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
    schema: {
      example: {
        success: false,
        message: 'Failed to delete collection: Collection not found',
      },
    },
  })
  async deleteCollection(@Param('collectionName') collectionName: string) {
    return this.vectorStoreService.deleteCollection(collectionName);
  }
}
