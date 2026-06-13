// components/Input/Input.jsx
import React, { useState } from 'react';
import { MdVisibility, MdVisibilityOff, MdClose, MdError } from 'react-icons/md';
import './Input.css';

const Input = ({
    type = 'text',
    label,
    placeholder,
    value,
    onChange,
    error,
    helperText,
    required = false,
    disabled = false,
    readOnly = false,
    prefix,
    suffix,
    maxLength,
    min,
    max,
    showCount = false,
    allowClear = false,
    className = '',
    size = 'medium',
    variant = 'outlined',
    ...props
}) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');

    const handleChange = (e) => {
        let newValue = e.target.value;

        // Handle number type restrictions
        if (type === 'number') {
            if (newValue === '') {
                setInputValue('');
                onChange && onChange({ target: { value: '' } });
                return;
            }
            const numValue = Number(newValue);
            if (isNaN(numValue)) return;
            if (min !== undefined && numValue < min) return;
            if (max !== undefined && numValue > max) return;
        }

        setInputValue(newValue);
        onChange && onChange({ target: { value: newValue } });
    };

    const handleClear = () => {
        setInputValue('');
        onChange && onChange({ target: { value: '' } });
    };

    const handleFocus = (e) => {
        setFocused(true);
        props.onFocus && props.onFocus(e);
    };

    const handleBlur = (e) => {
        setFocused(false);
        props.onBlur && props.onBlur(e);
    };

    const getInputType = () => {
        if (type === 'password') return showPassword ? 'text' : 'password';
        return type;
    };

    const inputClasses = [
        'custom-input-wrapper',
        `custom-input-${size}`,
        `custom-input-${variant}`,
        focused ? 'focused' : '',
        error ? 'has-error' : '',
        disabled ? 'disabled' : '',
        readOnly ? 'readonly' : '',
        prefix ? 'has-prefix' : '',
        suffix ? 'has-suffix' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={inputClasses}>
            {label && (
                <label className="custom-input-label">
                    {label}
                    {required && <span className="required-star">*</span>}
                </label>
            )}

            <div className="custom-input-container">
                {prefix && <div className="custom-input-prefix">{prefix}</div>}

                {type === 'textarea' ? (
                    <textarea
                        className="custom-input-field"
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        readOnly={readOnly}
                        maxLength={maxLength}
                        rows={4}
                        {...props}
                    />
                ) : (
                    <input
                        type={getInputType()}
                        className="custom-input-field"
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        readOnly={readOnly}
                        maxLength={maxLength}
                        min={min}
                        max={max}
                        {...props}
                    />
                )}

                <div className="custom-input-suffix">
                    {allowClear && inputValue && !disabled && !readOnly && (
                        <button
                            className="input-action-btn clear-btn"
                            onClick={handleClear}
                            type="button"
                            tabIndex={-1}
                        >
                            <MdClose size={16} />
                        </button>
                    )}

                    {type === 'password' && (
                        <button
                            className="input-action-btn password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            type="button"
                            tabIndex={-1}
                        >
                            {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                        </button>
                    )}

                    {suffix && <div className="custom-input-suffix-content">{suffix}</div>}
                </div>
            </div>

            <div className="custom-input-footer">
                {error && (
                    <div className="custom-input-error">
                        <MdError size={14} />
                        <span>{error}</span>
                    </div>
                )}

                {helperText && !error && (
                    <div className="custom-input-helper">{helperText}</div>
                )}

                {showCount && maxLength && (
                    <div className="custom-input-count">
                        {String(inputValue).length}/{maxLength}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Input;