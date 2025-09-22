import React from "react";

function StatusBar({ message, isError }) {
    return (
        <footer className={`status-bar ${isError ? "error" : ""}`}>
            <p>{message}</p>
        </footer>
    );
}

export default StatusBar;
