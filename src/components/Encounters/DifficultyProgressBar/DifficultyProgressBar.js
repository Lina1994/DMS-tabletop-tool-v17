
// src/components/Encounters/DifficultyProgressBar/DifficultyProgressBar.js

import React from 'react';
import './DifficultyProgressBar.css';

function DifficultyProgressBar({ adjustedXP, currentThreshold, allThresholds, difficultyText }) {
    const { easy, medium, difficult, deadly } = allThresholds;

    // Define the segments and their colors/labels
    const segments = [
        { label: 'Fácil', className: 'easy', upper: easy },
        { label: 'Media', className: 'medium', upper: medium },
        { label: 'Difícil', className: 'difficult', upper: difficult },
        { label: 'Mortal', className: 'deadly', upper: deadly },
        { label: 'Extremo', className: 'extreme', upper: adjustedXP > deadly ? adjustedXP : deadly * 1.2 }, // A bit arbitrary for extreme upper bound
    ];

    // Determine the total width for the bar based on the highest relevant threshold or adjustedXP
    const maxXP = Math.max(adjustedXP, deadly * 1.2); // Ensure the bar extends beyond deadly if XP is higher

    return (
        <div className="difficulty-progress-bar-container">
            <div className="difficulty-segments">
                {segments.map((segment, index) => {
                    const segmentWidth = (segment.upper - (index === 0 ? 0 : segments[index - 1].upper)) / maxXP * 100;
                    return (
                        <div
                            key={segment.label}
                            className={`difficulty-segment ${segment.className}`}
                            style={{ width: `${segmentWidth}%` }}
                        >
                            {segment.label}
                        </div>
                    );
                })}
            </div>
            {adjustedXP > 0 && (
                <div
                    className="xp-marker"
                    style={{ left: `${(adjustedXP / maxXP) * 100}%` }}
                >
                    <span className="xp-marker-label">{adjustedXP.toFixed(0)} PX</span>
                </div>
            )}
        </div>
    );
}

export default DifficultyProgressBar;
