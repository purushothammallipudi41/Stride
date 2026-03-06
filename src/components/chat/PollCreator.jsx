import { useState } from 'react';
import { X, Plus, Trash2, BarChart3 } from 'lucide-react';
import './PollCreator.css';

const PollCreator = ({ onSend, onCancel }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const handleAddOption = () => {
        if (options.length < 5) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validOptions = options.filter(opt => opt.trim() !== '');
        if (!question.trim() || validOptions.length < 2) return;

        onSend({
            question: question.trim(),
            options: validOptions.map(text => ({ text, voters: [] })),
            isMultipleChoice: false
        });
    };

    return (
        <div className="poll-creator-overlay" onClick={onCancel}>
            <div className="poll-creator-card glass-card" onClick={e => e.stopPropagation()}>
                <div className="poll-creator-header">
                    <div className="header-title">
                        <BarChart3 size={20} className="text-primary" />
                        <h3>Create Poll</h3>
                    </div>
                    <button className="close-btn" onClick={onCancel}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="poll-creator-form">
                    <div className="form-group">
                        <label>Question</label>
                        <input
                            type="text"
                            placeholder="What's on your mind?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Options</label>
                        <div className="options-list">
                            {options.map((opt, index) => (
                                <div key={index} className="option-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder={`Option ${index + 1}`}
                                        value={opt}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            className="remove-option-btn"
                                            onClick={() => handleRemoveOption(index)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {options.length < 5 && (
                            <button
                                type="button"
                                className="add-option-btn"
                                onClick={handleAddOption}
                            >
                                <Plus size={16} /> Add Option
                            </button>
                        )}
                    </div>

                    <div className="poll-creator-actions">
                        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
                        <button
                            type="submit"
                            className="create-btn"
                            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                        >
                            Create Poll
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PollCreator;
