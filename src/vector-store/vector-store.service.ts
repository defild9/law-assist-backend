import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChromaClient, IEmbeddingFunction } from 'chromadb';
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
  private vectorStore: Chroma;
  private chromaClient: ChromaClient;
  private embeddingFunction: OpenAIEmbeddingFunction;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    const chromaUrl =
      this.configService.get('CHROMA_DB_URL') || 'http://localhost:8000';
    const openAIApiKey = this.configService.get('OPENAI_API_KEY');

    this.vectorStore = new Chroma(
      new OpenAIEmbeddings({
        openAIApiKey,
        modelName: 'text-embedding-ada-002',
      }),
      {
        url: chromaUrl,
        collectionName: 'documents-test',
      },
    );

    this.chromaClient = new ChromaClient({ path: chromaUrl });
    this.embeddingFunction = new OpenAIEmbeddingFunction(openAIApiKey);
  }

  async similaritySearch(query: string, k: number = 3) {
    return await this.vectorStore.similaritySearch(query, k);
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

  async getCollectionByName(collectionName: string) {
    return await this.chromaClient.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: this.embeddingFunction,
    });
  }

  async addPdfToCollection(
    pdfBuffer: Buffer,
    collectionName: string,
    fileName: string,
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
