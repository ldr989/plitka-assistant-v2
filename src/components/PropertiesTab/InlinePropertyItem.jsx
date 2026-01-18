import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { propertiesList } from "../../data/propertiesList.js";
import { PropertyValueInput } from "../PropertyComponents.jsx";
import { getDisplayValue } from "../property-helpers.jsx";
import Icon from "../Icon.jsx";

export default function InlinePropertyItem({
    prop,
    index,
    isEditing,
    editingValue,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onToggleIgnore,
    onValueChange,
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: prop.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={
                isEditing ? "editing-item" : prop.ignored ? "ignored-item" : ""
            }
        >
            <div className="handle-wrapper" {...listeners}>
                <div className="drag-handle">
                    <span className="prop-number">{index + 1}.</span>
                </div>
                <div className="prop-details">
                    <span className="prop-name">
                        {propertiesList[prop.id]?.text}
                    </span>
                    {isEditing ? (
                        <PropertyValueInput
                            propId={prop.id}
                            value={editingValue}
                            onChange={onValueChange}
                        />
                    ) : (
                        <span className="prop-value">
                            {getDisplayValue(prop.id, prop.value)}
                        </span>
                    )}
                </div>
            </div>
            <div className="template-actions">
                {isEditing ? (
                    <>
                        <button
                            className="button small primary"
                            onClick={onSaveEdit}
                        >
                            OK
                        </button>
                        <button
                            className="button small secondary"
                            onClick={onCancelEdit}
                        >
                            X
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="button small icon-button"
                            onClick={onToggleIgnore}
                            title={prop.ignored ? "Показать" : "Игнорировать"}
                        >
                            <Icon name={prop.ignored ? "eye-off" : "eye"} />
                        </button>
                        <button
                            className="button small icon-button"
                            onClick={onStartEdit}
                            title="Правка"
                        >
                            <Icon name="pencil" />
                        </button>
                    </>
                )}
            </div>
        </li>
    );
}
