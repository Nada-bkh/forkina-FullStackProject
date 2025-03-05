// AddProject.jsx

import { useState } from 'react';
import axios from 'axios';

const AddProject = () => {
    const [name, setName] = useState('');
    const [githubLink, setGithubLink] = useState('');
    const [subject, setSubject] = useState('');
    const [level, setLevel] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('/api/projects', {
                name,
                githubLink,
                subject,
                level,
            });
            console.log('Project added:', response.data);
        } catch (error) {
            console.error('Error creating project:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Project Name:
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </label>
            <label>
                GitHub Link:
                <input
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    required
                />
            </label>
            <label>
                Subject:
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                />
            </label>
            <label>
                Level:
                <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    required
                />
            </label>
            <button type="submit">Add Project</button>
        </form>
    );
};

export default AddProject;
