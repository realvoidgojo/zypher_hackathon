import React from 'react';

const LoadingSpinner = ({ size = 4, className = '' }) => {
    return (
        <div className={`border border-[#1F2937] border-t-[#3B82F6] rounded-full animate-spin w-${size} h-${size}`} />
    );
};

export default LoadingSpinner;