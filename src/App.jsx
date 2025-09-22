import React, { useState, useRef } from "react";
import Header from "./components/Header";
import ImagesTab from "./components/ImagesTab";
import PropertiesTab from "./components/PropertiesTab";
import StatusBar from "./components/StatusBar";
import "./App.css";

function App() {
    const [activeTab, setActiveTab] = useState("images");

    const defaultStatus = "Жду указаний";
    const [statusMessage, setStatusMessage] = useState(defaultStatus);
    const [isError, setIsError] = useState(false); // Новое состояние для отслеживания ошибок
    const statusTimer = useRef(null);

    // Функция для УСПЕШНЫХ операций
    const manageStatus = (inProgressMessage, durationMs) => {
        clearTimeout(statusTimer.current);
        setIsError(false); // Сбрасываем флаг ошибки
        setStatusMessage(inProgressMessage);

        statusTimer.current = setTimeout(() => {
            setStatusMessage("Готово");
            statusTimer.current = setTimeout(() => {
                setStatusMessage(defaultStatus);
            }, 3000);
        }, durationMs);
    };

    // Новая функция для НЕУДАЧНЫХ операций
    const manageError = (errorMessage) => {
        clearTimeout(statusTimer.current);
        setIsError(true); // Устанавливаем флаг ошибки
        setStatusMessage(errorMessage);

        // Через 5 секунд возвращаемся к стандартному сообщению
        statusTimer.current = setTimeout(() => {
            setStatusMessage(defaultStatus);
            setIsError(false);
        }, 5000);
    };

    return (
        <div className="app-container">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="tab-content">
                {/* Передаем обе функции в дочерние компоненты */}
                {activeTab === "images" && (
                    <ImagesTab
                        manageStatus={manageStatus}
                        manageError={manageError}
                    />
                )}
                {activeTab === "properties" && (
                    <PropertiesTab
                        manageStatus={manageStatus}
                        manageError={manageError}
                    />
                )}
            </main>

            <StatusBar message={statusMessage} isError={isError} />
        </div>
    );
}

export default App;
