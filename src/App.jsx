import React, { useState, useRef } from "react";
import useLocalStorage from "./hooks/useLocalStorage.js";
import Header from "./components/Header";
import ImagesTab from "./components/ImagesTab";
import PropertiesTab from "./components/PropertiesTab/PropertiesTab";
import SettingsTab from "./components/SettingsTab"; // Импорт настроек
import StatusBar from "./components/StatusBar";
import "./App.css";

function App() {
    const [activeTab, setActiveTab] = useLocalStorage("active-tab", "images");

    const defaultStatus = "Жду указаний";
    const [statusMessage, setStatusMessage] = useState(defaultStatus);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const statusTimer = useRef(null);

    const manageStatus = (inProgressMessage, durationMs) => {
        clearTimeout(statusTimer.current);
        setIsError(false);
        setIsLoading(true);
        setStatusMessage(inProgressMessage);

        statusTimer.current = setTimeout(() => {
            setIsLoading(false);
            setStatusMessage("Готово");
            statusTimer.current = setTimeout(() => {
                setStatusMessage(defaultStatus);
            }, 3000);
        }, durationMs);
    };

    const manageError = (errorMessage) => {
        clearTimeout(statusTimer.current);
        setIsError(true);
        setIsLoading(false);
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
                {activeTab === "settings" && (
                    <SettingsTab
                        manageStatus={manageStatus}
                        manageError={manageError}
                    />
                )}
            </main>

            <StatusBar
                message={statusMessage}
                isError={isError}
                isLoading={isLoading}
            />
        </div>
    );
}

export default App;
