import React from "react";
import Icon from "./Icon.jsx"; // Убедись, что в Icon.jsx есть 'gear'

function Header({ activeTab, setActiveTab }) {
    return (
        <header className="app-header">
            <nav
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    alignItems: "flex-end",
                }}
            >
                <div style={{ display: "flex", gap: "4px" }}>
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
                </div>

                <button
                    className={activeTab === "settings" ? "active" : ""}
                    onClick={() => setActiveTab("settings")}
                    title="Настройки"
                    style={{
                        padding: "10px",
                        borderBottom: "none",
                        borderRadius: "6px 6px 0 0",
                        marginBottom: "-1px",
                    }}
                >
                    <Icon name="gear" />
                </button>
            </nav>
        </header>
    );
}

export default Header;
