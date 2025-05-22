import { Tool } from '@langchain/core/tools';
import { Model } from 'mongoose';
import { LegalTemplate } from 'src/schemas/legal-template.schema';

export interface TemplateInput {
  title: string;
  data?: Record<string, string>;
}

export class TemplateGeneratorTool extends Tool {
  name = 'template_generator';
  description =
    'Генерує документ за назвою шаблону з MongoDB та мапи даних. ' +
    'Вхід — JSON: { title: string, data?: Record<string,string> }';

  constructor(private readonly templateModel: Model<LegalTemplate>) {
    super();
  }

  async _call(input: string): Promise<string> {
    let parsed: TemplateInput;
    try {
      parsed = JSON.parse(input);
    } catch {
      return 'Вхід має бути валідним JSON: { "title": string, "data"?: { ... } }';
    }

    // debug
    // console.log('TemplateGeneratorTool input:', input);
    // console.log('Parsed input:', parsed);

    const { title, data = {} } = parsed;

    // Trying to find the template in MongoDB by its title
    const tmpl = await this.templateModel.findOne({ title }).lean();

    // console.log('Fetched template from DB:', tmpl);

    if (!tmpl) {
      return `Шаблон '${title}' не знайдено. Доступні: ${await this.templateModel
        .distinct('title')
        .then((list) => list.join(', '))}`;
    }

    // Extracting all placeholders like {field} from the template content
    const placeholders = Array.from(
      new Set(Array.from(tmpl.content.matchAll(/\{(\w+)\}/g), (m) => m[1])),
    );

    // Checking which placeholders are not provided in input data
    const missing = placeholders.filter(
      (key) => !(key in data) || data[key].trim() === '',
    );
    if (missing.length > 0) {
      return `Будь ласка, вкажи значення для полів: ${missing.join(', ')}`;
    }

    // Replacing placeholders with actual values from input
    let doc = tmpl.content;
    for (const key of placeholders) {
      const value = data[key];
      const safeKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      doc = doc.replace(new RegExp(`\\{${safeKey}\\}`, 'g'), value);
    }

    // Returning the final document (Markdown format)
    return doc;
  }
}
