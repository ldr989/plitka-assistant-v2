// URL твоего n8n webhook
// Мы будем получать его динамически из настроек

/**
 * Подготовка данных и отправка в n8n
 */

// Функция для получения URL из localStorage (так как это не React компонент, хуки тут не работают)
const getWebhookUrl = () => {
    try {
        const stored = localStorage.getItem("ai-webhook-url");
        // localStorage хранит строки, а useLocalStorage сохраняет JSON.stringify
        // Поэтому нужно убрать кавычки, если они есть
        if (!stored) return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

/**
 * Фильтрует propertiesList, оставляя только те свойства, которые есть в активном шаблоне.
 */
const prepareFilteredSchema = (propertiesList, activeTemplateProperties) => {
    const activeIds = new Set(
        activeTemplateProperties.map((p) => Number(p.id)),
    );
    const schema = [];

    activeIds.forEach((id) => {
        const propDef = propertiesList[id];
        if (!propDef) return;

        const propSchema = {
            id: Number(id),
            name: propDef.text,
            type: propDef.type,
        };

        if (propDef.options && propDef.options.length > 0) {
            propSchema.options = propDef.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
            }));
        }

        schema.push(propSchema);
    });

    return schema;
};

export const fetchAiData = async (
    productContext,
    propertiesList,
    activeTemplateProperties,
) => {
    try {
        const WEBHOOK_URL = getWebhookUrl();

        if (!WEBHOOK_URL) {
            throw new Error(
                "Не настроен Webhook URL! Зайдите во вкладку 'Настройки'.",
            );
        }

        const schema = prepareFilteredSchema(
            propertiesList,
            activeTemplateProperties,
        );

        const payload = {
            context: productContext,
            schema: schema,
        };

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера n8n: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
