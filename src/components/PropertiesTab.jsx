/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback } from "react";
import useLocalStorage from "../hooks/useLocalStorage.js";
import TemplateEditor from "./TemplateEditor.jsx";
import Icon from "./Icon.jsx";
import Calculator from "./Calculator.jsx"; // <-- 1. ДОБАВЛЕН ИМПОРТ
import {
    getPropertiesFromPage,
    addPropertyFormsOnPage,
    fillPropertyFormsOnPage,
} from "../utils/page-scripts.js";

function PropertiesTab({ manageStatus, manageError }) {
    const [templates, setTemplates] = useLocalStorage("prop-templates", []);
    const [activeTemplateId, setActiveTemplateId] = useLocalStorage(
        "prop-active-template-id",
        null
    );
    const [editingTemplateId, setEditingTemplateId] = useState(null);

    const [isAdding, setIsAdding] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");

    const [missingProperties, setMissingProperties] = useState(null);

    useEffect(() => {
        setMissingProperties(null);
    }, [activeTemplateId]);

    const activeTemplate = templates.find(
        (t) => String(t.id) === activeTemplateId
    );

    const handleAddTemplate = useCallback(() => {
        if (!newTemplateName.trim()) {
            manageError("Название шаблона не может быть пустым");
            return;
        }
        const newTemplate = {
            id: Date.now(),
            name: newTemplateName.trim(),
            properties: [],
            length: "",
            width: "",
        };
        setTemplates((prevTemplates) => [...prevTemplates, newTemplate]);
        setNewTemplateName("");
        setIsAdding(false);
        manageStatus(`Шаблон "${newTemplate.name}" создан`, 1000);
    }, [newTemplateName, setTemplates, manageStatus, manageError]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!isAdding) return;
            if (event.key === "Enter") {
                event.preventDefault();
                handleAddTemplate();
            }
            if (event.key === "Escape") {
                event.preventDefault();
                setIsAdding(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isAdding, handleAddTemplate]);

    const handleDeleteTemplate = (templateId, templateName) => {
        if (
            confirm(`Вы уверены, что хотите удалить шаблон "${templateName}"?`)
        ) {
            if (String(templateId) === activeTemplateId) {
                setActiveTemplateId(null);
            }
            setTemplates((prevTemplates) =>
                prevTemplates.filter((t) => t.id !== templateId)
            );
            manageStatus(`Шаблон "${templateName}" удален`, 1000);
        }
    };

    const handleUpdateTemplate = (updatedTemplate) => {
        if (!updatedTemplate.name.trim()) {
            manageError("Название шаблона не может быть пустым");
            return;
        }
        setTemplates((prevTemplates) =>
            prevTemplates.map((t) =>
                t.id === updatedTemplate.id ? updatedTemplate : t
            )
        );
        manageStatus(`Шаблон "${updatedTemplate.name}" сохранен`, 1500);
    };

    const handleFindMissingProperties = () => {
        if (!activeTemplate) return;

        manageStatus("Ищу свойства на странице...", 2000);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: getPropertiesFromPage,
                    world: "MAIN",
                },
                (injectionResults) => {
                    if (
                        chrome.runtime.lastError ||
                        !injectionResults ||
                        !injectionResults[0]
                    ) {
                        manageError(
                            "Ошибка: не удалось получить свойства со страницы"
                        );
                        setMissingProperties([]);
                        return;
                    }

                    const result = injectionResults[0].result;
                    if (result.success) {
                        const pageProps = result.data.properties;
                        const pagePropIds = new Set(pageProps.map((p) => p.id));
                        const templateProps = activeTemplate.properties;

                        const missing = templateProps.filter(
                            (templateProp) => !pagePropIds.has(templateProp.id)
                        );

                        setMissingProperties(missing);

                        if (missing.length > 0) {
                            manageStatus(
                                `Найдено отсутствующих свойств: ${missing.length}`,
                                4000
                            );
                        } else {
                            manageStatus(
                                "Все свойства из шаблона уже есть на странице.",
                                4000
                            );
                        }
                    } else {
                        manageError(result.message);
                        setMissingProperties([]);
                    }
                }
            );
        });
    };

    const handleAddMissingForms = () => {
        if (!missingProperties || missingProperties.length === 0) return;

        const missingPropIds = missingProperties.map((p) => p.id);
        const estimatedTime = 500 + missingPropIds.length * 350;

        manageStatus(
            `Добавляю ${missingPropIds.length} форм(у) на страницу...`,
            estimatedTime
        );

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: addPropertyFormsOnPage,
                    args: [missingPropIds],
                    world: "MAIN",
                },
                (injectionResults) => {
                    if (
                        chrome.runtime.lastError ||
                        !injectionResults ||
                        !injectionResults[0]
                    ) {
                        manageError(
                            "Ошибка: не удалось запустить скрипт добавления форм"
                        );
                        return;
                    }
                    const result = injectionResults[0].result;
                    if (result && !result.success) {
                        manageError(result.message);
                    }
                }
            );
        });
    };

    const handleFillMissingForms = () => {
        if (!missingProperties || missingProperties.length === 0) return;

        const estimatedTime = 500 + missingProperties.length * 150;
        manageStatus(
            `Заполняю ${missingProperties.length} форм(у)...`,
            estimatedTime
        );

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: fillPropertyFormsOnPage,
                    args: [missingProperties],
                    world: "MAIN",
                },
                (injectionResults) => {
                    if (
                        chrome.runtime.lastError ||
                        !injectionResults ||
                        !injectionResults[0]
                    ) {
                        manageError(
                            "Ошибка: не удалось запустить скрипт заполнения"
                        );
                        return;
                    }
                    const result = injectionResults[0].result;
                    if (result && !result.success) {
                        manageError(result.message);
                    }
                }
            );
        });
    };

    const handleReplaceAllValues = () => {
        if (!activeTemplate) return;

        const propsToFill = activeTemplate.properties;
        if (propsToFill.length === 0) {
            manageError("В активном шаблоне нет свойств для замены.");
            return;
        }

        const estimatedTime = 500 + propsToFill.length * 150;
        manageStatus(
            `Заменяю значения для ${propsToFill.length} свойств...`,
            estimatedTime
        );

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                manageError("Ошибка: активная вкладка не найдена");
                return;
            }
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: fillPropertyFormsOnPage,
                args: [propsToFill],
                world: "MAIN",
            });
        });
    };

    const editingTemplate = templates.find((t) => t.id === editingTemplateId);

    if (editingTemplate) {
        return (
            <TemplateEditor
                template={editingTemplate}
                onBack={() => setEditingTemplateId(null)}
                onUpdate={handleUpdateTemplate}
                manageStatus={manageStatus}
                manageError={manageError}
            />
        );
    }

    return (
        <div>
            <div className="section">
                <h2>Список шаблонов:</h2>
                {isAdding ? (
                    <div className="add-template-form">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Название нового шаблона"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            autoFocus
                        />
                        <button className="button" onClick={handleAddTemplate}>
                            Добавить
                        </button>
                        <button
                            className="button secondary"
                            onClick={() => setIsAdding(false)}
                        >
                            Отмена
                        </button>
                    </div>
                ) : (
                    <button
                        className="button"
                        onClick={() => setIsAdding(true)}
                    >
                        + Добавить новый шаблон
                    </button>
                )}

                <div className="template-list-container">
                    {templates.length === 0 ? (
                        <p className="empty-list-message">
                            Ваш список шаблонов пуст.
                        </p>
                    ) : (
                        <ul className="template-list">
                            {templates.map((template) => (
                                <li key={template.id}>
                                    <div className="template-info">
                                        <span className="template-name">
                                            {template.name}
                                        </span>
                                        <span className="template-prop-count">
                                            Свойств:{" "}
                                            {template.properties.length}
                                        </span>
                                    </div>
                                    <div className="template-actions">
                                        <button
                                            className="button small icon-button"
                                            title="Редактировать"
                                            onClick={() =>
                                                setEditingTemplateId(
                                                    template.id
                                                )
                                            }
                                        >
                                            <Icon name="pencil" />
                                        </button>
                                        <button
                                            className="button small icon-button danger"
                                            title="Удалить"
                                            onClick={() =>
                                                handleDeleteTemplate(
                                                    template.id,
                                                    template.name
                                                )
                                            }
                                        >
                                            <Icon name="trash" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <hr />

            <div className="section">
                <h2>Свойства плитки</h2>
                <div className="active-template-display">
                    <span>Текущий шаблон:</span>
                    {activeTemplate ? (
                        <strong>{activeTemplate.name}</strong>
                    ) : (
                        <span className="no-template">Не выбран</span>
                    )}
                    <select
                        className="template-chooser"
                        value={activeTemplateId || ""}
                        onChange={(e) => setActiveTemplateId(e.target.value)}
                        disabled={templates.length === 0}
                    >
                        <option value="">-- Выбрать шаблон --</option>
                        {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="action-buttons-grid">
                    <button
                        className="button"
                        disabled={!activeTemplate}
                        onClick={handleFindMissingProperties}
                    >
                        Найти отсутствующие
                    </button>
                    <button
                        className="button"
                        disabled={
                            !activeTemplate ||
                            !missingProperties ||
                            missingProperties.length === 0
                        }
                        onClick={handleAddMissingForms}
                    >
                        Добавить формы
                    </button>
                    <button
                        className="button"
                        disabled={
                            !activeTemplate ||
                            !missingProperties ||
                            missingProperties.length === 0
                        }
                        onClick={handleFillMissingForms}
                    >
                        Заполнить формы
                    </button>
                    <button
                        className="button"
                        disabled={!activeTemplate}
                        onClick={handleReplaceAllValues}
                    >
                        Заменить значениями
                    </button>
                </div>

                {missingProperties && (
                    <div className="results-display">
                        {missingProperties.length > 0
                            ? `Готово к добавлению: ${missingProperties.length} свойств.`
                            : "Все свойства на месте!"}
                    </div>
                )}
            </div>

            <hr />
            <div className="section">
                <h2>Вычисление параметров</h2>
                {/* 2. ЗАМЕНА ЗАГЛУШКИ НА ГОТОВЫЙ КОМПОНЕНТ */}
                <Calculator
                    manageStatus={manageStatus}
                    manageError={manageError}
                />
            </div>
        </div>
    );
}

export default PropertiesTab;
