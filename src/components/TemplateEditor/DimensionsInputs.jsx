import React from "react";

function DimensionsInputs({ length, width, setLength, setWidth }) {
    const handleInput = (val, setter) => {
        setter(val.replace(/[^0-9,.]/g, ""));
    };

    return (
        <div className="dimensions-inputs">
            <div className="dimension-group">
                <label>Длина, см:</label>
                <input
                    type="text"
                    inputMode="decimal"
                    className="input-field"
                    value={length}
                    onChange={(e) => handleInput(e.target.value, setLength)}
                />
            </div>
            <div className="dimension-group">
                <label>Ширина, см:</label>
                <input
                    type="text"
                    inputMode="decimal"
                    className="input-field"
                    value={width}
                    onChange={(e) => handleInput(e.target.value, setWidth)}
                />
            </div>
        </div>
    );
}

export default DimensionsInputs;
