import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  isAIMessageChunk,
  MessageContentComplex,
} from '@langchain/core/messages';
import { VectorStoreService } from 'src/vector-store/vector-store.service';
import { MessageService } from 'src/message/message.service';
import { Model, Types } from 'mongoose';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import { TemplateGeneratorTool } from './tools/TemplateGenerator.tool';
import { LegalTemplate } from 'src/schemas/legal-template.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class LlmService {
  private chatModel: ChatOpenAI;
  private agent: ReturnType<typeof createReactAgent>;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly messageService: MessageService,
    @InjectModel(LegalTemplate.name)
    private readonly templateModel: Model<LegalTemplate>,
  ) {
    this.initializeChatModel();
    this.initializeAngent();
  }

  private initializeChatModel() {
    this.chatModel = new ChatOpenAI({
      model: 'gpt-4o',
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      temperature: 0,
      streaming: true,
    });
  }

  private initializeAngent() {
    const memorySaver = new MemorySaver();

    this.agent = createReactAgent({
      llm: this.chatModel,
      tools: [new TemplateGeneratorTool(this.templateModel)],
      checkpointSaver: memorySaver,
    });
  }
  async *generateStream(
    chatId: Types.ObjectId,
    prompt: string,
    collectionName = 'documents-test',
  ) {
    const conversationMessages = await this.messageService.getMessagesByChat(
      chatId.toString(),
    );
    const conversationContext = conversationMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Search for relevant documents using VectorStoreService
    const vectorResults = await this.vectorStoreService.similaritySearch(
      prompt,
      8,
      collectionName,
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

    const streamIter = await this.agent.stream(
      { messages: [new HumanMessage(augmentedPrompt)] },
      {
        streamMode: 'messages',
        configurable: { thread_id: chatId.toString() },
      },
    );

    for await (const [msg] of streamIter) {
      if (!isAIMessageChunk(msg)) continue;
      if (typeof msg.content === 'string') {
        yield msg.content;
      } else {
        for (const chunk of msg.content as MessageContentComplex[]) {
          if (chunk.type === 'text') {
            yield chunk.text;
          }
        }
      }
    }
  }
}
