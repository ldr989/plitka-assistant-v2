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
            </nav>
        </header>
    );
}

export default Header;
