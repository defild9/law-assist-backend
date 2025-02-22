import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { VectorStoreService } from 'src/vector-store/vector-store.service';

@Injectable()
export class LlmService {
  private chatModel: ChatOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStoreService: VectorStoreService,
  ) {
    this.initializeChatModel();
  }

  private initializeChatModel() {
    this.chatModel = new ChatOpenAI({
      model: 'gpt-4o',
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      temperature: 0,
      streaming: true,
    });
  }
  async *generateStream(prompt: string) {
    // Search for relevant documents using VectorStoreService
    const results = await this.vectorStoreService.similaritySearch(prompt, 3);
    const context = results.map((doc) => doc.pageContent).join('\n\n');

    // Forming an extended query with the found context
    const augmentedPrompt = `Context:
${context}

Question: ${prompt}

Answer: `;

    const messages = [new HumanMessage(augmentedPrompt)];
    const stream = await this.chatModel.stream(messages);

    for await (const chunk of stream) {
      yield chunk.content;
    }
  }
}
