import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Icon from "../Icon.jsx";

function SortableTemplateItem({
    template,
    index,
    onEdit,
    onDuplicate,
    onDelete,
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: template.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <li ref={setNodeRef} style={style} {...attributes}>
            <div className="drag-handle" {...listeners}>
                <span className="prop-number">{index + 1}.</span>
            </div>
            <div className="template-info">
                <span className="template-name">{template.name}</span>
                <span className="template-prop-count">
                    Свойств: {template.properties.length}
                </span>
            </div>
            <div className="template-actions">
                <button
                    className="button small icon-button"
                    onClick={onEdit}
                    title="Редактировать"
                >
                    <Icon name="pencil" />
                </button>
                <button
                    className="button small icon-button"
                    onClick={onDuplicate}
                    title="Дублировать"
                >
                    <Icon name="copy" />
                </button>
                <button
                    className="button small icon-button danger"
                    onClick={onDelete}
                    title="Удалить"
                >
                    <Icon name="trash" />
                </button>
            </div>
        </li>
    );
}

export default function TemplateList({
    templates,
    onDragEnd,
    onAdd,
    onEdit,
    onDuplicate,
    onDelete,
    onClose,
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const handleAdd = () => {
        if (newName.trim()) {
            onAdd(newName.trim());
            setNewName("");
            setIsAdding(false);
        }
    };

    return (
        <div className="section">
            <div className="template-list-header">
                <h2>Список шаблонов:</h2>
                <button className="button icon-button" onClick={onClose}>
                    <Icon name="close" />
                </button>
            </div>
            {isAdding ? (
                <div className="add-template-form">
                    <input
                        className="input-field"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Название"
                        autoFocus
                    />
                    <button className="button" onClick={handleAdd}>
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
                <button className="button" onClick={() => setIsAdding(true)}>
                    + Добавить новый шаблон
                </button>
            )}
            <div className="template-list-container">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext
                        items={templates}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className="template-list">
                            {templates.map((t, i) => (
                                <SortableTemplateItem
                                    key={t.id}
                                    template={t}
                                    index={i}
                                    onEdit={() => onEdit(t.id)}
                                    onDuplicate={() => onDuplicate(t.id)}
                                    onDelete={() => onDelete(t.id, t.name)}
                                />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
