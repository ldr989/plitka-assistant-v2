import { useState, useEffect } from "react";

function getSavedValue(key, initialValue) {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
        try {
            return JSON.parse(savedValue);
        } catch (error) {
            console.error("Ошибка парсинга localStorage:", error);
            return initialValue;
        }
    }
    if (initialValue instanceof Function) return initialValue();
    return initialValue;
}

export default function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        return getSavedValue(key, initialValue);
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return [value, setValue];
}
