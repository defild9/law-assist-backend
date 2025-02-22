import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class VectorStoreService {
  private vectorStore: Chroma;

  constructor(private readonly configService: ConfigService) {
    this.initializeVectorStore();
  }

  private initializeVectorStore() {
    this.vectorStore = new Chroma(
      new OpenAIEmbeddings({
        openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      }),
      {
        url:
          this.configService.get<string>('CHROMA_DB_URL') ||
          'http://localhost:8000',
        collectionName: 'documents-test',
      },
    );
  }

  async similaritySearch(query: string, k: number = 3) {
    return await this.vectorStore.similaritySearch(query, k);
  }
}
