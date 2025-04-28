import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChromaClient, Collection, IEmbeddingFunction } from 'chromadb';
import * as pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';

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

  constructor(private readonly configService: ConfigService) {
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
    return await this.chromaClient.createCollection({
      name: collectionName,
      embeddingFunction: this.embeddingFunction,
    });
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
      const documents = docs.map((doc) => doc.pageContent);
      const metadatas = docs.map(() => ({ source: fileName }));

      await collection.add({
        ids,
        documents,
        metadatas,
      });

      return { success: true, message: 'PDF added to collection successfully' };
    } catch (error) {
      throw new Error(`Failed to add PDF to collection: ${error.message}`);
    }
  }

  async deleteCollection(collectionName: string) {
    try {
      await this.chromaClient.deleteCollection({ name: collectionName });
      return {
        success: true,
        message: `Collection '${collectionName}' deleted successfully`,
      };
    } catch (error) {
      throw new Error(`Failed to delete collection: ${error.message}`);
    }
  }
}
