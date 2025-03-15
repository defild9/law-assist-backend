import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { VectorStoreService } from 'src/vector-store/vector-store.service';
import { MessageService } from 'src/message/message.service';
import { Types } from 'mongoose';

@Injectable()
export class LlmService {
  private chatModel: ChatOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly messageService: MessageService,
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
  async *generateStream(chatId: Types.ObjectId, prompt: string) {
    const conversationMessages = await this.messageService.getMessagesByChat(
      chatId.toString(),
    );
    const conversationContext = conversationMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Search for relevant documents using VectorStoreService
    const vectorResults = await this.vectorStoreService.similaritySearch(
      prompt,
      3,
    );
    const vectorContext = vectorResults
      .map((doc) => doc.pageContent)
      .join('\n\n');

    // Forming an extended query with the found context
    const augmentedPrompt = `
      Conversation context: ${conversationContext}
    
      Doucment context: ${vectorContext}
      
      Question: ${prompt}
      
      Answer: `;

    const messages = [new HumanMessage(augmentedPrompt)];
    const stream = await this.chatModel.stream(messages);

    for await (const chunk of stream) {
      yield chunk.content;
    }
  }
}
