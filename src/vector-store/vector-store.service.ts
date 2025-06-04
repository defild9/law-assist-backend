import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChromaClient, Collection, IEmbeddingFunction } from 'chromadb';
import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VectorCollection,
  VectorCollectionDocument,
} from 'src/schemas/vector-collection.schema';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

class OpenAIEmbeddingFunction implements IEmbeddingFunction {
  private embeddings: OpenAIEmbeddings;

  constructor(apiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: 'text-embedding-ada-002',
    });
  }

  async generate(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
}

@Injectable()
export class VectorStoreService {
  private readonly chromaUrl: string;
  private readonly openAIApiKey: string;
  private readonly chromaClient: ChromaClient;
  private readonly embeddingFunction: OpenAIEmbeddingFunction;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(VectorCollection.name)
    private readonly vectorCollectionModel: Model<VectorCollectionDocument>,
  ) {
    this.chromaUrl =
      this.configService.get('CHROMA_DB_URL') || 'http://localhost:8000';
    this.openAIApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.chromaClient = new ChromaClient({ path: this.chromaUrl });
    this.embeddingFunction = new OpenAIEmbeddingFunction(this.openAIApiKey);
  }

  private createChromaVectorStore(collectionName: string): Chroma {
    return new Chroma(
      new OpenAIEmbeddings({
        openAIApiKey: this.openAIApiKey,
        modelName: 'text-embedding-ada-002',
      }),
      {
        url: this.chromaUrl,
        collectionName,
      },
    );
  }

  async similaritySearch(
    query: string,
    k = 3,
    collectionName = 'documents-test',
  ) {
    const vectorStore = this.createChromaVectorStore(collectionName);
    return await vectorStore.similaritySearch(query, k);
  }

  async createCollection(collectionName: string) {
    const chromaCol = await this.chromaClient.createCollection({
      name: collectionName,
      embeddingFunction: this.embeddingFunction,
    });

    await this.vectorCollectionModel.updateOne(
      { name: collectionName },
      { $setOnInsert: { name: collectionName, files: [] } },
      { upsert: true },
    );

    return chromaCol;
  }

  async getCollections() {
    return await this.chromaClient.listCollections();
  }

  async getCollectionByName(collectionName: string): Promise<Collection> {
    return await this.chromaClient.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: this.embeddingFunction,
    });
  }

  async addPdfToCollection(
    pdfBuffer: Buffer,
    fileName: string,
    collectionName = 'documents-test',
  ) {
    try {
      const data = await pdfParse(pdfBuffer);
      const text = data.text;
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const docs = await textSplitter.createDocuments([text]);

      const collection = await this.getCollectionByName(collectionName);
      const ids = docs.map(() => uuidv4());
      const nowIso = new Date().toISOString();
      const documents = docs.map((d) => d.pageContent);
      const metadatas = docs.map(() => ({
        source: fileName,
        addedAt: nowIso,
        updatedAt: nowIso,
      }));
      await collection.add({ ids, documents, metadatas });

      const now = new Date();
      const updResult = await this.vectorCollectionModel.updateOne(
        { name: collectionName, 'files.source': fileName },
        { $set: { 'files.$.lastUpdated': now } },
      );
      if (updResult.matchedCount === 0) {
        await this.vectorCollectionModel.updateOne(
          { name: collectionName },
          {
            $push: {
              files: {
                source: fileName,
                firstAdded: now,
                lastUpdated: now,
              },
            },
          },
        );
      }

      return { success: true, message: 'PDF added to collection successfully' };
    } catch (error) {
      throw new Error(`Failed to add PDF to collection: ${error.message}`);
    }
  }

  async deleteCollection(collectionName: string) {
    try {
      await this.chromaClient.deleteCollection({ name: collectionName });

      const deleteResult = await this.vectorCollectionModel.deleteOne({
        name: collectionName,
      });

      if (deleteResult.deletedCount === 0) {
        return {
          success: false,
          message: `Collection '${collectionName}' was removed from Chroma, but no corresponding Mongo document was found`,
        };
      }

      return {
        success: true,
        message: `Collection '${collectionName}' deleted successfully from Chroma and Mongo`,
      };
    } catch (error) {
      throw new Error(`Failed to delete collection: ${error.message}`);
    }
  }

  async listFilesInCollection(collectionName = 'documents-test') {
    const collection = await this.vectorCollectionModel
      .findOne({
        name: collectionName,
      })
      .exec();
    if (!collection) {
      return [];
    }
    return collection.files;
  }

  async getAllCollectionsWithFiles(
    searchQuery?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<VectorCollectionDocument>> {
    const filter: any = {};

    if (searchQuery) {
      const re = new RegExp(searchQuery, 'i');
      filter.$or = [{ name: re }, { 'files.source': re }];
    }

    // Вычисляем, сколько пропустить
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.vectorCollectionModel.find(filter).skip(skip).limit(limit).exec(),
      this.vectorCollectionModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async syncChromaWithMongo(): Promise<{
    created: number;
    updated: number;
    removed: number;
  }> {
    const listResp = await this.chromaClient.listCollections();
    const chromaNames = (listResp as any).collections
      ? ((listResp as any).collections as string[])
      : (listResp as string[]);

    const mongoDocs = await this.vectorCollectionModel.find().exec();
    const mongoNames = mongoDocs.map((doc) => doc.name);

    let created = 0;
    let updated = 0;
    let removed = 0;

    for (const name of chromaNames) {
      const rawFiles = await this.listFilesInCollection(name);
      const files = rawFiles.map((f) => ({
        source: f.source,
        firstAdded: !isNaN(Date.parse(f.firstAdded))
          ? new Date(f.firstAdded)
          : new Date(),
        lastUpdated: !isNaN(Date.parse(f.lastUpdated))
          ? new Date(f.lastUpdated)
          : new Date(),
      }));

      if (!mongoNames.includes(name)) {
        await this.vectorCollectionModel.create({ name, files });
        created++;
      } else {
        await this.vectorCollectionModel.updateOne(
          { name },
          { $set: { files } },
        );
        updated++;
      }
    }

    const toRemove = mongoNames.filter((n) => !chromaNames.includes(n));
    for (const name of toRemove) {
      await this.vectorCollectionModel.deleteOne({ name });
      removed++;
    }

    return { created, updated, removed };
  }

  async deleteFileFromCollection(
    collectionName: string,
    fileName: string,
  ): Promise<{ success: boolean; message: string }> {
    const collection = await this.getCollectionByName(collectionName);

    await collection.delete({ where: { source: fileName } });

    const updateResult = await this.vectorCollectionModel.updateOne(
      { name: collectionName },
      { $pull: { files: { source: fileName } } },
    );

    if (updateResult.modifiedCount === 0) {
      return {
        success: false,
        message: `File '${fileName}' not found in Mongo for collection '${collectionName}', but removed from Chroma.`,
      };
    }

    return {
      success: true,
      message: `File '${fileName}' removed from Chroma and Mongo.`,
    };
  }
}
