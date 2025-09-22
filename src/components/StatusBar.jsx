import React from "react";
import Icon from "./Icon.jsx"; // Импортируем иконки

function StatusBar({ message, isError, isLoading }) {
    return (
        <footer className={`status-bar ${isError ? "error" : ""}`}>
            {/* Условное отображение шестеренки */}
            {isLoading && (
                <div className="loading-gear">
                    <Icon name="gear" />
                </div>
            )}
            <p>{message}</p>
        </footer>
    );
}

export default StatusBar;
