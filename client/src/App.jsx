import { useState } from 'react';
import SetupPage from './components/SetupPage';
import EmailDashboard from './components/EmailDashboard';
import './App.css';

function App() {
    const [isConfigured, setIsConfigured] = useState(false);

    return (
        <div className="container">
            <h1>📧 MERN Email Backup</h1>
            {isConfigured ? (
                <EmailDashboard />
            ) : (
                <SetupPage onConfigured={() => setIsConfigured(true)} />
            )}
        </div>
    );
}

export default App;