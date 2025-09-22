import { useState, useEffect, useRef, useCallback } from "react";

// Этот хук добавляет возможность временной отмены к состоянию
function useUndoableState(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const savedValue = localStorage.getItem(key);
            return savedValue ? JSON.parse(savedValue) : initialValue;
        } catch {
            return initialValue;
        }
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
            // Сразу применяем новое состояние (например, с удаленным элементом)
            setState(newState);

            // Очищаем предыдущий таймер, если он был
            clearTimeout(undoTimer.current);

            // Устанавливаем таймер на 3 секунды
            undoTimer.current = setTimeout(() => {
                // Через 3 секунды "забываем" состояние для отмены, делая удаление окончательным
                undoState.current = null;
            }, 3000);
        },
        [state]
    );

    // Функция отмены
    const undo = useCallback(() => {
        // Если есть что отменять (т.е. таймер еще не истек)
        if (undoState.current) {
            // Восстанавливаем предыдущее состояние
            setState(undoState.current);
            // "Забываем" состояние для отмены
            undoState.current = null;
            // Очищаем таймер, чтобы удаление не произошло
            clearTimeout(undoTimer.current);
            return true; // Возвращаем true, чтобы показать, что отмена сработала
        }
        return false; // Отменять было нечего
    }, []);

    return [state, setState, setUndoable, undo];
}

export default useUndoableState;
