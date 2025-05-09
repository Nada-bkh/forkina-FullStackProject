// src/pages/tutor/SonarQubeDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SonarQubeDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/git/repositories`, {
                    withCredentials: true,
                });

                console.log("Fetched repositories:", res.data);

                // Adjust this according to your actual backend response structure
                const repos = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data.repositories)
                        ? res.data.repositories
                        : [];

                const sonarqubeProjects = repos.filter(
                    (repo) => repo.sonarProjectKey && repo.sonarProjectKey !== ''
                );

                setProjects(sonarqubeProjects);

                const metricPromises = sonarqubeProjects.map((project) =>
                    axios.get(`${import.meta.env.VITE_API_URL}/metrics/sonarqube/${project.sonarProjectKey}`, {
                        withCredentials: true,
                    })
                );

                const metricsResponses = await Promise.all(metricPromises);
                const allMetrics = metricsResponses.map((response, index) => ({
                    projectKey: sonarqubeProjects[index].sonarProjectKey,
                    metrics: response.data,
                }));

                setMetrics(allMetrics);
            } catch (err) {
                console.error("Error fetching projects or metrics:", err);
            }
        };


        fetchProjects();
    }, []);

    if (loading) {
        return <div className="p-6 text-center text-lg font-semibold">Loading SonarQube data...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">SonarQube Dashboard</h1>

            {projects.length === 0 ? (
                <p className="text-gray-600">No SonarQube-enabled projects found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => {
                        const projectMetrics = metrics[project.sonarProjectKey] || [];
                        return (
                            <div
                                key={project.sonarProjectKey}
                                className="bg-white rounded-xl shadow p-5 border hover:shadow-lg transition"
                            >
                                <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Sonar Key: {project.sonarProjectKey}
                                </p>
                                <ul className="space-y-1 text-sm">
                                    {projectMetrics.map(metric => (
                                        <li key={metric.metric}>
                                            <span className="font-medium capitalize">{metric.metric.replace(/_/g, ' ')}:</span>{' '}
                                            {metric.value}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SonarQubeDashboard;
