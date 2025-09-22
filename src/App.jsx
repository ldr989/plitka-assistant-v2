import React, { useState, useRef } from "react";
import useLocalStorage from "./hooks/useLocalStorage.js"; // 1. Импортируем хук
import Header from "./components/Header";
import ImagesTab from "./components/ImagesTab";
import PropertiesTab from "./components/PropertiesTab";
import StatusBar from "./components/StatusBar";
import "./App.css";

function App() {
    // 2. Заменяем useState на useLocalStorage
    const [activeTab, setActiveTab] = useLocalStorage("active-tab", "images");

    const defaultStatus = "Жду указаний";
    const [statusMessage, setStatusMessage] = useState(defaultStatus);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Состояние для шестеренки
    const statusTimer = useRef(null);

    const manageStatus = (inProgressMessage, durationMs) => {
        clearTimeout(statusTimer.current);
        setIsError(false);
        setIsLoading(true); // <-- Показываем шестеренку
        setStatusMessage(inProgressMessage);

        statusTimer.current = setTimeout(() => {
            setIsLoading(false); // <-- Прячем шестеренку
            setStatusMessage("Готово");
            statusTimer.current = setTimeout(() => {
                setStatusMessage(defaultStatus);
            }, 3000);
        }, durationMs);
    };

    const manageError = (errorMessage) => {
        clearTimeout(statusTimer.current);
        setIsError(true);
        setIsLoading(false); // <-- Прячем шестеренку в случае ошибки
        setStatusMessage(errorMessage);

        statusTimer.current = setTimeout(() => {
            setStatusMessage(defaultStatus);
            setIsError(false);
        }, 5000);
    };

    return (
        <div className="app-container">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="tab-content">
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

            {/* 3. Передаем isLoading в StatusBar */}
            <StatusBar
                message={statusMessage}
                isError={isError}
                isLoading={isLoading}
            />
        </div>
    );
}

export default App;
