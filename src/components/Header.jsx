import React from "react";

function Header({ activeTab, setActiveTab }) {
    return (
        <header className="app-header">
            <nav>
                <button
                    className={activeTab === "images" ? "active" : ""}
                    onClick={() => setActiveTab("images")}
                >
                    Картинки
                </button>

                <button
                    className={activeTab === "properties" ? "active" : ""}
                    onClick={() => setActiveTab("properties")}
                >
                    Свойства
                </button>

                <button
                    className={activeTab === "settings" ? "active" : ""}
                    onClick={() => setActiveTab("settings")}
                >
                    Настройки
                </button>
            </nav>
        </header>
    );
}

export default Header;
