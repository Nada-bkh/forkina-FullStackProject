import React, { useState, useEffect } from 'react';
import { ExternalLink, ArrowRight, Code, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const SonarQubeDashboard = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // Sample data - in a real app, this would come from the SonarQube API
    const projectStats = {
        codeQuality: 'A',
        bugs: 12,
        vulnerabilities: 3,
        codeSmells: 47,
        coverage: 78.5,
        duplications: 4.2,
        lastScan: '2 hours ago'
    };

    // Simulate loading data when component mounts
    useEffect(() => {
        // In a real implementation, this would be an API call to fetch the SonarQube data
        const fetchData = async () => {
            setIsDataLoading(true);
            // Simulate API request
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Data would be set here from the API response
            setIsDataLoading(false);
        };

        fetchData();
    }, []);

    const handleRedirect = () => {
        setIsLoading(true);
        // In production, you might want to track this click
        window.open('http://alabenkhlifa.ddns.net:9000/projects', '_blank');
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleRefresh = async () => {
        setIsDataLoading(true);
        // Simulate API request
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsDataLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <header className="border-b pb-4 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Code Quality Dashboard</h1>
                        <p className="text-gray-600 mt-2">Powered by SonarQube</p>
                    </div>
                    <button
                        onClick={handleRedirect}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#dd2825] text-white rounded-md hover:bg-[#c22320] transition focus:outline-none focus:ring-2 focus:ring-[#dd2825] focus:ring-opacity-50 disabled:opacity-70"
                    >
                        {isLoading ? 'Opening...' : 'Access SonarQube'}
                        <ExternalLink size={16} />
                    </button>
                </div>
            </header>

            {isDataLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <RefreshCw size={40} className="text-[#dd2825] animate-spin mb-4" />
                    <p className="text-gray-600">Loading quality report...</p>
                </div>
            ) : (
                <>
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-700">Project Overview</h2>
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-1 text-sm text-[#dd2825] hover:text-[#c22320]"
                            >
                                <RefreshCw size={14} />
                                Refresh
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500">Quality Gate</p>
                                        <p className="text-lg font-bold">{projectStats.codeQuality}</p>
                                    </div>
                                    <div className={`text-2xl font-bold ${projectStats.codeQuality === 'A' ? 'text-green-500' : 'text-yellow-500'}`}>
                                        <CheckCircle size={32} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500">Code Coverage</p>
                                        <p className="text-lg font-bold">{projectStats.coverage}%</p>
                                    </div>
                                    <div className="w-16 h-16 relative">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#e6e6e6"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#dd2825"
                                                strokeWidth="3"
                                                strokeDasharray={`${projectStats.coverage}, 100`}
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-500">Last Analysis</p>
                                <p className="text-lg font-bold">{projectStats.lastScan}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Issues</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center p-4 bg-[#fef2f2] rounded-lg border border-[#fee2e2]">
                                <XCircle size={24} className="text-[#dd2825] mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">Bugs</p>
                                    <p className="text-lg font-bold">{projectStats.bugs}</p>
                                </div>
                            </div>

                            <div className="flex items-center p-4 bg-[#fef2f2] rounded-lg border border-[#fee2e2]">
                                <AlertTriangle size={24} className="text-[#dd2825] mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">Vulnerabilities</p>
                                    <p className="text-lg font-bold">{projectStats.vulnerabilities}</p>
                                </div>
                            </div>

                            <div className="flex items-center p-4 bg-[#fef2f2] rounded-lg border border-[#fee2e2]">
                                <Code size={24} className="text-[#dd2825] mr-3" />
                                <div>
                                    <p className="text-sm text-gray-500">Code Smells</p>
                                    <p className="text-lg font-bold">{projectStats.codeSmells}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center mt-6">
                        <button
                            onClick={handleRedirect}
                            className="flex items-center gap-2 px-6 py-3 bg-[#dd2825] text-white rounded-md hover:bg-[#c22320] transition"
                        >
                            View Full Report in SonarQube
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </>
            )}

            <footer className="text-center text-gray-500 text-sm mt-8 pt-4 border-t">
                <p>Automated code quality analysis results - updated in real-time</p>
            </footer>
        </div>
    );
};

export default SonarQubeDashboard;