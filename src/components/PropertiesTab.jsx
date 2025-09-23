/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback } from "react";
import useUndoableState from "../hooks/useUndoableState.js";
import TemplateEditor from "./TemplateEditor.jsx";
import Icon from "./Icon.jsx";
import Calculator from "./Calculator.jsx";
import {
    getPropertiesFromPage,
    addPropertyFormsOnPage,
    fillPropertyFormsOnPage,
} from "../utils/page-scripts.js";

function PropertiesTab({ manageStatus, manageError }) {
    const [templates, setTemplates, setUndoableTemplates, undoTemplates] =
        useUndoableState("prop-templates", []);
    const [activeTemplateId, setActiveTemplateId] = useUndoableState(
        "prop-active-template-id",
        null
    );
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [missingProperties, setMissingProperties] = useState(null);

    const [showTemplateList, setShowTemplateList] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    useEffect(() => {
        setMissingProperties(null);
    }, [activeTemplateId]);

    const activeTemplate = templates.find(
        (t) => String(t.id) === activeTemplateId
    );

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.code === "KeyZ" && !editingTemplateId) {
                event.preventDefault();
                if (undoTemplates()) {
                    manageStatus("Удаление шаблона отменено", 1500);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undoTemplates, manageStatus, editingTemplateId]);

    useEffect(() => {
        if (showTemplateList) {
            const handleKeyDown = (event) => {
                if (event.key === "Escape") {
                    setShowTemplateList(false);
                }
            };
            window.addEventListener("keydown", handleKeyDown);

            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [showTemplateList]);

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

    const handleDeleteTemplate = (templateId, templateName) => {
        if (
            confirm(`Вы уверены, что хотите удалить шаблон "${templateName}"?`)
        ) {
            if (String(templateId) === activeTemplateId) {
                setActiveTemplateId(null);
            }
            const newTemplates = templates.filter((t) => t.id !== templateId);
            setUndoableTemplates(newTemplates);
            manageStatus("Шаблон удален (Ctrl+Z для отмены)", 3000);
        }
    };

    const handleDuplicateTemplate = (templateId) => {
        const templateToDuplicate = templates.find((t) => t.id === templateId);
        if (!templateToDuplicate) return;

        const newTemplate = JSON.parse(JSON.stringify(templateToDuplicate));

        newTemplate.id = Date.now();
        newTemplate.name = `${templateToDuplicate.name} (Копия)`;

        const originalIndex = templates.findIndex((t) => t.id === templateId);

        const newTemplates = [...templates];
        newTemplates.splice(originalIndex + 1, 0, newTemplate);

        setTemplates(newTemplates);
        manageStatus(`Шаблон "${templateToDuplicate.name}" скопирован`, 1500);
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
                    if (result && result.success) {
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
                        manageError(
                            result
                                ? result.message
                                : "Скрипт не вернул результат."
                        );
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
                () => {
                    if (chrome.runtime.lastError) {
                        manageError(
                            "Ошибка: не удалось запустить скрипт добавления форм"
                        );
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
                () => {
                    if (chrome.runtime.lastError) {
                        manageError(
                            "Ошибка: не удалось запустить скрипт заполнения"
                        );
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

    if (showTemplateList) {
        return (
            <div className="section">
                <div className="template-list-header">
                    <h2>Список шаблонов:</h2>
                    <button
                        className="button icon-button"
                        onClick={() => setShowTemplateList(false)}
                        title="Закрыть"
                    >
                        <Icon name="close" />
                    </button>
                </div>

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
                                            className="button small icon-button"
                                            title="Дублировать"
                                            onClick={() =>
                                                handleDuplicateTemplate(
                                                    template.id
                                                )
                                            }
                                        >
                                            <Icon name="copy" />
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
        );
    }

    return (
        <div>
            <div className="section">
                <h2>Свойства плитки</h2>
                <div className="active-template-display">
                    <span>Текущий шаблон:</span>
                    {activeTemplate ? (
                        <strong>{activeTemplate.name}</strong>
                    ) : (
                        <span className="no-template">Не выбран</span>
                    )}

                    <div className="template-selector-wrapper">
                        <button
                            className="button icon-button small"
                            onClick={() =>
                                setShowTemplateSelector(!showTemplateSelector)
                            }
                            title="Выбрать шаблон"
                        >
                            <Icon name="pencil" />
                        </button>
                        {showTemplateSelector && (
                            <select
                                className="template-chooser-popup"
                                value={activeTemplateId || ""}
                                onChange={(e) => {
                                    setActiveTemplateId(e.target.value);
                                    setShowTemplateSelector(false);
                                }}
                                disabled={templates.length === 0}
                                size={Math.min(templates.length + 1, 8)}
                                autoFocus
                                onBlur={() => setShowTemplateSelector(false)}
                            >
                                <option value="">-- Выбрать шаблон --</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="show-all-templates-section">
                    <button
                        className="button secondary"
                        onClick={() => setShowTemplateList(true)}
                    >
                        Все шаблоны
                    </button>
                </div>

                <div className="action-buttons-grid-2x2">
                    <button
                        className="button"
                        disabled={!activeTemplate}
                        onClick={handleFindMissingProperties}
                    >
                        Поиск свойств
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
                        Заполнить
                    </button>
                    <button
                        className="button"
                        disabled={!activeTemplate}
                        onClick={handleReplaceAllValues}
                    >
                        Заменить
                    </button>
                </div>
            </div>

            <hr />
            <div className="section">
                <h2>Вычисление параметров</h2>
                <Calculator
                    manageStatus={manageStatus}
                    manageError={manageError}
                />
            </div>
        </div>
    );
}

export default PropertiesTab;
