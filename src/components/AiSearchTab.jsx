/* eslint-disable no-undef */
import React, { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage.js";
import { getProductContext } from "../utils/page-scripts.js";
import { propertiesList } from "../data/propertiesList.js";
import { getDisplayValue } from "./property-helpers.jsx";
import usePageLogic from "../hooks/usePageLogic.js";

function AiSearchTab({ manageStatus, manageError }) {
    // Читаем данные шаблонов напрямую из LS
    const [templates] = useLocalStorage("prop-templates", []);
    const [activeTemplateId] = useLocalStorage("prop-active-template-id", null);

    // История запросов
    const [history, setHistory] = useLocalStorage("ai-search-history", []);

    // Состояние текущего поиска
    const [isSearching, setIsSearching] = useState(false);
    const [currentResult, setCurrentResult] = useState(null); // { context, properties: [] }
    const [checkedIds, setCheckedIds] = useState([]);

    const { fillForms } = usePageLogic(manageStatus, manageError);

    // Вычисляем активный шаблон для отображения
    const activeTemplate = templates.find(
        (t) => String(t.id) === activeTemplateId,
    );

    // --- ЛОГИКА ПОИСКА ---

    const performSearch = async (schemaOverride = null) => {
        setIsSearching(true);
        manageStatus("Считываю контекст и отправляю в AI...", 20000);

        try {
            // 1. Получаем контекст со страницы
            const contextResults = await chrome.scripting.executeScript({
                target: {
                    tabId:
                        chrome.devtools?.inspectedWindow?.tabId ||
                        (
                            await chrome.tabs.query({
                                active: true,
                                currentWindow: true,
                            })
                        )[0].id,
                },
                func: getProductContext,
            });

            const context = contextResults[0]?.result;
            if (!context) throw new Error("Не удалось считать контекст товара");

            // 2. Формируем схему (либо полную из шаблона, либо частичную для повтора)
            let schemaToSend;

            if (schemaOverride) {
                // Если это повтор - берем переданную (урезанную) схему
                schemaToSend = schemaOverride;
            } else {
                // Если новый поиск - берем всё из активного шаблона
                if (!activeTemplate || !activeTemplate.properties.length) {
                    throw new Error(
                        "Выберите шаблон со свойствами во вкладке 'Свойства'",
                    );
                }
                // Формируем полную схему на основе свойств шаблона, ИСКЛЮЧАЯ "skip"
                schemaToSend = activeTemplate.properties
                    .filter((p) => propertiesList[p.id]?.searchHint !== "skip")
                    .map((p) => {
                        const def = propertiesList[p.id];
                        return {
                            id: p.id,
                            name: def?.text || "Unknown",
                            type: def?.type || "text",
                            searchHint: def?.searchHint || null,
                            options: def?.options?.map((o) => ({
                                id: o.id,
                                text: o.text,
                            })),
                        };
                    });
            }

            if (schemaToSend.length === 0) {
                throw new Error(
                    "В этом шаблоне нет свойств для поиска (все помечены как skip)",
                );
            }

            // 3. Отправляем в N8N
            const webhookUrl = JSON.parse(
                localStorage.getItem("ai-webhook-url"),
            );
            if (!webhookUrl) throw new Error("Нет Webhook URL в настройках");

            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context, schema: schemaToSend }),
            });

            if (!response.ok) throw new Error(`Ошибка AI: ${response.status}`);

            const data = await response.json();
            // Ожидаем массив свойств в ответе: [{ id, value, confidence, source, ... }]
            const receivedProps = Array.isArray(data)
                ? data
                : data.properties || [];

            // 4. Обработка результатов
            // Если это повтор, нужно объединить старые результаты с новыми
            let finalProps = [];
            if (schemaOverride && currentResult) {
                // Берем старые, которые были отмечены галочками (хорошие)
                const keptProps = currentResult.properties.filter((p) =>
                    checkedIds.includes(p.id),
                );
                // Добавляем новые
                finalProps = [...keptProps, ...receivedProps];
            } else {
                finalProps = receivedProps;
            }

            // Обновляем состояние
            const newResultObj = {
                context,
                properties: finalProps,
                timestamp: Date.now(),
            };

            setCurrentResult(newResultObj);

            // Автоматически ставим галочки на всё, что пришло
            setCheckedIds(finalProps.map((p) => p.id));

            // Сохраняем в историю (если это был полный поиск)
            if (!schemaOverride) {
                addToHistory(newResultObj);
            }

            manageStatus(`Найдено свойств: ${receivedProps.length}`, 2000);
        } catch (error) {
            manageError(error.message);
        } finally {
            setIsSearching(false);
        }
    };

    const addToHistory = (resultItem) => {
        setHistory((prev) => {
            // Безопасная фильтрация (проверяем наличие context и vendorCode)
            const safePrev = Array.isArray(prev) ? prev : [];
            const filtered = safePrev.filter((i) => {
                // Если старая запись битая, удаляем её
                if (!i || !i.context) return false;
                // Иначе проверяем на дубликат
                return i.context.vendorCode !== resultItem.context.vendorCode;
            });
            return [resultItem, ...filtered].slice(0, 5);
        });
    };

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    const handleRetry = () => {
        if (!currentResult) return;

        // Находим ID, которые СЕЙЧАС в результатах, но НЕ отмечены галочкой
        const currentDisplayedIds = currentResult.properties.map((p) => p.id);
        const uncheckedIds = currentDisplayedIds.filter(
            (id) => !checkedIds.includes(id),
        );

        // Также нужно добавить те свойства из шаблона, которые вообще не вернулись в первый раз
        const templateIds = activeTemplate.properties.map((p) => p.id);
        const missingInResultIds = templateIds.filter(
            (id) => !currentDisplayedIds.includes(id),
        );

        const idsToRetry = [
            ...new Set([...uncheckedIds, ...missingInResultIds]),
        ];

        // Фильтруем SKIP перед повторным поиском
        const filteredIdsToRetry = idsToRetry.filter(
            (id) => propertiesList[id]?.searchHint !== "skip",
        );

        if (filteredIdsToRetry.length === 0) {
            manageError(
                "Нет свойств для повторного поиска (все skip или уже найдены)",
            );
            return;
        }

        // Строим схему только для этих ID
        const partialSchema = filteredIdsToRetry.map((id) => {
            const def = propertiesList[id];
            return {
                id: Number(id),
                name: def?.text || "Unknown",
                type: def?.type || "text",
                searchHint: def?.searchHint || null,
                options: def?.options?.map((o) => ({ id: o.id, text: o.text })),
            };
        });

        performSearch(partialSchema);
    };

    const handleApply = () => {
        if (!currentResult) return;
        const propsToFill = currentResult.properties
            .filter((p) => checkedIds.includes(p.id))
            .map((p) => ({
                id: p.id,
                value: p.value,
            }));

        if (propsToFill.length === 0) {
            manageError("Ничего не выбрано");
            return;
        }

        fillForms(propsToFill, "Внедряю от AI");
    };

    const toggleCheckbox = (id) => {
        setCheckedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const getConfidenceLabel = (conf) => {
        if (conf === undefined || conf === null) return null;

        let val = Number(conf);
        // Если пришло значение <= 1 (например 0.9), считаем это нормализованным float и переводим в 10-балльную
        if (val <= 1 && val > 0) {
            val = Math.round(val * 10);
        } else {
            // Иначе считаем, что уже пришло число типа 8, 9, 10
            val = Math.round(val);
        }

        // Ограничители (на всякий случай)
        if (val < 1) val = 1;
        if (val > 10) val = 10;

        let color = "gray";
        if (val >= 8) {
            color = "green";
        } else if (val >= 5) {
            color = "orange";
        } else {
            color = "red";
        }

        return <span className={`confidence-badge ${color}`}>{val}/10</span>;
    };

    // Восстановление из истории
    const loadFromHistory = (item) => {
        if (!item) return;
        setCurrentResult(item);
        if (item.properties) {
            setCheckedIds(item.properties.map((p) => p.id));
        }
        manageStatus("Результат восстановлен из истории", 1000);
    };

    // Безопасный рендеринг истории
    const renderHistoryItem = (item, idx) => {
        // Проверка на валидность объекта истории
        if (!item || !item.context) return null;

        return (
            <li key={idx} onClick={() => loadFromHistory(item)}>
                <div className="history-main">
                    {item.context.factory || "?"}{" "}
                    {item.context.collection || ""}
                </div>
                <div className="history-sub">
                    {item.context.vendorCode || ""} •{" "}
                    {item.context.tileName || ""} • {item.context.size || ""}
                </div>
            </li>
        );
    };

    return (
        <div className="ai-search-tab">
            {/* 1. Название шаблона */}
            <div className="template-info-block">
                <span className="label">Шаблон:</span>
                <span className="value">
                    {activeTemplate
                        ? activeTemplate.name
                        : "Не выбран (идите в Свойства)"}
                </span>
            </div>

            {/* 2. Кнопка Поиска */}
            <button
                className="button primary full-width big-btn"
                onClick={() => performSearch(null)}
                disabled={isSearching || !activeTemplate}
            >
                {isSearching ? "Ищу в недрах сети..." : "🔎 ИИ поиск"}
            </button>

            {/* 3. Результаты */}
            {currentResult && (
                <div className="results-container">
                    <div className="results-header">
                        <h3>
                            Результаты ({currentResult.properties?.length || 0})
                        </h3>
                        <div className="context-hint">
                            {currentResult.context?.factory}{" "}
                            {currentResult.context?.collection}{" "}
                            {currentResult.context?.vendorCode}
                        </div>
                    </div>

                    <div className="props-table-wrapper">
                        <table className="ai-props-table">
                            <thead>
                                <tr>
                                    <th width="30">✓</th>
                                    <th>Свойство</th>
                                    <th>Значение</th>
                                    <th>Инфо</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentResult.properties?.map((prop) => (
                                    <tr
                                        key={prop.id}
                                        className={
                                            checkedIds.includes(prop.id)
                                                ? "row-checked"
                                                : "row-unchecked"
                                        }
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={checkedIds.includes(
                                                    prop.id,
                                                )}
                                                onChange={() =>
                                                    toggleCheckbox(prop.id)
                                                }
                                            />
                                        </td>
                                        <td className="prop-name-cell">
                                            {propertiesList[prop.id]?.text ||
                                                prop.name ||
                                                prop.id}
                                        </td>
                                        <td className="prop-value-cell">
                                            {getDisplayValue(
                                                prop.id,
                                                prop.value,
                                            )}
                                        </td>
                                        <td className="prop-meta-cell">
                                            <div className="meta-stack">
                                                {getConfidenceLabel(
                                                    prop.confidence,
                                                )}
                                                {prop.source && (
                                                    <a
                                                        href={prop.source}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Источник"
                                                    >
                                                        🔗
                                                    </a>
                                                )}
                                                {prop.sourcePdf && (
                                                    <a
                                                        href={prop.sourcePdf}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="PDF"
                                                        className="pdf-link"
                                                    >
                                                        PDF
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Кнопки действий */}
                    <div className="results-actions">
                        <button
                            className="button primary"
                            onClick={handleApply}
                        >
                            Внедрить ({checkedIds.length})
                        </button>
                        <button
                            className="button secondary"
                            onClick={handleRetry}
                        >
                            ↻ Повторить (для пустых)
                        </button>
                    </div>
                </div>
            )}

            <hr />

            {/* 5. История */}
            <div className="history-section">
                <h3>История запросов</h3>
                {!history || history.length === 0 ? (
                    <p className="empty-history">Еще нет запросов</p>
                ) : (
                    <ul className="history-list">
                        {history.map((item, idx) =>
                            renderHistoryItem(item, idx),
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default AiSearchTab;
