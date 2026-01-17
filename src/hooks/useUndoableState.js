import { useState, useEffect, useRef, useCallback } from "react";

// Этот хук добавляет возможность временной отмены к состоянию
function useUndoableState(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const savedValue = localStorage.getItem(key);
            if (savedValue) {
                return JSON.parse(savedValue);
            }
        } catch (error) {
            console.error("Ошибка парсинга localStorage:", error);
        }

        // ВАЖНОЕ ИСПРАВЛЕНИЕ:
        // Если initialValue — это функция (ленивая инициализация), вызываем её,
        // чтобы получить само значение (массив), а не записывать функцию в стейт.
        if (initialValue instanceof Function) {
            return initialValue();
        }
        return initialValue;
    });

    const undoState = useRef(null);
    const undoTimer = useRef(null);

    // Сохраняем в localStorage при любом изменении
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [state, key]);

    // Функция для установки нового состояния с возможностью отмены
    const setUndoable = useCallback(
        (newState) => {
            // Сохраняем текущее состояние для возможной отмены
            undoState.current = state;
            // Сразу применяем новое состояние
            setState(newState);

            // Очищаем предыдущий таймер, если он был
            clearTimeout(undoTimer.current);

            // Устанавливаем таймер на 15 секунд
            undoTimer.current = setTimeout(() => {
                undoState.current = null;
            }, 15000);
        },
        [state],
    );

    // Функция отмены
    const undo = useCallback(() => {
        if (undoState.current) {
            setState(undoState.current);
            undoState.current = null;
            clearTimeout(undoTimer.current);
            return true;
        }
        return false;
    }, []);

    return [state, setState, setUndoable, undo];
}

export default useUndoableState;
