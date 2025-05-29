import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
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
  ApiQuery,
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
    const collection = await this.vectorStoreService.getCollections();

    return { status: 'success', collection };
  }

  @Get('collections-with-files')
  @ApiOperation({ summary: 'Retrieve paginated collections with files' })
  @ApiQuery({
    name: 'searchQuery',
    required: false,
    description: 'Filter by collection name or file source',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default 1)',
    schema: { default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default 10)',
    schema: { default: 10 },
  })
  async getCollectionsWithFiles(
    @Query('search') searchQuery?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const result = await this.vectorStoreService.getAllCollectionsWithFiles(
      searchQuery,
      page,
      limit,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `Collections fetched (page ${page})`,
      ...result,
    };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize Chroma collections with Mongo' })
  @ApiResponse({
    status: 200,
    description: 'Sync completed successfully.',
  })
  async syncCollections() {
    const result = await this.vectorStoreService.syncChromaWithMongo();
    return { status: 'success', result };
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

  @ApiOperation({ summary: 'Delete a specific file from a collection' })
  @Delete(':collectionName/files/:fileName')
  async deleteFile(
    @Param('collectionName') collectionName: string,
    @Param('fileName') fileName: string,
  ) {
    return this.vectorStoreService.deleteFileFromCollection(
      collectionName,
      fileName,
    );
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
      file.originalname,
      uploadPdfDto.collectionName,
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

  @Get(':name/files')
  async getFiles(@Param('name') name: string) {
    const files = await this.vectorStoreService.listFilesInCollection(name);
    return { status: 'success', files };
  }
}
