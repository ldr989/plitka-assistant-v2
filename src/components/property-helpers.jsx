import React from "react";
import { propertiesList } from "../data/propertiesList.js";

// Вспомогательная функция для красивого отображения значений
export const getDisplayValue = (propId, value) => {
    const propInfo = propertiesList[propId];
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
    ) {
        return <span className="value-empty">пусто</span>;
    }
    if (!propInfo) return String(value);
    switch (propInfo.type) {
        case "boolean":
            return value ? "Да" : "Нет";
        case "select":
            return (
                propInfo.options.find((opt) => opt.id === value)?.text ||
                String(value)
            );
        case "checkbox":
            if (Array.isArray(value)) {
                return value
                    .map(
                        (val) =>
                            propInfo.options.find((opt) => opt.id === val)
                                ?.text || val
                    )
                    .join(", ");
            }
            return String(value);
        default:
            return String(value);
    }
};
