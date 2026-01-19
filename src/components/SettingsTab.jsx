import React, { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage.js";

function SettingsTab({ manageStatus, manageError }) {
    // Используем тот же хук, чтобы настройки сохранялись в браузере
    const [webhookUrl, setWebhookUrl] = useLocalStorage("ai-webhook-url", "");
    const [isTesting, setIsTesting] = useState(false);

    const handleSave = () => {
        manageStatus("Настройки сохранены", 1500);
    };

    const handleTestConnection = async () => {
        if (!webhookUrl) {
            manageError("Сначала введите URL вебхука");
            return;
        }

        setIsTesting(true);
        manageStatus("Проверка связи...", 10000);

        try {
            // Отправляем тестовый запрос
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    test: true,
                    message: "Connection test from 3Dplitka Extension",
                    context: {
                        factory: "Test Factory",
                        collection: "Test Collection",
                        tileName: "Test Tile",
                    },
                    schema: [],
                }),
            });

            if (response.ok) {
                manageStatus("Успех! n8n ответил 200 OK.", 3000);
            } else {
                manageError(`Ошибка: Сервер вернул статус ${response.status}`);
            }
        } catch (error) {
            manageError("Ошибка сети: " + error.message);
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="section">
            <div className="section-header">
                <h2>Настройки</h2>
            </div>

            <div
                className="form-group"
                style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "12px",
                }}
            >
                <label style={{ fontWeight: "bold" }}>Webhook URL (n8n)</label>
                <input
                    type="text"
                    className="input-field"
                    style={{ width: "100%" }}
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <div style={{ fontSize: "12px", color: "#666" }}>
                    Сюда будут отправляться запросы для поиска характеристик.
                </div>
            </div>

            <div
                className="action-buttons-grid-2x2"
                style={{ marginTop: "20px" }}
            >
                <button
                    className="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !webhookUrl}
                >
                    {isTesting ? "Проверка..." : "📡 Проверить связь"}
                </button>
                <button className="button primary" onClick={handleSave}>
                    💾 Сохранить
                </button>
            </div>

            <hr />

            <div
                style={{
                    background: "#f8f9fa",
                    padding: "12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                }}
            >
                <strong>Инструкция:</strong>
                <ul
                    style={{
                        paddingLeft: "20px",
                        marginTop: "8px",
                        color: "#444",
                    }}
                >
                    <li>Создайте Workflow в n8n.</li>
                    <li>
                        Добавьте узел <b>Webhook</b> (Method: POST).
                    </li>
                    <li>
                        Скопируйте <b>Test URL</b> или <b>Production URL</b>.
                    </li>
                    <li>Вставьте сюда и нажмите "Проверить".</li>
                </ul>
            </div>
        </div>
    );
}

export default SettingsTab;
