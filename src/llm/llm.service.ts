import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  isAIMessageChunk,
  MessageContentComplex,
  SystemMessage,
} from '@langchain/core/messages';
import { VectorStoreService } from 'src/vector-store/vector-store.service';
import { MessageService } from 'src/message/message.service';
import { Model, Types } from 'mongoose';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import { TemplateGeneratorTool } from './tools/TemplateGenerator.tool';
import { LegalTemplate } from 'src/schemas/legal-template.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilePartItem } from 'src/schemas/message.schema';

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
    files?: FilePartItem[],
    botPromt?: string,
  ) {
    const defaultBotPrompt = `
Ви — досвідчений юридичний консультант із глибокими знаннями українського права. Ваше завдання — давати чіткі, вичерпні й обґрунтовані відповіді на запитання користувача. У відповіді:
1. Посилайтеся на відповідні статті законів або нормативні акти (де це доречно).
2. Використовуйте просту мову, але зберігайте юридичну точність.
3. Якщо питання стосується оформлення документів (договір, позовна заява, довіреність тощо), наведіть приклад структури та ключові пункти.
4. Уникайте розлогих виправдань — концентруйтеся на суті, але за потреби давайте короткі пояснення.
5. Якщо інформації недостатньо для однозначної відповіді, зазначайте, що потрібні додаткові дані (наприклад, юрисдикція, дати, конкретні обставини).

Після отримання запиту генеруйте відповідь, виходячи з наведених вище правил.
  `.trim();

    const effectiveBotPrompt =
      botPromt && botPromt.trim() !== '' ? botPromt : defaultBotPrompt;
    const conversationMessages = await this.messageService.getMessagesByChat(
      chatId.toString(),
    );
    const conversationContext = conversationMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const messages: any[] = [];
    messages.push(new SystemMessage({ content: effectiveBotPrompt }));

    if (files && files.length > 0) {
      messages.push(
        new HumanMessage({
          content: files,
        }),
      );

      messages.push(
        new HumanMessage({
          content: `
            Conversation context: ${conversationContext}
  
            Question: ${prompt}
  
            Answer: `,
        }),
      );
    } else {
      const vectorResults = await this.vectorStoreService.similaritySearch(
        prompt,
        8,
        collectionName,
      );

      const vectorContext = vectorResults
        .map((doc) => doc.pageContent)
        .join('\n\n');

      const augmentedPrompt = `
        Conversation context: ${conversationContext}
  
        Document context: ${vectorContext}
  
        Question: ${prompt}
  
        Answer: `;

      messages.push(new HumanMessage({ content: augmentedPrompt }));
    }

    const streamIter = await this.agent.stream(
      { messages },
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
